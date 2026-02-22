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
	if (conPasswordField.style.display === "none" || credSaveBtn.disabled || credCancelBtn.disabled) {
		conPasswordField.style.display = "block";
		credSaveBtn.disabled = false;
		credCancelBtn.disabled = false;
	} else {
		conPasswordField.style.display = "none";
		credSaveBtn.disabled = true;
		credCancelBtn.disabled = true;
	}
});
