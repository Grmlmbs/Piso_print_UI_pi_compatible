const logoutBtn = document.getElementById('logoutBtn');

// Sidebar codes and behaviours
logoutBtn.addEventListener('click', async () => {
	
	try {
		// 1. Tell the server to destroy the session
		const response = await fetch('admin/logout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});
		
		const result = await response.json();
		
		if (result.success) {
			// 2. Clear frontend flag
			sessionStorage.clear();
			
			window.location.replace('/adminLogin.html');
		}
	} catch (err) {
		console.error("Logout failed:", err);
		//Fallback: force redirect even if server call fails
		window.location.replace('/adminLogin.html');
	}
});
