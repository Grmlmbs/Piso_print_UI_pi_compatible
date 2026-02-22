// Sidebar toggle
var sidebar = document.getElementById("sidebar");
var dashboardBtn = document.getElementById("dashboardBtn");
var historyAndLogsBtn = document.getElementById("historyBtn");
var settingsBtn = document.getElementById("settingsBtn");
var sidebarOpen = false;


document.addEventListener('DOMContentLoaded', () => {
	console.log("Page loaded! Fetching data...");
	
	const startInput = document.getElementById('dashboard-start-date');
	const endInput = document.getElementById('dashboard-end-date');
	const transactionStartInput = document.getElementById('transaction-start-date');
	const transactionEndInput = document.getElementById('transaction-end-date');
	const errorStartInput = document.getElementById('error-start-date');
	const errorEndInput = document.getElementById('error-end-date');
	
	initializeDateFields(startInput, endInput);
	initializeDateFields(transactionStartInput, transactionEndInput);
	initializeDateFields(errorStartInput, errorEndInput);
	
	updateSalesCard();
	updateAvgSalesPerTran();
	updateNumOfTran();
	updateTotalPagesPrinted();
	updateTranDistributionPie();
	updateSalesTrendColChart();
	updateUsageVolLineChart();
	updateTranDisStatColumn();
	
	// refresh every minute.
	setInterval(updateSalesCard, 60000);
	setInterval(updateAvgSalesPerTran, 60000);
	setInterval(updateNumOfTran, 60000);
	setInterval(updateTotalPagesPrinted, 60000);
	setInterval(updateTranDistributionPie, 60000);
	setInterval(updateSalesTrendColChart, 60000);
	setInterval(updateUsageVolLineChart, 60000);
	setInterval(updateTranDisStatColumn, 60000);
});
function initializeDateFields(startInput, endInput) {
	if (startInput && endInput) {
		
		startInput.addEventListener('change', handleDateChange);
		endInput.addEventListener('change', handleDateChange);
		
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		
		const todayStr = today.toISOString().split('T')[0];
		const yesterdayStr = yesterday.toISOString().split('T')[0];
		
		startInput.value = yesterdayStr;
		endInput.value = todayStr;
	}
}
	
function openSidebar() {
    if (!sidebarOpen) {
        sidebar.classList.add("sidebar-responsive");
        document.body.classList.add("stop-scrolling");
        sidebarOpen = true;
    }
}

function closeSidebar() {
    if (sidebarOpen) {
        sidebar.classList.remove("sidebar-responsive"); 
        document.body.classList.remove("stop-scrolling");
        sidebarOpen = false;
    }
}

function showSection(sectionId) {
	const sections = ['dashboard', 'history-and-logs', 'settings'];
	
	sections.forEach(id => {
		const element = document.getElementById(id);
		if (element) {
			element.style.display = (id === sectionId) ? "block": "none";
		}
	});
}

window.onload = function() {
	showSection('dashboard');
};

dashboardBtn.addEventListener('click', function() {
	showSection('dashboard');
	dashboardBtn.style.backgroundColor = "#f4f4f4";
	dashboardBtn.style.color = "#15173d";
	
	historyAndLogsBtn.style.backgroundColor = "#15173d";
	historyAndLogsBtn.style.color = "#f4f4f4";
	
	settingsBtn.style.backgroundColor = "#15173d";
	settingsBtn.style.color = "#f4f4f4";
	if (window.innerWidth <= 992) closeSidebar();
});
historyBtn.addEventListener('click', function() {
	showSection('history-and-logs');
	dashboardBtn.style.backgroundColor = "#15173d";
	dashboardBtn.style.color = "#f4f4f4";
	historyAndLogsBtn.style.backgroundColor = "#f4f4f4";
	historyAndLogsBtn.style.color = "#15173d";
	settingsBtn.style.backgroundColor = "#15173d";
	settingsBtn.style.color = "#f4f4f4";
	if (window.innerWidth <= 992) closeSidebar();
});
settingsBtn.addEventListener('click', function() {
	showSection('settings');
	dashboardBtn.style.backgroundColor = "#15173d";
	dashboardBtn.style.color = "#f4f4f4";
	historyAndLogsBtn.style.backgroundColor = "#15173d";
	historyAndLogsBtn.style.color = "#f4f4f4";
	settingsBtn.style.backgroundColor = "#f4f4f4";
	settingsBtn.style.color = "#15173d";
	if (window.innerWidth <= 992) closeSidebar();
});

