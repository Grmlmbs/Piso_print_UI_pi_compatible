// server.js (Pi-optimized single-file refactor)
// Dependencies
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { PDFDocument } = require('pdf-lib');
const fsPromise = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const db = require('./db');
const execPromise = promisify(exec);

const app = express();
app.use(express.json());

// DB pragmas (if using better-sqlite3 wrapper that supports pragma)
try {
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 3000');
} catch (e) {
    console.warn('DB pragma warning (ok if using different DB wrapper):', e.message);
}

// ----- Directories (safe, cross-platform) -----
const root = __dirname;
const uploadsDir = path.join(root, 'uploads');
const cacheDir = path.join(root, 'cache');
const letterCache = path.join(cacheDir, 'letter');
const legalCache = path.join(cacheDir, 'legal');

for (const d of [uploadsDir, letterCache, legalCache]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ----- Multer setup -----
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        // safe filename: timestamp + sanitized original name
        const safe = Date.now() + '-' + path.basename(file.originalname).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
        cb(null, safe);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'));
    }
});

app.use(express.static(path.join(root, 'public')));
app.use('/uploads', express.static(uploadsDir));
app.use('/cache', express.static(cacheDir));

// ----- Helpers -----
const clearCache = async (folder) => {
    try {
        const files = await fsPromise.readdir(folder);
        await Promise.all(files
            .filter(f => f.endsWith('.png'))
            .map(f => fsPromise.unlink(path.join(folder, f)).catch(()=>{})));
    } catch (e) {
        console.error('clearCache error for', folder, e.message);
    }
};

async function convertToBWIfNeeded(filePath, colorMode) {
    if (colorMode === 'bw') {
        try {
            // Overwrite the file with its grayscale version
            await sharp(filePath)
                .grayscale() // Convert to Black & White
                .toFile(filePath + '.bw.png'); // Save to a temp file
            
            // Rename to overwrite the original file (more memory efficient than streaming in place)
            await fsPromise.rename(filePath + '.bw.png', filePath);

        } catch (e) {
            console.error('Error converting to BW:', filePath, e.message);
            // Non-fatal, just proceed with the original file if conversion fails
        }
    }
}


async function convertPdfToPngsWithGhostscript(pdfPath, outDir, baseName) {
    // FIX 1: Change to %d for non-zero-padded page numbers (e.g., _1.png)
    const outputPattern = path.join(outDir, `${baseName}_%d.png`);
    const resolution = 72; // Resolution (DPI)

    // Use png16m for non-transparent, white background
    const gsCommand = `gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r${resolution} -sOutputFile=${outputPattern} ${pdfPath}`;

    try {
        const { stdout, stderr } = await execPromise(gsCommand);
        
        if (stderr && !stderr.includes('Warning')) {
            throw new Error(`Ghostscript Error: ${stderr}`);
        }

        // Ghostscript succeeded. Find the generated files.
        const files = await fsPromise.readdir(outDir);
        const pngPaths = files
            .filter(f => f.startsWith(baseName + '_') && f.endsWith('.png'))
            .map(f => path.join(outDir, f));

        if (pngPaths.length === 0) {
            throw new Error('Ghostscript finished, but no PNG files found. The PDF may be corrupted or missing content.');
        }

        return pngPaths;

    } catch (e) {
        console.error('--- CRITICAL GHOSTSCRIPT CONVERSION FAILED. ---');
        console.error(e);
        throw new Error('Ghostscript conversion failed: ' + e.message);
    }
}

// FIX 2: Updated resizePDF for Top Alignment (replication of oldserver.js logic)
async function resizePDF(inputPath, outputPath, targetWidth, targetHeight) {
    const existingBytes = await fsPromise.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingBytes);
    
    // Create a new document to hold the resized pages
    const newPdfDoc = await PDFDocument.create();

    const pages = pdfDoc.getPages();
    for (const page of pages) {
        
        const embeddedPage = await newPdfDoc.embedPage(page);

        // 1. Get size and sanitize
        const { width, height } = embeddedPage.size;
        
        const sanitizedWidth = isNaN(width) ? 1 : width;
        const sanitizedHeight = isNaN(height) ? 1 : height;

        const safeWidth = Math.max(1, sanitizedWidth);
        const safeHeight = Math.max(1, sanitizedHeight);

        // 2. Add a new page with the target size
        const newPage = newPdfDoc.addPage([targetWidth, targetHeight]);
        
        // --- START SQUISHED FIX ---
        // Calculate the necessary scaling factors for X and Y to fill the page
        const scaleX = targetWidth / safeWidth;
        const scaleY = targetHeight / safeHeight;

        // Draw the embedded page onto the new page, stretched to fill the entire area
        newPage.drawPage(embeddedPage, {
            x: 0, // Start drawing from the bottom-left
            y: 0,
            width: safeWidth * scaleX,  // Will equal targetWidth
            height: safeHeight * scaleY, // Will equal targetHeight
        });
        // --- END SQUISHED FIX ---
    }

    const pdfBytes = await newPdfDoc.save();
    await fsPromise.writeFile(outputPath, pdfBytes);
}

