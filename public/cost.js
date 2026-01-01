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

    if (payment < totalCost) {
        status.innerHTML = "<span style='color:red'>Underpayment</span>";
    } else {
        status.innerHTML = "<span style='color:green'>Payment OK</span>";
    }
});

// HELPER FUNCTION FOR CLEANUP 
async function terminateSession() {
	try {
		const response = await fetch("/end-session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ baseName })
		});
		const result = await response.json();
		
		if(result.success) {
			// Show a final overly or status
			document.body.innerHTML = `
				<div style = "text-align:center; padding: 50px;">
					<h1>Thank you!</h1>
					<p>Your session has ended. You will be disconnect automatically.</p>
				</div>`	
		}	
	} catch (e) {
		console.log("Session cleanup triggered.");
	}
}

// PRINT BUTTON
document.getElementById("printBtn").addEventListener("click", async () => {
    const payment = Number(document.getElementById("payment").value);

    if (payment < totalCost) {
        alert("Payment not enough!");
        return;
    }

    const response = await fetch("/transaction/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id,
            Amount: totalCost,
            Status: "printing"
        })
    });

    const result = await response.json();

    if (result.success) {
        alert("Print job processing... You will be disconnected shortly.");
	await terminateSession(); // KICKS THE USER
        window.location.href = "/index.html";
    }
});

// CANCEL BUTTON
document.getElementById("cancelBtn").addEventListener("click", async () => {
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
    alert("Session cancelled. Disconnecting...");
    await terminateSession(); // KICKS THE USER
    window.location.href = "/index.html";
});