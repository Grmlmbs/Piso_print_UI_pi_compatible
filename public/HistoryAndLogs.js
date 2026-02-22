const historyLogsBtn = document.getElementById('historyLogsBtn');
const errorLogsBtn = document.getElementById('errorLogsBtn');
const transactionSearchBar = document.getElementById('tran-searchBar');
const transactionDropDown = document.getElementById('tran-filter');
const sortBtn = document.getElementById('sort-direction-btn');

function showTab(tabId) {
	const sections = ['transaction-tab', 'error-tab'];
	
	sections.forEach(id => {
		const element = document.getElementById(id);
		if (element) {
			element.style.display = (id === tabId) ? "block": "none";
		}
	});
}

historyAndLogsBtn.addEventListener('click', function() {
	showTab('transaction-tab');
	populateTranTable();
});

historyLogsBtn.addEventListener('click', function() {
	showTab('transaction-tab');
	
	historyLogsBtn.style.backgroundColor = "#f4f4f4";
	historyLogsBtn.style.color = "#15173d";
	
	errorLogsBtn.style.backgroundColor = "#15173d";
	errorLogsBtn.style.color = "#f4f4f4";
});

errorLogsBtn.addEventListener('click', function() {
	showTab('error-tab');
	
	historyLogsBtn.style.backgroundColor = "#15173d";
	historyLogsBtn.style.color = "#f4f4f4";
	
	errorLogsBtn.style.backgroundColor = "#f4f4f4";
	errorLogsBtn.style.color = "#15173d";
});

transactionSearchBar.addEventListener('input', function(event) {
	populateTranTable()
});

transactionDropDown.addEventListener('change', function(event) {
	if (transactionDropDown.value === 'None') {
		populateTranTable();
	}
	populateTranTable();
});

sortBtn.addEventListener('click', toggleSortDirection);

let sortDirection = 'DESC';

function toggleSortDirection() {
	const icon = document.getElementById('sort-direction-btn');
	sortDirection = (sortDirection === 'DESC') ? 'ASC' : 'DESC';
	
	populateTranTable();
}

async function populateTranTable() {
	const start = document.getElementById('transaction-start-date').value;
	const end = document.getElementById('transaction-end-date').value;
	const search = document.getElementById('tran-searchBar').value;
	const sortBy = document.getElementById('tran-filter').value;
	
	const transactionTableBody = document.getElementById('transaction-table-body');
	
	const params = new URLSearchParams();
	if (start && end) {
		params.append('start', start);
		params.append('end', end);
	}
	if (search) {
		params.append('search', search);
	}
	
	params.append('sortBy', sortBy);
	params.append('order', sortDirection);
	try {
		const response = await fetch(`/api/tran-logs?${params.toString()}`);
		const data = await response.json();
		
		if (!Array.isArray(data)) {
			console.error("Received non-array data:", data);
			return; 
		}
    
		transactionTableBody.innerHTML = '';
		
		data.forEach(row => {
			const tr = document.createElement('tr');
			
			const formattedDate = new Date(row.Date).toLocaleString();
			
			tr.innerHTML = `
				<td>${row.Transaction_Id}</td>
				<td>${formattedDate}</td>
				<td>${row.Pages}</td>
				<td>${row.Color}</td>
				<td>${row.Paper_Size}</td>
				<td>${row.File_Size}</td>
				<td>PHP ${row.Amount.toFixed(2)}</td>
				<td>${row.Status}</td>
			`;
			transactionTableBody.appendChild(tr);
		});
	} catch (err) {
		console.error("Error populating table:", err);
	}
}