// Scan used sections (non-blocking): divides image into 12 horizontal bands and checks if any pixel not grey (i.e., used)
async function scanUsedSections(filePath) {
    const img = sharp(filePath).ensureAlpha().removeAlpha(); // get RGB
    const { width, height } = await img.metadata();
    // Request raw RGB buffer
    const rawBuffer = await img.raw().toBuffer(); // may be large but ok for single-page images

    const sectionHeight = Math.max(1, Math.floor(height / 12));
    let totalUsedSections = 0;

    for (let i = 0; i < 12; i++) {
        let used = false;
        const yStart = i * sectionHeight;
        const yEnd = (i === 11) ? height : (i + 1) * sectionHeight;

        for (let y = yStart; y < yEnd && !used; y++) {
            const rowStartIdx = y * width * 3;
            for (let x = 0; x < width; x++) {
                const idx = rowStartIdx + x * 3;
                const r = rawBuffer[idx];
                const g = rawBuffer[idx + 1];
                const b = rawBuffer[idx + 2];

                // if not grayscale (r == g == b) then there's color/ink (used)
                if (!(r === g && g === b)) {
                    used = true;
                    break;
                }
            }
        }

        if (used) totalUsedSections++;
    }

    return totalUsedSections;
}

// ----- Routes -----
// DELETE last uploaded caches and pdfs
app.delete('/delete-last/:baseName', async (req, res) => {
    const baseName = String(req.params.baseName || '').replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!baseName) return res.json({ success: false, message: 'Invalid basename' });

    try {
        // remove cached pngs
        for (const folder of [letterCache, legalCache]) {
            const files = await fsPromise.readdir(folder);
            // FIX 3: Check for both baseName_ and baseName- prefixes for cleanup
            await Promise.all(files.filter(f => f.startsWith(baseName + '_') || f.startsWith(baseName + '-')).map(f => fsPromise.unlink(path.join(folder, f)).catch(()=>{})));
        }
        // remove resized pdfs if present
        const letterPDF = path.join(uploadsDir, baseName + '_letter.pdf');
        const legalPDF = path.join(uploadsDir, baseName + '_legal.pdf');
        await Promise.all([letterPDF, legalPDF].map(f => fsPromise.unlink(f).catch(()=>{})));
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: err.message });
    }
});

// UPLOAD and convert
app.post('/upload', async (req, res) => {
    let uploadedPath;
    try {
        await new Promise((resolve, reject) => {
            upload.single('pdfFile')(req, res, err => err ? reject(err) : resolve());
        });

        if (!req.file) return res.json({ success: false, message: 'No file uploaded' });
        
        // If we reach here, the file was successfully saved to disk by Multer.
        uploadedPath = path.join(uploadsDir, req.file.filename);
        const baseName = path.parse(req.file.filename).name;

        // ... (rest of the upload logic, which starts with clearing caches) ...

        // clear caches first
        await Promise.all([clearCache(letterCache), clearCache(legalCache)]);

        // read pdf to get pagecount and first page size
        const existingBytes = await fsPromise.readFile(uploadedPath);
        const pdfDoc = await PDFDocument.load(existingBytes);
        const totalPages = pdfDoc.getPageCount();

        const firstPage = pdfDoc.getPage(0);
        const { width: origW, height: origH } = firstPage.getSize();

        // Heuristic for originalSize
        let originalSize = (Math.round(origW) === 612 && Math.round(origH) === 792) ? 'letter'
            : (Math.round(origW) === 612 && Math.round(origH) === 1008) ? 'legal'
            : (origH > 900 ? 'legal' : 'letter');

        const letterPDF = path.join(uploadsDir, baseName + '_letter.pdf');
        const legalPDF = path.join(uploadsDir, baseName + '_legal.pdf');

        // create resized pdfs (async)
        await Promise.all([
            resizePDF(uploadedPath, letterPDF, 612, 792),
            resizePDF(uploadedPath, legalPDF, 612, 1008)
        ]);

        // Convert to PNG images with Ghostscript
	const letterPngPaths = await convertPdfToPngsWithGhostscript(letterPDF, letterCache, baseName);
	const legalPngPaths = await convertPdfToPngsWithGhostscript(legalPDF, legalCache, baseName);
        // return web paths (relative to server)
	const letterImages = letterPngPaths.map(p => '/cache/letter/' + path.basename(p));
        const legalImages = legalPngPaths.map(p => '/cache/legal/' + path.basename(p));

        // Optionally remove the original uploaded file (to save space)
        await fsPromise.unlink(uploadedPath).catch(()=>{});

        // respond with images
        return res.json({
            success: true,
            images: { letter: letterImages, legal: legalImages },
            totalPages,
            originalSize,
            baseName
        });

    } catch (err) {
        console.error('*** CRITICAL UPLOAD CRASH DETECTED ***');
        console.error(err);
        if (uploadedPath) {
            fsPromise.unlink(uploadedPath).catch(()=>{}); // clean up partial uploads
        }
        return res.json({ success: false, message: (err && err.message) || 'Conversion failed' });
    }
});