// Close sidebar automatically if user clicks outside of it on mobile
window.addEventListener('click', function(e) {
    if (sidebarOpen && !sidebar.contains(e.target) && !document.querySelector('.menu-icon').contains(e.target)) {
        closeSidebar();
    }
});


//------DASHBOARD SECTION CODES -------
//const startDateInput = document.getElementById('dashboard-start-date');
//const endDateInput = document.getElementById('dashboard-end-date');
//Date formatter
function formatDate(dateToBeFormatted) {
	const yyyy = dateToBeFormatted.getFullYear();
	const mm = String(dateToBeFormatted.getMonth() + 1).padStart(2, '0');
	const dd = String(dateToBeFormatted.getDate()).padStart(2, '0');
	
	const date = `${yyyy}-${mm}-${dd}`;
	
	return date;
}
//Date change handler
function handleDateChange() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	console.log(`Filtering from ${start} to ${end}`);
	updateSalesCard();
	updateAvgSalesPerTran();
	updateNumOfTran();
	updateTotalPagesPrinted();
	updateTranDistributionPie();
	updateSalesTrendColChart();
	updateUsageVolLineChart();
	updateTranDisStatColumn();
	populateTranTable();
}

//'change' eventListener to update dashboard on date change.
//startDateInput.addEventListener('change', handleDateChange);
//endDateInput.addEventListener('change', handleDateChange);

// function to update total sales card.
async function updateSalesCard() {
	const start = document.getElementById('dashboard-start-date').value;
    const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	try {
		const response = await fetch('/api/total-sales' + dateParams);
		const data = await response.json();
		
		const totalSales = document.getElementById('total-sales');
		
		if (totalSales) {
			const total = data.totalSales || 0;
			
			totalSales.innerText = 'PHP ' + total.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		}
	} catch (err) {
		console.error("Error updating sales card:", err);
	}
}
// function to update average sales per transaction
async function updateAvgSalesPerTran() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	try {
		const response = await fetch('/api/avg-sales' + dateParams);
		const data = await response.json();
		
		const avgSales = document.getElementById('avg-sales');
		
		if (avgSales) {
			const total = data.avgSales || 0;
			
			avgSales.innerText = 'PHP ' + total.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		}
	} catch (err) {
		console.error("Error updating avg sales card: ", err);
	}
}
//function to get the total number of transactions
async function updateNumOfTran() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	try {
		const response = await fetch('/api/num-of-transaction' + dateParams);
		const data = await response.json();
		
		const numOfTransactions = document.getElementById('num-of-transaction');
		
		if (numOfTransactions) {
			const total = data.numOfTransactions || 0;
			
			numOfTransactions.innerText = total;
		}
	} catch (err) {
		console.error("Error updating transaction card: ", err);
	}
}

//function to get the total page count printed
async function updateTotalPagesPrinted() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	try {
		const response = await fetch('/api/total-pages-printed' + dateParams);
		const data = await response.json();
		
		const numOfPagesPrinted = document.getElementById('pages-printed');
		
		if (numOfPagesPrinted) {
			const total = data.totalPageCount || 0;
			
			numOfPagesPrinted.innerText = total;
		}
	} catch (err) {
		console.error("Error updating Total page count card: ", err);
	}
}
		
// Distribution of transactoins pie chart codes

let pieChart = null;

