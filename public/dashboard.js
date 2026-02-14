// Sidebar toggle
var sidebar = document.getElementById("sidebar");
var dashboardBtn = document.getElementById("dashboardBtn");
var historyAndLogsBtn = document.getElementById("historyBtn");
var settingsBtn = document.getElementById("settingsBtn");
var sidebarOpen = false;

function openSidebar() {
    if (!sidebarOpen) {
        sidebar.classList.add("sidebar-responsive");
        document.body.classList.add("stop-scrolling");
        sidebarOpen = true;
    }
}

// Open the dashboard when button is clicked.
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
	if (window.innerWidth <= 992) closeSidebar();
});
historyBtn.addEventListener('click', function() {
	showSection('history-and-logs');
	if (window.innerWidth <= 992) closeSidebar();
});
settingsBtn.addEventListener('click', function() {
	showSection('settings');
	if (window.innerWidth <= 992) closeSidebar();
});

// Close sidebar automatically if user clicks outside of it on mobile
window.addEventListener('click', function(e) {
    if (sidebarOpen && !sidebar.contains(e.target) && !document.querySelector('.menu-icon').contains(e.target)) {
        closeSidebar();
    }
});


/*
// bar-chart code
        var options = {
          series: [{
          data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
        }],
          chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            borderRadiusApplication: 'end',
            horizontal: true,
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: ['South Korea', 'Canada', 'United Kingdom', 'Netherlands', 'Italy', 'France', 'Japan',
            'United States', 'China', 'Germany'
          ],
        }
        };

        var chart = new ApexCharts(document.querySelector("#bar-chart"), options);
        chart.render();
        */
// pie-chart code
        var options = {
          series: [44, 55, 13, 43, 22],
          chart: {
          width: 380,
          type: 'pie',
        },
        labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
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

        var chart = new ApexCharts(document.querySelector("#pie-chart"), options);
        chart.render();
// line-chart code
        var options = {
          series: [{
            name: "Desktops",
            data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
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
        title: {
          text: 'Product Trends by Month',
          align: 'left'
        },
        grid: {
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        }
        };

        var chart = new ApexCharts(document.querySelector("#line-chart"), options);
        chart.render();
// column chart
        var options = {
          series: [{
          name: 'Net Profit',
          data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
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
          categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        },
        yaxis: {
          title: {
            text: '$ (thousands)'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return "$ " + val + " thousands"
            }
          }
        }
        };

        var chart = new ApexCharts(document.querySelector("#bar-chart"), options);
        chart.render();
// Transaction distribution status
        var options = {
          series: [{
          name: 'Net Profit',
          data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
        }, {
          name: 'Revenue',
          data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
        }, {
          name: 'Free Cash Flow',
          data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
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
          categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
        },
        yaxis: {
          title: {
            text: '$ (thousands)'
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return "$ " + val + " thousands"
            }
          }
        }
        };

        var chart = new ApexCharts(document.querySelector("#Transaction-distribution-status"), options);
        chart.render();
