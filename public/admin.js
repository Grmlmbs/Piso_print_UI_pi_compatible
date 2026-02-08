//admin login codes

const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

togglePassword.addEventListener('change', function() {
	// Toggle the type attribute
	const type = this.checked ? 'text': 'password';
	passwordField.setAttribute('type', type);
	
	// change the icon
	eyeIcon.src = this.checked ? '/sources/hidden.png' : '/sources/show.png';
});

async function handleLogin() {
	const user = document.getElementById('username').value;
	const pass = document.getElementById('password').value;
	
	//Disable button to prevent double-clicks
	const loginBtn = document.querySelector('button');
	
	document.getElementById('loading-overlay').style.display = 'flex';
	showLoading("Verifying Credentials...");
	loginBtn.disabled = true;
	
	try {
		const res = await fetch('/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: user, password: pass })
		});
		const result = await res.json();
		
		if (result.success) {
			document.getElementById('loading-overlay').style.display = 'none';
			window.location.href = result.redirect;
		} else {
			document.getElementById('loading-overlay').style.display = 'none';
			alert(result.message);
			loginBtn.disabled = false;
		}
	} catch (err) {
		document.getElementById('loading-overlay').style.display = 'none';
		alert(result.message);
		loginBtn.disabled = false;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const sidebar = document.getElementById("sidebar");
	const toggleBtn = document.getElementById("toggle-menu");
	
	toggleBtn.addEventListener("click", () => {
		sidebar.calssList.toggle("collapsed");
		
		//Save state to keep the collapsible menu state even after refresh.
		const isCollapsed = sidebar.classList.contains("collapsed");
		localStorage.setItem("sidebar-state", isCollapsed ? "small" : "large");
	});
	
	// Restore state on load
	
	if (localStorage.getItem("sidebar-state") === "small") {
		sidebar.clasList.add("collapased");
	}
});
