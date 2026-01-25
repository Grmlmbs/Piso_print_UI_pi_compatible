function showLoading(message = "Loading Kiosk...", timeoutMs = 10000) {
	const overlay = document.getElementById('loading-overlay');
	const text = document.getElementById('loading-text');
	
	if (overlay && text) {
		text.innerText = message;
		overlay.style.display = 'flex';
		
		setTimeout(() => {
			if (overlay.style.display === 'flex') {
				overlay.style.display = 'none';
				alert("Request timed out. Please try again.");
				
				const loginBtn = document.querySelector('button');
				if (loginBtn) loginBtn.disabled = false;
			}
		}, timeoutMs);
	}
}