// Calculate cost (uses cached pngs)
app.post('/calculate-cost', async (req, res) => {
    try {
        const { paper, baseName, color, pages, copies } = req.body;
        if (!paper || !baseName) return res.json({ success: false, message: 'Missing params' });
        const selectedPages = String(pages || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        if (!selectedPages.length) return res.json({ success: false, message: 'No pages selected' });

        const dir = path.join(cacheDir, String(paper));
        const files = await fsPromise.readdir(dir);
        // match file numbers present in selectedPages
        const matched = files
            .filter(f => f.startsWith(baseName + '_')) 
            .filter(f => {
                // 2. Extract page number using the correct prefix: baseName + '_'
                const pageNumStr = f.replace(baseName + '_', '').replace('.png','');
                
                // 3. Convert to number and check against selectedPages
                const pg = Number(pageNumStr);
                return selectedPages.includes(pg);
            })
            .sort((a,b) => {
                // Sorting logic also needs to be updated for the correct prefix
                const na = Number(a.replace(baseName + '_', '').replace('.png',''));
                const nb = Number(b.replace(baseName + '_', '').replace('.png',''));
                return na - nb;
            });

        if (matched.length === 0) return res.json({ success: false, message: 'No cached images found.' });

        let totalUsedSections = 0;
        // process sequentially to avoid memory spike on Pi
        for (const f of matched) {
            const full = path.join(dir, f);
            await convertToBWIfNeeded(full, color);
            const used = await scanUsedSections(full);
            totalUsedSections += used;
        }

	const baseCost = (color === 'color') ? 10 : 5;
        const totalPages = matched.length;
        
        // FIX: Calculate section charge based on color mode.
        // The charge is only applied if color is 'color'. Otherwise, it is 0.
        const sectionCharge = (color === 'color') ? totalUsedSections * 0.5 : 0;
        
        // Update total cost calculation to use the conditional sectionCharge
        const totalCost = Math.round((baseCost * totalPages + sectionCharge) * Number(copies || 1));

        return res.json({ success: true, totalCost, usedSections: totalUsedSections, totalPages });

    } catch (err) {
        console.error('calculate-cost error:', err);
        return res.json({ success: false, message: err.message });
    }
});

// Transaction create
app.post('/transaction/create', (req, res) => {
    try {
        let { Date: dateString, Amount, Color, Pages, Copies, Paper_Size, File_Path, File_Size, Status } = req.body;

        if (!dateString || isNaN(new Date(dateString))) return res.json({ success: false, message: "Invalid date." });
        Amount = Number(Amount); Copies = Number(Copies);
        if (isNaN(Amount) || Amount < 0) Amount = 0;
        if (isNaN(Copies) || Copies < 1) return res.json({ success: false, message: "Invalid number of copies." });

        const allowedColors = ["bw", "color"];
        if (!allowedColors.includes(Color)) return res.json({ success: false, message: "Invalid color selection." });

        if (typeof Pages !== "string" || !Pages.match(/^[0-9,\-\s]+$/)) return res.json({ success: false, message: "Invalid page selection." });
        const allowedSizes = ["letter", "legal"];
        if (!allowedSizes.includes(Paper_Size)) return res.json({ success: false, message: "Invalid paper size." });
        if (typeof File_Path !== "string" || File_Path.length > 200) return res.json({ success: false, message: "Invalid file path." });

        const allowedStatuses = ["pending", "printing", "completed", "cancelled"];
        if (!allowedStatuses.includes(Status)) Status = "pending";

        const createTx = db.transaction(() => {
            const stmt = db.prepare(`
                INSERT INTO Transactions
                (Date, Amount, Color, Pages, Copies, Paper_Size, File_Path, File_Size, Status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            return stmt.run(dateString, Amount, Color, Pages, Copies, Paper_Size, File_Path, File_Size, Status);
        });

        const result = createTx();
        res.json({ success: true, id: result.lastInsertRowid });

    } catch (error) {
        console.error('transaction/create error', error);
        res.json({ success: false, message: error.message });
    }
});

// Transaction update
app.post('/transaction/update', (req, res) => {
    try {
        const { id, Amount, Status } = req.body;
        const allowedStatuses = ["pending", "printing", "completed", "cancelled"];
        const safeStatus = allowedStatuses.includes(Status) ? Status : "pending";
        const safeAmount = isNaN(Number(Amount)) ? 0 : Number(Amount);

        const updateTx = db.transaction(() => {
            const stmt = db.prepare(`
                UPDATE Transactions
                SET Amount = ?, Status = ?
                WHERE Transaction_Id = ?
            `);
            return stmt.run(safeAmount, safeStatus, id);
        });

        updateTx();
        res.json({ success: true });

    } catch (err) {
        console.error('transaction/update error', err);
        res.json({ success: false, message: err.message });
    }
});
// Global Error Handler (Crucial for catching Multer errors)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('CRITICAL MULTER ERROR:', err);
        return res.status(500).json({ success: false, message: `Upload error: ${err.code}` });
    } else if (err) {
        console.error('CRITICAL SERVER ERROR:', err.stack);
        return res.status(500).json({ success: false, message: 'Server error during upload.' });
    }
    next();
});

// start server (bind 0.0.0.0 so other devices on network can access captive portal)
const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
