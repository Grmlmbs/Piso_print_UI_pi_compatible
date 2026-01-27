window.addEventListener('pageshow', (event) => {
	const overlay = document.getElementById('loading-overlay');
	if (overlay) {
		overlay.style.display = 'none';
	}
	
	const buttons = document.querySelectorAll('.btn-main');
	buttons.forEach(btn => btn.disabled = false);
});

function startKiosk() {
	if (typeof showLoading === "function") {
		showLoading("Initializing Printer Interface...", 5000);
	}
	
	setTimeout(() => {
		window.location.href = "/upload.html";
	}, 500);
}

function goToAdmin() {
	window.location.href = "/adminLogin.html";
}

function hideLoading() {
	const overlay = document.getElementById('loading-overlay');
	if (overlay) {
		overlay.style.dipslay = 'none';
	}
}
