document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // DOM ELEMENTS
    // =========================
    const form = document.getElementById("uploadForm");
    const preview = document.getElementById("preview");
    const fileInput = form.querySelector("input[type='file']");
    const uploadButton = document.getElementById("uploadBtn");
    const pageMode = document.getElementById("pageMode");
    const pagesInput = document.getElementById("pages");
    const customWrapper = document.getElementById("customPageWrapper");
    const copiesInput = document.getElementById("copies");
    const colorSelect = document.getElementById("color");
    const paperSelect = document.getElementById("paperSize");
    //const clearButton = document.getElementById("clearBtn");
    const proceedBtn = document.getElementById("proceedBtn");
    const previewOverlay = document.getElementById("preview-overlay");
    const overlayText = document.getElementById("overlay-text");
    const loaderSpinner = document.getElementById("loader-spinner");
    // Elements to control for the disabled state
    const settingsElements = [
        pageMode, copiesInput, colorSelect, paperSelect, proceedBtn
    ];

    // =========================
    // GLOBAL STATE
    // =========================
    let lastUploadedBaseName = null;
    let totalPages = 0;
    let allPagesImages = { letter: [], legal: [] };
    let lastUploadedSize = 0;
    
    // =========================
    // HELPER: CONTROL SETTINGS STATE
    // =========================
    let timeout;

    function resetTimer() {
        clearTimeout(timeout);
        // If no action for 120 seconds, go back to home and wipe data
        timeout = setTimeout(() => {
            sessionStorage.clear();
            window.location.href = "/"; 
        }, 120000); 
    }

    // Reset the timer whenever the user clicks or touches the screen
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();
    
    function setSettingsDisabledState(isDisabled) {
        // Disable/enable main settings elements
        settingsElements.forEach(el => {
            el.disabled = isDisabled;
        });
        
        // Special case for pagesInput: it's only enabled if pageMode is 'custom' AND the whole settings block is enabled
        const isCustom = pageMode.value === "custom";
        pagesInput.disabled = isDisabled || !isCustom;
        
        // Clear button is enabled only if there's an uploaded file
        //clearButton.disabled = isDisabled || !lastUploadedBaseName;
    }

    // =========================
    // INITIALIZATION
    // =========================
    setSettingsDisabledState(true); // <--- DISABLES ALL SETTINGS ON LOAD

    // =========================
    // PAGE MODE HANDLER
    // =========================
    pageMode.addEventListener("change", () => {
        const isCustom = pageMode.value === "custom";
        // pagesInput is enabled only if the mode is custom AND a file is uploaded
        pagesInput.disabled = !isCustom || !lastUploadedBaseName;
        customWrapper.classList.toggle("show", isCustom);

        if (!isCustom) pagesInput.value = "";
        updatePreview();
        saveState();
    });

    // =========================
    // RESET FORM
    // =========================
    
uploadButton.addEventListener("click", () => {
    fileInput.click();
});
// =========================
    // PERSISTENCE LOGIC
    // =========================

    function saveState() {
        const state = {
            lastUploadedBaseName,
            totalPages,
            allPagesImages,
            lastUploadedSize,
            color: colorSelect.value,
            pageMode: pageMode.value,
            customPages: pagesInput.value,
            copies: copiesInput.value,
            paperSize: paperSelect.value,
            transactionId: window.currentTransactionId // Keep track of DB row
        };
        // Store as a string in the browser's tab-specific memory
        sessionStorage.setItem("pisoPrintState", JSON.stringify(state));
    }

    function loadState() {
        const saved = sessionStorage.getItem("pisoPrintState");
        if (!saved) return; // Nothing saved, start fresh

        try {
            const state = JSON.parse(saved);
            
            // Restore Global Variables
            lastUploadedBaseName = state.lastUploadedBaseName;
            totalPages = state.totalPages;
            allPagesImages = state.allPagesImages;
            lastUploadedSize = state.lastUploadedSize;
            window.currentTransactionId = state.transactionId;

            // Restore Form Inputs
            colorSelect.value = state.color;
            pageMode.value = state.pageMode;
            pagesInput.value = state.customPages;
            copiesInput.value = state.copies;
            paperSelect.value = state.paperSize;

            // If a file was already uploaded, re-enable the UI and show thumbnails
            if (lastUploadedBaseName) {
                setSettingsDisabledState(false);
                const isCustom = pageMode.value === "custom";
                pagesInput.disabled = !isCustom;
                customWrapper.classList.toggle("show", isCustom);
                updatePreview();
            }
        } catch (e) {
            console.error("Error loading saved state:", e);
            sessionStorage.removeItem("pisoPrintState");
        }
    }

    // CRITICAL: Call loadState immediately when the page loads
    loadState();
