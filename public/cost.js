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

let totalCost = 0;

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
}
calculateCost();

// Payment validation
document.getElementById("payment").addEventListener("input", function () {
    const payment = Number(this.value);
    const status = document.getElementById("status");
    const printBtn = document.getElementById("printBtn");

    if (payment < totalCost) {
        status.innerHTML = "Need ₱" + (totalCost - payment).toFixed(2) + " more";
        status.style.color = "#d9534f"; // Red
        printBtn.disabled = true;
        printBtn.style.opacity = "0.5";
    } else {
        status.innerHTML = "Ready to Print!";
        status.style.color = "#28a745"; // Green
        printBtn.disabled = false;
        printBtn.style.opacity = "1";
    }
});

// PRINT BUTTON
// cost.js - Corrected Print Button
document.getElementById("printBtn").addEventListener("click", async () => {
    const payment = Number(document.getElementById("payment").value);

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
    } catch (err) {
        console.error("Print Error:", err);
        hideLoading();
        alert("Failed to reach printer server.");
    }
});

// CANCEL BUTTON
document.getElementById("cancelBtn").addEventListener("click", async () => {
    // Show laoding overlay
    
    if (typeof showLoading === "function") {
        showLoading("Cancelling transaction...");
    }
    
    try {
        // Update transaction as CANCELLED
        await fetch("/transaction/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                Amount: 0,
                Status: "cancelled"
            })
        });

        // Delete uploaded PDFs/images
        await fetch(`/delete-last/${baseName}`, { method:"DELETE" });

        // Return to home
        window.location.href = "/upload.html";
    } catch (err) {
        console.error("Cancel Error:", err);
        window.location.href = "/upload.html";
    }
});
