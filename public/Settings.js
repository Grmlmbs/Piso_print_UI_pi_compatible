const pricingSaveBtn = document.getElementById('pricing-saveBtn');
const pricingCancelBtn = document.getElementById('pricing-cancelBtn');
const bwIncremBtn = document.getElementById('bw-increm-btn');
const bwDecremBtn = document.getElementById('bw-decrem-btn');
const colIncremBtn = document.getElementById('col-increm-btn');
const colDecremBtn = document.getElementById('col-decrem-btn');
const multIncremBtn = document.getElementById('mult-increm-btn');
const multDecremBtn = document.getElementById('mult-decrem-btn');
const bwInput = document.getElementById('bw-price-rate');
const colInput = document.getElementById('color-price-rate');
const multInput = document.getElementById('color-multiplier');

const editCredBtn = document.getElementById('editCredentialsBtn');
const credSaveBtn = document.getElementById('credentials-saveBtn');
const credCancelBtn = document.getElementById('credentials-cancelBtn');
const username = document.getElementById('username');
const password = document.getElementById('password');
const conPassword = document.getElementById('conPassword');
const conPasswordContainer = document.getElementById('conPasswordField');

//fetch the existing pricing values from the database

settingsBtn.addEventListener('click', function() {
	fetchPricingData();
});
async function fetchPricingData() {
	
	try {
		const response = await fetch('/api/settings/pricing');
		const data = await response.json();
		
		if(bwInput && colInput && multInput) {
			const bwPrice = data.bw_charge || 0;
			const colPrice = data.color_charge || 0;
			const multiplier = data.multiplier || 0;
			
			bwInput.value = bwPrice;
			colInput.value = colPrice;
			multInput.value = multiplier;
		}
	} catch (err) {
		console.error("Error fetching current price: ", err);
	}
}
async function updatePricingData() {
	const params = { 
        bw_charge: Number(bwInput.value) || 0, 
        color_charge: Number(colInput.value) || 0, 
        multiplier: Number(multInput.value) || 0 
    };
    
	try {
		const response = await fetch('/api/settings/update-pricing', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params)
		});
	} catch (err) {
		console.error("Error updating pricing details: ", err);
	} finally {
		fetchPricingData();
	}
}