async function resetForm() {
        form.reset();
        sessionStorage.removeItem("pisoPrintState");
        preview.innerHTML = "";

        totalPages = 0;
        allPagesImages = { letter: [], legal: [] };
        
        // Disable settings and clear pageInput explicitly
        setSettingsDisabledState(true);
        pagesInput.value = ""; 

        // Force defaults
        colorSelect.value = "bw"; 
        paperSelect.value = "letter";
        
        // Notify the UI to refresh based on these defaults
        colorSelect.dispatchEvent(new Event('change'));
        paperSelect.dispatchEvent(new Event('change'));

        if (lastUploadedBaseName) {
            try {
                const res = await fetch(`/delete-last/${lastUploadedBaseName}`, {
                    method: "DELETE"
                });
                const result = await res.json();
                console.log("Deleted previous files:", result);
            } catch (err) {
                console.error("Delete error:", err);
            }
            lastUploadedBaseName = null;
        }
    }
/*
    clearButton.addEventListener("click", e => {
        e.preventDefault();
        resetForm();
    });
*/
    // =========================
    // CUSTOM PAGE PARSING
    // =========================
function parsePageSelection(input, totalPages) {
    if (!input || !totalPages) return [];

    const pages = new Set();
    const parts = input.split(",");
    
    parts.forEach(part => {
        part = part.trim();
        
        // Handle Ranges (e.g., 1-10)
        if (part.includes("-")) {
            const rangeParts = part.split("-");
            if (rangeParts.length === 2) {
                let start = parseInt(rangeParts[0]);
                let end = parseInt(rangeParts[1]);
                
                if (!isNaN(start) && !isNaN(end)) {
                    // VALIDATION: Keep values between 1 and the actual totalPages
                    const s = Math.max(1, Math.min(start, totalPages));
                    const e = Math.max(1, Math.min(end, totalPages));
                    
                    const realStart = Math.min(s, e);
                    const realEnd = Math.max(s, e);
                    
                    for (let i = realStart; i <= realEnd; i++) {
                        pages.add(i);
                    }
                }
            }
        }
        // Handle Single Numbers (e.g., 5)
        else {
            const num = parseInt(part);
            // VALIDATION: Only add if the number is within 1 and totalPages
            if (!isNaN(num) && num >= 1 && num <= totalPages) {
                pages.add(num);
            }
        }
    });

    // Convert Set to Array and sort numerically
    return Array.from(pages).sort((a, b) => a - b);
}

    function getSelectedPages() {
        if (!totalPages) return [];

        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        switch (pageMode.value) {
            case "all": return pages;
            case "odd": return pages.filter(n => n % 2 !== 0);
            case "even": return pages.filter(n => n % 2 === 0);
            case "custom": return parsePageSelection(pagesInput.value, totalPages);
            default: return [];
        }
    }

    // =========================
    // PREVIEW RENDERING
    // =========================
    // 💡 FIX: Now accepts total page count separately
    function handlePreviewImages(images, count) {
        allPagesImages = images;
        totalPages = count; // <--- CORRECTLY set using the server's count
    }

    function renderPreview(pages, selectedPages, colorMode) {
        preview.innerHTML = "";

        if (!pages?.length) {
            // 💡 ADDED MESSAGE: This explains *why* the preview is blank
            preview.innerHTML = "<p>PDF converted successfully. Waiting for images to be generated... (If this persists, check server logs)</p>";
            return;
        }

        selectedPages.forEach(num => {
            const src = pages[num - 1];
            if (!src) return;

            const img = document.createElement("img");
            img.src = src;

            if (colorMode === "bw") img.classList.add("bw");

            preview.appendChild(img);
        });
    }

