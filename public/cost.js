// 1. FIXED: Declare missing variable at top level
let isPaperDispensed = false; 
let totalCost = null;
let isPaperInPrinter = false;
let currentInserted = 0;

// Read values from URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const pages = params.get("pages");
const copies = params.get("copies");
const color = params.get("color")
const paper = params.get("paper");
const baseName = params.get("baseName");

// Fill display fields
document.getElementById("pages").innerText = pages;
document.getElementById("copies").innerText = copies;
document.getElementById("color").innerText = color;
document.getElementById("paper").innerText = paper;

const socket = io(); 

// --- FUNCTIONS ---

async function calculateCost() {
    const response = await fetch("/calculate-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper, baseName, color, pages, copies })
    });
    const result = await response.json();
    if (!result.success) {
        alert("Cost calculation failed: " + result.message);
        return;
    }
    totalCost = result.totalCost;
    document.getElementById("cost").innerText = totalCost;
    updateUI();
}

async function syncBalance() {
    try {
        const response = await fetch('/balance/current');
        if (response.ok) {
            const data = await response.json();
            currentInserted = data.balance;
            updateUI();
        }
    } catch (err) {
        console.error("Balance sync failed: ", err);
    }
}

// --- EVENT LISTENERS ---

// DISPENSE BUTTON
const dispenseBtn = document.getElementById("dispenseBtn");
dispenseBtn.addEventListener("click", async () => {
    const status = document.getElementById("status");
    status.innerText = "Dispensing paper...please wait.";

    try {
        const response = await fetch('/api/print/proceed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paperSize: paper,
                copies: parseInt(copies)
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("Dispense command accepted by Pi.");
            isPaperDispensed = true; 
            dispenseBtn.classList.add("hidden");
            updateUI();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Dispense request failed:", error);
    }
});

// PRINT BUTTON
document.getElementById("printBtn").addEventListener("click", async () => {
    if (currentInserted < totalCost) {
        alert("Payment not enough!");
        return;
    }
    
    if(typeof showLoading === "function") {
        showLoading("Sending document to printer...");
    }
    
    try {
        const printResponse = await fetch("/print-job", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseName, pages, copies, color, paper })
        });

        const printResult = await printResponse.json();

        if (printResult.success) {
            await fetch("/transaction/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, Amount: totalCost, Status: "completed" })
            });

            await fetch("/balance/reset", { method: "POST" });

            alert("Printing started! Please wait.");
            window.location.replace("/upload.html");
            
        } else {
            if (typeof hideLoading === "function") hideLoading();
            alert("Printer Error: " + printResult.message);
        }
        
    } catch (err) {
        console.error("Print Error:", err);
        if (typeof hideLoading === "function") hideLoading();
        alert("Failed to reach printer server.");
    }
});

// CANCEL BUTTON
document.getElementById("cancelBtn").addEventListener("click", () => {
    window.history.back();
});

// --- SOCKETS ---

socket.on('update_balance', (newBalance) => {
    currentInserted = newBalance;
    updateUI();
});

socket.on('paper_ready', (data) => {
    isPaperInPrinter = data.inserted;
    updateUI();
});

// --- UI LOGIC ---

function updateUI() {
    const balanceDisplay = document.getElementById("inserted-balance");
    const balanceContainer = balanceDisplay ? balanceDisplay.parentElement : null; // The <h1> container
    const status = document.getElementById("status");
    const printBtn = document.getElementById("printBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const dispenseBtn = document.getElementById("dispenseBtn");

    if (balanceDisplay) balanceDisplay.innerText = currentInserted;

    // 1. Cancel Button Logic
    if (cancelBtn) {
        currentInserted > 0 ? cancelBtn.classList.add("hidden") : cancelBtn.classList.remove("hidden");
    }
    
    if (totalCost === null || totalCost === 0) {
        status.innerText = "Calculating cost...";
        return; 
    }

    // 2. STATE: Insufficient Payment
    if (currentInserted < totalCost) {
        status.innerText = "Waiting for ₱" + (totalCost - currentInserted) + " more...";
        status.style.color = "#d9534f"; // Red
        
        // Turn the Peso symbol and number Red
        if (balanceContainer) balanceContainer.style.color = "#d9534f";
        
        dispenseBtn.disabled = true;
        dispenseBtn.style.opacity = "0.5";
        dispenseBtn.style.cursor = "not-allowed";
        printBtn.classList.add("hidden");
    } 
    
    // 3. STATE: Paid, but not yet dispensed
    else if (!isPaperDispensed) {
        status.innerText = "Payment Received! Click 'Dispense Paper' below.";
        status.style.color = "#28a745"; // Green
        
        // Turn the Peso symbol and number Green
        if (balanceContainer) balanceContainer.style.color = "#28a745";
        
        dispenseBtn.disabled = false;
        dispenseBtn.style.opacity = "1";
        dispenseBtn.style.cursor = "pointer";
        dispenseBtn.classList.remove("hidden");
        printBtn.classList.add("hidden");
    }
    
    // 4. STATE: Dispensed, but not in printer tray
    else if (!isPaperInPrinter) {
        status.innerText = "Please insert the dispensed paper into the printer tray.";
        status.style.color = "#ff8c00"; // Orange
        
        // Keep the balance green since they already paid
        if (balanceContainer) balanceContainer.style.color = "#28a745";
        
        dispenseBtn.classList.add("hidden");
        printBtn.classList.add("hidden");
    }
    
    // 5. STATE: Ready to Print
    else {
        status.innerText = "Ready to Print!";
        status.style.color = "#28a745";
        
        if (balanceContainer) balanceContainer.style.color = "#28a745";
        
        dispenseBtn.classList.add("hidden");
        printBtn.classList.remove("hidden");
        printBtn.disabled = false;
    }
}

async function init() {
    await Promise.all([calculateCost(), syncBalance()]);
}

init();