// Prevent the user from entering invalid inputs and validate inputs in the input fields.
bwInput.addEventListener('keydown', (e) => {
	const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
	
	const isNumber = /^[0-9]$/.test(e.key);
	
	if (!isNumber && !allowedKeys.includes(e.key)) {
		e.preventDefault();
	}
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

bwInput.addEventListener('input', (e) => {
	let val = e.target.value;
	
	val = val.replace(/[^0-9]/g, '');
	
	if (val.length > 1 && val.startsWith('0')) {
        val = Number(val).toString();
    }
    
    e.target.value = val;
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

colInput.addEventListener('keydown', (e) => {
	const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
	
	const isNumber = /^[0-9]$/.test(e.key);
	
	if (!isNumber && !allowedKeys.includes(e.key)) {
		e.preventDefault();
	}
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

colInput.addEventListener('input', (e) => {
	let val = e.target.value;
	
	val = val.replace(/[^0-9]/g, '');
	
	if (val.length > 1 && val.startsWith('0')) {
        val = Number(val).toString();
    }
    
    e.target.value = val;

	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

multInput.addEventListener('keydown', (e) => {
	const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.'];
	
	const isNumber = /^[0-9]$/.test(e.key);
	
	if (!isNumber && !allowedKeys.includes(e.key)) {
		e.preventDefault();
	}

	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

multInput.addEventListener('input', (e) => {
	let val = e.target.value;
	
	val = val.replace(/[^0-9.]/g, '');
	
	const parts = val.split('.');
	if (parts.length > 2) {
		val = parts[0] + '.' + parts.slice(1).join('');
	}
	
	if (parts.length === 2 && parts[1].length > 2) {
		val = parts[0] + '.' + parts[1].slice(0, 2);
	}
	
	if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
        val = val.replace(/^0+/, ''); 
        
        if (val === '') val = '0'; 
    }
	e.target.value = val;

	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

//increment and decrement button functions.
//black and white
bwIncremBtn.addEventListener('click', function() {
	
	let amount = parseInt(bwInput.value, 10) || 0;
	amount += 1;
	
	bwInput.value = amount.toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});
bwDecremBtn.addEventListener('click', function() {
	
	let amount = parseInt(bwInput.value, 10) || 0;
	if (amount > 0) {
		amount -= 1;
	}
	bwInput.value = amount.toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});
//colored
colIncremBtn.addEventListener('click', function() {
	
	let amount = parseInt(colInput.value, 10) || 0;
	amount += 1;
	
	colInput.value = amount.toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});
colDecremBtn.addEventListener('click', function() {
	
	let amount = parseInt(colInput.value, 10) || 0;
	if (amount > 0) {
		amount -= 1;
	}
	colInput.value = amount.toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});
//multiplier
multIncremBtn.addEventListener('click', function() {
	
	let amount = parseFloat(multInput.value) || 0.00;
	amount += 1;
	
	multInput.value = parseFloat(amount.toFixed(2)).toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});
multDecremBtn.addEventListener('click', function() {
	
	let amount = parseFloat(multInput.value) || 0.00;
	if (amount >= 1) {
		amount -= 1;
	} else if (amount <= 0.99) {
		amount = 0;
	}
	
	multInput.value = parseFloat(amount.toFixed(2)).toString();
	
	if(pricingCancelBtn?.disabled || pricingSaveBtn?.disabled) {
		pricingSaveBtn.disabled = false;
		pricingCancelBtn.disabled = false;
	}
});

// Save and Cancel button function for the PRICING
pricingSaveBtn.addEventListener('click', function() {
	updatePricingData();
	pricingSaveBtn.disabled = true;
	pricingCancelBtn.disabled = true;
});
pricingCancelBtn.addEventListener('click', function() {
	fetchPricingData();
	pricingSaveBtn.disabled = true;
	pricingCancelBtn.disabled = true;
});

//Account settings codes
editCredBtn.addEventListener('click', function() {
    const isDisabled = username.disabled;
    
    // Toggle input fields
    username.disabled = !isDisabled;
    password.disabled = !isDisabled;
    conPassword.disabled = !isDisabled;
    
    if (isDisabled) {
        // Switching to EDIT MODE
        conPasswordContainer.style.display = "block";
        credSaveBtn.disabled = false;
        credCancelBtn.disabled = false;
        editCredBtn.textContent = "Discard Changes";
    } else {
        // Switching back to VIEW MODE
        resetAccountFields();
    }
});

// Cancel Button Logic
credCancelBtn.addEventListener('click', function() {
    resetAccountFields();
    // Re-fetch original data to clear any typed changes
    fetchAccountData(); 
});
// Save Button Logic
credSaveBtn.addEventListener('click', async function() {
    const userVal = username.value.trim();
    const passVal = password.value;
    const conPassVal = conPassword.value;

    // Basic Validation
    if (!userVal || !passVal) {
        alert("Username and Password cannot be empty.");
        return;
    }

    if (passVal !== conPassVal) {
        alert("Passwords do not match!");
        return;
    }

    // API Call
    try {
        const response = await fetch('/api/settings/update-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userVal,
                password: passVal
            })
        });

        if (response.ok) {
            alert("Credentials updated successfully!");
            resetAccountFields();
        } else {
            const errData = await response.json();
            alert("Error: " + (errData.message || "Could not update."));
        }
    } catch (err) {
        console.error("Update error:", err);
        alert("Server error. Please try again later.");
    }
});

// --- Account Settings Logic ---

// Helper: Reset UI to locked state
function resetAccountFields() {
    username.disabled = true;
    password.disabled = true;
    conPassword.disabled = true;
    conPasswordContainer.style.display = "none";
    credSaveBtn.disabled = true;
    credCancelBtn.disabled = true;
    editCredBtn.textContent = "Edit Credentials";
    
    // Clear passwords for security
    password.value = "";
    conPassword.value = "";
    
    // Reset eye icons to default closed state
    document.querySelectorAll('.pass-container i').forEach(icon => {
        icon.classList.replace('ri-eye-off-fill', 'ri-eye-fill');
        icon.previousElementSibling.type = "password";
    });
}

// 1. Edit/Discard Button Toggle
editCredBtn.addEventListener('click', function() {
    const isCurrentlyViewMode = username.disabled;
    
    if (isCurrentlyViewMode) {
        // Switch to EDIT MODE
        username.disabled = false;
        password.disabled = false;
        conPassword.disabled = false;
        conPasswordContainer.style.display = "block";
        credSaveBtn.disabled = false;
        credCancelBtn.disabled = false;
        editCredBtn.textContent = "Discard Changes";
    } else {
        // Switch back to VIEW MODE (Discarding changes)
        resetAccountFields();
        fetchAccountData(); // Revert username to DB version
    }
});

// 2. Cancel Button
credCancelBtn.addEventListener('click', () => {
    resetAccountFields();
    fetchAccountData();
});

// 3. Save Button Logic
credSaveBtn.addEventListener('click', async function() {
    const userVal = username.value.trim();
    const passVal = password.value;
    const conPassVal = conPassword.value;

    if (!userVal || !passVal) {
        alert("Username and Password cannot be empty.");
        return;
    }

    if (passVal !== conPassVal) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch('/api/settings/update-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userVal, password: passVal })
        });

        if (response.ok) {
            alert("Credentials updated successfully!");
            resetAccountFields();
            fetchAccountData(); // Refresh to show updated username
        } else {
            const errData = await response.json();
            alert("Error: " + (errData.message || "Could not update."));
        }
    } catch (err) {
        console.error("Update error:", err);
        alert("Server error. Please try again later.");
    }
});

// 4. Enhanced Eye Icon Toggle
// This handles both the password and confirm password icons
document.querySelectorAll('.pass-container i').forEach(icon => {
    icon.style.cursor = "pointer"; // Make it look clickable
    icon.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const isPassword = input.type === "password";
        
        input.type = isPassword ? "text" : "password";
        this.classList.toggle('ri-eye-fill', !isPassword);
        this.classList.toggle('ri-eye-off-fill', isPassword);
    });
});