function updatePreview() {
    // 1. Sanitize input
    if (copiesInput.value.includes(".")) {
        copiesInput.value = Math.floor(parseFloat(copiesInput.value) || 1);
    }
    
    const selectedPages = getSelectedPages();
    const numCopies = Math.max(1, Math.floor(parseFloat(copiesInput.value) || 1));
    const totalItemsToPrint = selectedPages.length * numCopies;
    
    // 2. DRAW IMAGES FIRST
    const currentPaper = paperSelect.value;
    const images = allPagesImages[currentPaper];
    
    if (selectedPages.length === 0 && pageMode.value === "custom") {
        // Don't clear preview if user is mid-typing
        return; 
    }

    const oldImages = preview.querySelectorAll("img");
    oldImages.forEach(img => img.remove());
    
    selectedPages.forEach(pNum => {
        const idx = pNum - 1;
        if (images[idx]) {
            const img = document.createElement("img");
            img.src = images[idx];
            img.classList.add("preview-thumb");
            if (colorSelect.value === "bw") img.style.filter = "grayscale(100%)";
            preview.appendChild(img);
        }
    });

    // 3. SHOW WARNINGS LAST
    const limitWarning = document.getElementById("limit-warning");
    
    // Check if current selection exceeds limit OR if it's a fresh upload > 5 pages
    if (totalItemsToPrint > 5 || (totalPages > 5 && selectedPages.length === 0)) {
        
        preview.classList.add("no-scroll");
        preview.scrollTop = 0;
        
        proceedBtn.disabled = true;
        proceedBtn.style.opacity = "0.5";
        
        // Ensure overlay is visible and spinner is hidden
        previewOverlay.classList.remove("hidden");
        loaderSpinner.style.display = "none";

        let message = `Limit Exceeded! Selection: ${totalItemsToPrint}. Max: 5.`;
        if (totalPages > 5 && selectedPages.length === 0) {
            message = `File Too Large! This file has ${totalPages} pages. Use 'Custom' to select 5 or fewer.`;
        }

        overlayText.innerHTML = `<span style="color:red; font-weight:bold;">Limit Exceeded!</span><br>` +
                                `You have ${totalItemsToPrint} pages/copies selected.<br>` +
                                `Please reduce to 5 or fewer.`;
        
        if (limitWarning) {
            limitWarning.innerText = message;
            limitWarning.style.display = "block";
        }
    } else {
        // Only hide if we aren't currently BUSY with another upload
        preview.classList.remove("no-scroll");
        
        if (!form.classList.contains("uploading")) {
            previewOverlay.classList.add("hidden");
            proceedBtn.disabled = false;
            proceedBtn.style.opacity = "1";
            if (limitWarning) limitWarning.style.display = "none";
        }
    }
}

    // Live update handlers
    [pagesInput, copiesInput].forEach(el => el.addEventListener("input", () => {
    updatePreview();
    saveState();
    }));

    [colorSelect, paperSelect, pageMode].forEach(el => el.addEventListener("change", () => {
    updatePreview();
    saveState();
    }));
    // =========================
    // FILE UPLOAD HANDLER
    // =========================