async function updateTranDistributionPie() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	try {
		const response = await fetch('/api/dist-tran-pie' + dateParams);
		const data = await response.json();
		
		const statusCount = data.map(item => item.count);
		const statusLabels = data.map(item => item.simplifiedStatus);
		
		if (pieChart) {
			pieChart.destroy();
		}
		
        var options = {
          series: statusCount,
          chart: {
			width: 500,
			type: 'pie',
			},
        labels: statusLabels,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };
        pieChart = new ApexCharts(document.querySelector("#pie-chart"), options);
        pieChart.render();
	} catch (err) {
		console.error("Error updating the Distribution of transaction chart");
	}
}

// Sales trend column chart codes
let columnChart = null;

async function updateSalesTrendColChart() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	if (columnChart) {
		columnChart.destroy();
	}
		
	try {
		const response = await fetch('/api/sales-trend' + dateParams);
		const data = await response.json();
		
		const dates = data.map(item => {
			const dateObj = new Date(item.Month + "-01");
			return dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
		});
		
		const amounts = data.map(item => item.monthlyTotal);
		
        var options = {
          series: [{
          name: 'Sales',
          data: amounts
        }],
          chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5,
            borderRadiusApplication: 'end'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: dates,
        },
        yaxis: {
          title: {
            text: 'Sales (PHP)'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return "PHP " + val
            }
          }
        }
        };

        columnChart = new ApexCharts(document.querySelector("#bar-chart"), options);
        columnChart.render();
	} catch (err) {
		console.error("Error updating the sales trend column chart");
	}
}
        
// volume of usage trend codes
let lineChart = null;
async function updateUsageVolLineChart() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	if (lineChart) {
		lineChart.destroy();
	}
	
	try {
		const response = await fetch('/api/usage-vol' + dateParams);
		const data = await response.json();
		
		const formattedHours = data.map(item => {
			const hourObj = new Date();
			hourObj.setHours(item.Hour, 0, 0);
			
			return hourObj.toLocaleString('en-US', { hour: 'numeric', hour12: 'true' });
		});
		
		const count = data.map(item => item.Count);
        var options = {
          series: [{
            name: "Usage Volume",
            data: count
        }],
          chart: {
          height: 350,
          type: 'line',
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight'
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        xaxis: {
          categories: formattedHours,
        }
        };

        lineChart = new ApexCharts(document.querySelector("#line-chart"), options);
        lineChart.render();
	} catch (err) {
		console.error("Error updating the volume of usage trend line chart");
	}
}
// Transaction distribution status
let tranDisStatus = null;
async function updateTranDisStatColumn() {
	const start = document.getElementById('dashboard-start-date').value;
	const end = document.getElementById('dashboard-end-date').value;
	
	const dateParams = (start && end) ? `?start=${start}&end=${end}`: '';
	
	if (tranDisStatus) {
		tranDisStatus.destroy();
	}
	
	try {
		const response = await fetch('/api/tran-dis-column' + dateParams);
		const data = await response.json();
		
		const rawMonths = [...new Set(data.map(item => item.Month))];
    
		const displayMonths = rawMonths.map(m => {
			const dateObj = new Date(m + "-01");
			return dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
		});
		
		const statuses = ['completed', 'pending', 'cancelled', 'printing'];
		
		const seriesData = statuses.map(statusName => {
			return {
				name: statusName.charAt(0).toUpperCase() + statusName.slice(1),

				data: rawMonths.map(m => {
					const match = data.find(item => item.Month === m && item.Status === statusName);
					return match ? match.TransactionCount : 0;
				})
			};
		});
        var options = {
          series: seriesData,
          chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5,
            borderRadiusApplication: 'end'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: displayMonths,
        },
        yaxis: {
          title: {
            text: 'Number of Transactions'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return "Transactions " + val
            }
          }
        }
        };

        tranDisStatus = new ApexCharts(document.querySelector("#Transaction-distribution-status"), options);
        tranDisStatus.render();
	} catch (err) {
		console.error("Error loading status trend:", err);
	}
}
