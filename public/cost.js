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

let totalCost = null;

// Ask server to scan images + calculate cost
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

// PRINT BUTTON
document.getElementById("printBtn").addEventListener("click", async () => {
    const payment = currentInserted;

    if (payment < totalCost) {
        alert("Payment not enough!");
        return;
    }
    
    if(typeof showLoading === "function") {
        showLoading("Sending document to printer...");
    }
    
    try {
        // 1. Trigger the actual CUPS Print Command
        const printResponse = await fetch("/print-job", {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseName, pages, copies, color, paper })
        });

        const printResult = await printResponse.json();

        if (printResult.success) {
            // 2. Update transaction (FIXED TYPO HERE: transaction, not transactoin)
            const txResponse = await fetch("/transaction/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    Amount: totalCost,
                    Status: "completed"
                })
            });
            const txResult = await txResponse.json();
            if (txResult.success) {
                await fetch("/balance/reset", { method: "POST" });
                alert("Printing started! Please wait.");
                window.location.href = "/upload.html";
            }
            
            setTimeout(() => {
                window.location.href = "/upload.html";
            }, 1500);
            
        } else {
            hideLoading();
            alert("Printer Error: " + printResult.message);
        }
        
        if (printResult.success) {
        await fetch("/balance/reset", { method: "POST" });
        
        alert("Printing started! Please wait.");
        window.location.href = "/upload.html";
        }   
        
    } catch (err) {
        console.error("Print Error:", err);
        hideLoading();
        alert("Failed to reach printer server.");
    }
});

// CANCEL BUTTON
document.getElementById("cancelBtn").addEventListener("click", async () => {
    // Show laoding overlay
    
    window.history.back();
});

const socket = io(); 
let currentInserted = 0;

// 1. Listen for live coin updates from server.js
socket.on('update_balance', (newBalance) => {
    currentInserted = newBalance;
    updateUI();
});

// Synce the balance on page load.
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

const dispenseBtn = document.getElementById("dispenseBtn");

dispenseBtn.addEventListener("click", async () => {
    // Show loading state while the request is being sent
    const status = document.getElementById("status");
    status.innerText = "Dispensing paper...please wait.";

    try {
        const response = await fetch('/api/print/proceed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paperSize: paper, // Variable from your URL params
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
            //if (typeof hideLoading === "function") hideLoading();
        }
    } catch (error) {
        console.error("Dispense request failed:", error);
        //if (typeof hideLoading === "function") hideLoading();
    }
});

function updateUI() {
    const balanceDisplay = document.getElementById("inserted-balance");
    const status = document.getElementById("status");
    const printBtn = document.getElementById("printBtn");

    // Update the number on screen
    if (balanceDisplay) {
        balanceDisplay.innerText = currentInserted;
    }
    
    if (totalCost === null || totalCost === 0) {
        status.innerText = "Please insert coins.";
        status.style.color = "#666"; 
        printBtn.disabled = true;
        printBtn.style.opacity = "0.5";
        return; 
    }

    // Logic to enable/disable the print button
if (currentInserted < totalCost) {
        // INSUFFICIENT STATE
        status.innerText = "Waiting for ₱" + (totalCost - currentInserted) + " more...";
        status.style.color = "#d9534f"; // Soft Red
        balanceDisplay.parentElement.style.color = "#d9534f";
        
        printBtn.classList.add("hidden");
        // Disable Button
        dispenseBtn.disabled = true;
        dispenseBtn.style.backgroundColor = "#6c757d"; // Gray
        dispenseBtn.style.cursor = "not-allowed";
        dispenseBtn.style.boxShadow = "none";
    } 
    
    else {
        // SUCCESS STATE
        status.innerText = "Payment Received! You can now print.";
        status.style.color = "#28a745"; // Success Green
        balanceDisplay.parentElement.style.color = "#28a745";
        
        /*
        printBtn.classList.remove("hidden");
        // Enable and Highlight Button
        */
        dispenseBtn.disabled = false;
        dispenseBtn.style.backgroundColor = "#28a745";
        dispenseBtn.style.cursor = "pointer";
        dispenseBtn.style.opacity = "1";
        // Add a slight "glow" to show it's active
        dispenseBtn.style.boxShadow = "0 0 15px rgba(40, 167, 69, 0.5)";
        
    }
    
    if (currentInserted >= totalCost && isPaperDispensed) {
        printBtn.classList.remove("hidden");
        document.getElementById("status").innerText = "Please insert the paper in the printer";
    } else {
        printBtn.classList.add("hidden");
    }
}
async function init() {
    Promise.all([
        calculateCost(),
        syncBalance()
    ]);
}
// Initial call to set state on page load
init();