/*    
   form.addEventListener("submit", async e => {
    e.preventDefault();
    
    // 1. Setup UI for loading
    form.classList.add("uploading");
    const oldImages = preview.querySelectorAll("img");
    oldImages.forEach(img => img.remove());
    
    previewOverlay.classList.remove("hidden");
    loaderSpinner.style.display = "block";
    overlayText.innerText = "Processing PDF...Please wait.";

    const file = fileInput.files[0];
    if (!file) return alert("Please select a PDF.");

    const formData = new FormData();
    formData.append("pdfFile", file);

    try {
        const response = await fetch("/upload", { method: "POST", body: formData });
        const result = await response.json();

        if (!result.success) return alert(result.message || "Upload failed.");

        // 2. Set global data
        lastUploadedBaseName = result.baseName;
        totalPages = result.totalPages; // CRITICAL: Update global page count
        lastUploadedSize = result.fileSize || 0;
        handlePreviewImages(result.images, result.totalPages); 
        
        // 3. Clear the 'uploading' state BEFORE calling updatePreview
        // This ensures updatePreview logic can control the overlay
        form.classList.remove("uploading");

        setSettingsDisabledState(false);
        
        // Auto select color mode
        if (result.detectedColor) {
            colorSelect.value = result.detectedColor;
        }

        // Auto select paper size mode
        if (["letter", "legal"].includes(result.originalSize)) {
            paperSelect.value = result.originalSize;
        }

        // 4. TRIGGER FINAL UI CHECK
        // This will now show the thumbnails AND the warning if > 5 pages
        updatePreview();

    } catch (err) {
        console.error(err);
        alert("Upload error.");
        // If it failed, we should hide the overlay
        previewOverlay.classList.add("hidden");
        form.classList.remove("uploading");
    }
});
*/
    // BACK BUTTON
    const backToLandingBtn = document.getElementById("backToLandingBtn");

    if (backToLandingBtn) {
        backToLandingBtn.addEventListener("click", () => {
            // 1. Clear the browser's session memory (Wipes PDF info and settings)
            sessionStorage.removeItem("pisoPrintState");
        
            // 2. Clear the transaction ID (Ensures the next user gets a new DB row)
            window.currentTransactionId = null;

            // 3. Redirect to your landing page
            // Use "/" if it's your root, or "index.html" / "landing.html"
            window.location.href = "/"; 
        });
    }
    
    // =========================
    // PROCEED BUTTON
    // =========================
    proceedBtn.addEventListener("click", async () => {
        if (!lastUploadedBaseName) return alert("Upload a PDF first.");

        const selectedPages = getSelectedPages();
        // The check remains, but now totalPages should be correct
        if (!selectedPages.length) return alert("Select pages first."); 

        const saved = sessionStorage.getItem("pisoPrintState");
        const state = saved ? JSON.parse(saved) : {};
        const existingId = state.transactionId || null;
        
        if (typeof showLoading === "function") {
            showLoading("Creating transaction and calculating costs...");
        }
        
        setTimeout(async () => {
        const data = {
            id: existingId,
            Date: new Date().toISOString(),
            Amount: 0,
            Color: colorSelect.value,
            Pages: selectedPages.join(","),
            Copies: copiesInput.value,
            Paper_Size: paperSelect.value,
            File_Path: lastUploadedBaseName,
            File_Size: (lastUploadedSize || 0).toString(),
            Status: "pending"
        };

        try {
            
            await fetch('/balance/start-session', { method: 'POST' });
            const response = await fetch("/transaction/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) {
                hideLoading();
                return alert(result.message || "Transaction failed.");
            }
            
            state.transactionId = result.id;
            sessionStorage.setItem("pisoPrintState", JSON.stringify(state));
            
            const query = `?id=${result.id}&pages=${data.Pages}&copies=${data.Copies}` +
                      `&color=${data.Color}&paper=${data.Paper_Size}&baseName=${data.File_Path}`;

        window.location.href = `/cost.html${query}`;
        } catch (err) {
            console.error(err);
            hideLoading();
            alert("Error creating transaction.");
        }
    }, 500);
    });
    
    copiesInput.addEventListener("keydown", (e) => {
        if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    copiesInput.addEventListener("paste", (e) => {
        const pasteData = e.clipboardData.getData('text');
        if (pasteData.includes(".") || pasteData.includes(",")) {
            e.preventDefault();
        }
    });
    
    copiesInput.addEventListener("blur", () => {
        copiesInput.value = Math.floor(copiesInput.value) || 1;
    });
    
    // Clear the fields and preview whenever there were change of mind uploads
    // 3. Trigger the upload process automatically when a file is selected
fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // 1. FULL RESET: Clear old state before starting the new upload
    // This ensures copies, page modes, and internal variables are wiped
    sessionStorage.removeItem("pisoPrintState");
    lastUploadedBaseName = null; 
    totalPages = 0;
    allPagesImages = { letter: [], legal: [] };
    
    // 2. UI RESET: Clear preview and show loading
    form.classList.add("uploading");
    preview.classList.remove("no-scroll");
    
    previewOverlay.classList.remove("hidden");
    loaderSpinner.style.display = "block";
    overlayText.innerText = "Processing PDF...Please wait.";

    // 3. FIELD RESET: Set inputs back to defaults
    colorSelect.value = "bw"; 
    paperSelect.value = "letter";
    pageMode.value = "all";
    pagesInput.value = "";
    copiesInput.value = "1";
    customWrapper.classList.remove("show");

    const formData = new FormData();
    formData.append("pdfFile", file);

    try {
        const response = await fetch("/upload", { method: "POST", body: formData });
        const result = await response.json();

        if (!result.success) {
            alert(result.message || "Upload failed.");
            previewOverlay.classList.add("hidden");
            form.classList.remove("uploading");
            setSettingsDisabledState(true);
            return;
        }

        // 4. APPLY NEW DATA: Populate state with the new file's info
        lastUploadedBaseName = result.baseName;
        totalPages = result.totalPages; 
        lastUploadedSize = result.fileSize || 0;
        handlePreviewImages(result.images, result.totalPages); 
        
        form.classList.remove("uploading");
        setSettingsDisabledState(false);
        
        // Use server-detected defaults if available
        if (result.detectedColor) colorSelect.value = result.detectedColor;
        if (["letter", "legal"].includes(result.originalSize)) {
            paperSelect.value = result.originalSize;
        }

        updatePreview(); 
        saveState();
    } catch (err) {
        console.error(err);
        alert("Upload error.");
        previewOverlay.classList.add("hidden");
        form.classList.remove("uploading");
        setSettingsDisabledState(true);
    }
});
    
    pageMode.addEventListener("change", updatePreview);
    
    pagesInput.addEventListener("input", (e) => {
    // 1. Sanitize: Remove any character that isn't a digit, comma, or hyphen
    let value = e.target.value.replace(/[^0-9,-]/g, "");

    // 2. Validate: Split by comma and check each part against totalPages
    const parts = value.split(",");
    const validatedParts = parts.map(part => {
        if (part.includes("-")) {
            // Handle range: e.g., "1-12"
            const range = part.split("-");
            let start = range[0];
            let end = range[1];
            
            // If the user finished typing 'end', check if it's too high
            if (end !== "" && parseInt(end) > totalPages) {
                return `${start}-${totalPages}`;
            }
            return part;
        } else {
            // Handle single number: e.g., "12"
            if (part !== "" && parseInt(part) > totalPages) {
                return totalPages.toString();
            }
            return part;
        }
    });

    // 3. Rewrite the input field value so the user sees the correction
    e.target.value = validatedParts.join(",");

    // 4. Update the thumbnails
    updatePreview();
    saveState();
});
    
    
    paperSelect.addEventListener("change", () => {
        updatePreview();
        saveState();
    });
    colorSelect.addEventListener("change", () => {
        saveState(); 
    });

    copiesInput.addEventListener("input", () => {
        saveState();
    });
    loadState();
}); // End of DOMContentLoaded listener
