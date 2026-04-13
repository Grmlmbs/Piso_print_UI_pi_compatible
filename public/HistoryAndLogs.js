// =========================
// DOM ELEMENTS
// =========================
const transactionSearchBar = document.getElementById('tran-searchBar');
const transactionDropDown = document.getElementById('tran-filter');
const sortBtn = document.getElementById('sort-direction-btn');
const transactionTableBody = document.getElementById('transaction-table-body');
const startDateInput = document.getElementById('transaction-start-date');
const endDateInput = document.getElementById('transaction-end-date');


// =========================
// GLOBAL STATE
// =========================
let sortDirection = 'DESC';

// =========================
// INITIALIZATION & LISTENERS
// =========================

if (historyAndLogsBtn) {
    historyAndLogsBtn.addEventListener('click', function() {
        // Show the main container (handled by your dashboard.js or similar)
        // Then populate the table
        populateTranTable();
    });
}

// Search Input Listener
transactionSearchBar.addEventListener('input', () => {
    populateTranTable();
});

// Filter Dropdown Listener
transactionDropDown.addEventListener('change', () => {
    populateTranTable();
});

// Date Picker Listeners
startDateInput.addEventListener('change', populateTranTable);
endDateInput.addEventListener('change', populateTranTable);

// Sort Button Listener
sortBtn.addEventListener('click', toggleSortDirection);

// =========================
// FUNCTIONS
// =========================

function toggleSortDirection() {
    sortDirection = (sortDirection === 'DESC') ? 'ASC' : 'DESC';
    // Optional: You could toggle the icon class here if you want it to flip
    populateTranTable();
}

async function populateTranTable() {
    if (!transactionTableBody) return;

    const start = startDateInput.value;
    const end = endDateInput.value;
    const search = transactionSearchBar.value;
    const sortBy = transactionDropDown.value;
    
    const params = new URLSearchParams();
    
    // Only append dates if both are filled
    if (start && end) {
        params.append('start', start);
        params.append('end', end);
    }
    
    if (search) {
        params.append('search', search);
    }
    
    // Map 'None' or empty values to a default column
    const validSortBy = (sortBy === 'None' || !sortBy) ? 'Date' : sortBy;
    params.append('sortBy', validSortBy);
    params.append('order', sortDirection);

    try {
        const response = await fetch(`/api/tran-logs?${params.toString()}`);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error("Received non-array data:", data);
            transactionTableBody.innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
            return; 
        }
    
        transactionTableBody.innerHTML = '';
        
        if (data.length === 0) {
            transactionTableBody.innerHTML = '<tr><td colspan="8">No records found.</td></tr>';
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            
            // Format the date for readability
            const formattedDate = row.Date ? new Date(row.Date).toLocaleString() : 'N/A';
            
            // Format the amount
            const amount = typeof row.Amount === 'number' ? row.Amount.toFixed(2) : '0.00';
            
            // Use your exact table structure
            tr.innerHTML = `
                <td>${row.Transaction_Id || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td>${row.Pages || 0}</td>
                <td>${row.Color || 'N/A'}</td>
                <td>${row.Paper_Size || 'N/A'}</td>
                <td>${row.File_Size || '0KB'}</td>
                <td>PHP ${amount}</td>
                <td>${row.Status || 'Pending'}</td>
            `;
            transactionTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error populating table:", err);
        transactionTableBody.innerHTML = '<tr><td colspan="8">Server error.</td></tr>';
    }
}
