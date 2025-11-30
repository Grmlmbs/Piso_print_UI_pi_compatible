document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // DOM ELEMENTS
    // =========================
    const form = document.getElementById("uploadForm");
    const preview = document.getElementById("preview");
    const fileInput = form.querySelector("input[type='file']");
    const uploadButton = form.querySelector("button[type='submit']");
    const pageMode = document.getElementById("pageMode");
    const pagesInput = document.getElementById("pages");
    const customWrapper = document.getElementById("customPageWrapper");
    const copiesInput = document.getElementById("copies");
    const colorSelect = document.getElementById("color");
    const paperSelect = document.getElementById("paperSize");
    const clearButton = document.getElementById("clearBtn");
    const proceedBtn = document.getElementById("proceedBtn");

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

    // =========================
    // HELPER: CONTROL SETTINGS STATE
    // =========================
    function setSettingsDisabledState(isDisabled) {
        // Disable/enable main settings elements
        settingsElements.forEach(el => {
            el.disabled = isDisabled;
        });
        
        // Special case for pagesInput: it's only enabled if pageMode is 'custom' AND the whole settings block is enabled
        const isCustom = pageMode.value === "custom";
        pagesInput.disabled = isDisabled || !isCustom;
        
        // Clear button is enabled only if there's an uploaded file
        clearButton.disabled = isDisabled || !lastUploadedBaseName;
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
    });

    // =========================
    // RESET FORM
    // =========================
    async function resetForm() {
        form.reset();
        preview.innerHTML = "";

        totalPages = 0;
        allPagesImages = { letter: [], legal: [] };
        
        // Disable settings and clear pageInput explicitly
        setSettingsDisabledState(true);
        pagesInput.value = ""; // Clear custom input after reset

        if (lastUploadedBaseName) {
            try {
                const res = await fetch(`/delete-last/${lastUploadedBaseName}`, {
                    method: "DELETE"
                });

                console.log("Deleted previous files:", await res.json());
            } catch (err) {
                console.error("Delete error:", err);
            }

            lastUploadedBaseName = null;
        }
    }

    clearButton.addEventListener("click", e => {
        e.preventDefault();
        resetForm();
    });

    // =========================
    // CUSTOM PAGE PARSING
    // =========================
    function parsePageSelection(input, totalPages) {
        if (!input) return [];

        const ranges = input.split(",").map(s => s.trim());
        const pages = new Set();
        const correctedParts = [];

        for (let part of ranges) {
            if (/^\d+-\d+$/.test(part)) {
                let [start, end] = part.split("-").map(Number);

                start = Math.max(1, Math.min(start, totalPages));
                end = Math.max(1, Math.min(end, totalPages));
                if (start > end) [start, end] = [end, start];

                for (let i = start; i <= end; i++) pages.add(i);
                correctedParts.push(`${start}-${end}`);
            }

            else if (/^\d+$/.test(part)) {
                let num = Math.max(1, Math.min(Number(part), totalPages));
                pages.add(num);
                correctedParts.push(String(num));
            }
        }

        pagesInput.value = correctedParts.join(", ");
        return [...pages];
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
        if (!totalPages) return;

        const selectedPages = getSelectedPages();
        // 💡 CRITICAL: Only proceed if there are selected pages AND preview images exist
        if (!selectedPages.length || allPagesImages[paperSelect.value]?.length === 0) {
            renderPreview(null, selectedPages, colorSelect.value); // Render the "waiting" message
            return;
        }

        const currentPaper = paperSelect.value;
        const colorMode = colorSelect.value;

        renderPreview(allPagesImages[currentPaper], selectedPages, colorMode);
    }

    // Live update handlers
    [pagesInput, copiesInput].forEach(el => el.addEventListener("input", updatePreview));
    [colorSelect, paperSelect].forEach(el => el.addEventListener("change", updatePreview));

    // =========================
    // FILE UPLOAD HANDLER
    // =========================
    form.addEventListener("submit", async e => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) return alert("Please select a PDF.");

        const formData = new FormData();
        formData.append("pdfFile", file);

        try {
            const response = await fetch("/upload", { method: "POST", body: formData });
            const result = await response.json();

            if (!result.success) return alert(result.message || "Upload failed.");

            lastUploadedBaseName = result.baseName;
            
            // 💡 FIX: Pass result.totalPages to the handler
            handlePreviewImages(result.images, result.totalPages); 
            
            setSettingsDisabledState(false); 

            if (["letter", "legal"].includes(result.originalSize)) {
                paperSelect.value = result.originalSize;
            }

            updatePreview();
        } catch (err) {
            console.error(err);
            alert("Upload error.");
        }
    });

    // =========================
    // PROCEED BUTTON
    // =========================
    proceedBtn.addEventListener("click", async () => {
        if (!lastUploadedBaseName) return alert("Upload a PDF first.");

        const selectedPages = getSelectedPages();
        // The check remains, but now totalPages should be correct
        if (!selectedPages.length) return alert("Select pages first."); 

        const data = {
            Date: new Date().toISOString(),
            Amount: 0,
            Color: colorSelect.value,
            Pages: selectedPages.join(","),
            Copies: copiesInput.value,
            Paper_Size: paperSelect.value,
            File_Path: lastUploadedBaseName,
            File_Size: "0",
            Status: "pending"
        };

        try {
            const response = await fetch("/transaction/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) return alert(result.message || "Transaction failed.");

            const query =
                `?id=${result.id}&pages=${data.Pages}&copies=${data.Copies}` +
                `&color=${data.Color}&paper=${data.Paper_Size}&baseName=${data.File_Path}`;

            window.location.href = `/cost.html${query}`;
        } catch (err) {
            console.error(err);
            alert("Error creating transaction.");
        }
    });
}); // End of DOMContentLoaded listener