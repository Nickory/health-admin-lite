/**
 * Dashboard Module for HealthAdmin Lite
 * Handles dashboard functionality, charts, and real-time data updates
 */

let heartRateChart = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    if (typeof Auth !== 'undefined') {
        Auth.checkAuthStatus();
    }

    initDashboard();
    setupEventListeners();

    // Start periodic updates for real-time data
    startRealtimeUpdates();
});

/**
 * Initialize dashboard with initial data
 */
async function initDashboard() {
    try {
        // Load latest health metrics for widgets
        await updateHealthMetrics();

        // Initialize heart rate chart
        initHeartRateChart();

        // Load recent health data for table
        await loadRecentHealthData();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        Utils.showToast('Error loading dashboard data. Please try again later.', 'error');
    }
}

/**
 * Set up event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Heart rate chart period selector
    const heartRatePeriod = document.getElementById('heart-rate-period');
    if (heartRatePeriod) {
        heartRatePeriod.addEventListener('change', function() {
            updateHeartRateChart(this.value);
        });
    }
}

/**
 * Updates the health metric widgets with the latest data
 */
async function updateHealthMetrics() {
    try {
        // In a real application, this would fetch the latest data from the API
        const response = await API.getHealthData({ limit: 1 });

        if (response.success && response.data.length > 0) {
            const latestData = response.data[0];

            // Update widget values
            document.getElementById('heart-rate').textContent = `${latestData.heartRate} BPM`;
            document.getElementById('oxygen-level').textContent = `${latestData.oxygenLevel}%`;
            document.getElementById('body-temp').textContent = `${latestData.temperature}°C`;
            document.getElementById('resp-rate').textContent = `${latestData.respRate} BPM`;

            // Update status indicators
            updateMetricStatus('heart-rate', latestData.heartRate, 60, 100);
            updateMetricStatus('oxygen-level', latestData.oxygenLevel, 95, 100);
            updateMetricStatus('body-temp', parseFloat(latestData.temperature), 36.0, 37.5);
            updateMetricStatus('resp-rate', latestData.respRate, 12, 20);
        }
    } catch (error) {
        console.error('Error updating health metrics:', error);
    }
}

/**
 * Updates the status indicator for a metric based on its value
 * @param {string} elementId - ID of the element to update
 * @param {number} value - Current value of the metric
 * @param {number} min - Minimum normal value
 * @param {number} max - Maximum normal value
 */
function updateMetricStatus(elementId, value, min, max) {
    const element = document.getElementById(elementId).nextElementSibling;

    if (value < min || value > max) {
        element.className = 'widget-change negative';
        element.innerHTML = '<i class="fas fa-arrow-down"></i> Abnormal';
    } else {
        element.className = 'widget-change positive';
        element.innerHTML = '<i class="fas fa-arrow-up"></i> Normal';
    }
}

/**
 * Initializes the heart rate chart
 */
async function initHeartRateChart() {
    const ctx = document.getElementById('heartRateChart').getContext('2d');
    const initialPeriod = document.getElementById('heart-rate-period').value || 'month';

    // Fetch initial chart data
    const response = await API.getChartData('heart-rate', initialPeriod);

    if (response.success) {
        const { labels, data } = response;

        // Create chart
        heartRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: data,
                    backgroundColor: 'rgba(74, 138, 244, 0.1)',
                    borderColor: 'rgba(74, 138, 244, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(74, 138, 244, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 120,
                        ticks: {
                            stepSize: 20
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: 'rgba(74, 138, 244, 0.3)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Heart Rate: ${context.parsed.y} BPM`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Updates the heart rate chart with new data based on selected period
 * @param {string} period - Data period (day, week, month)
 */
async function updateHeartRateChart(period) {
    if (!heartRateChart) return;

    try {
        const response = await API.getChartData('heart-rate', period);

        if (response.success) {
            const { labels, data } = response;

            // Update chart data
            heartRateChart.data.labels = labels;
            heartRateChart.data.datasets[0].data = data;
            heartRateChart.update();
        }
    } catch (error) {
        console.error('Error updating heart rate chart:', error);
    }
}

/**
 * Loads recent health data for the dashboard table
 */
async function loadRecentHealthData() {
    const tableBody = document.getElementById('health-data-table');
    if (!tableBody) return;

    try {
        const response = await API.getHealthData({ limit: 10 });

        if (response.success && response.data.length > 0) {
            let tableHtml = '';

            response.data.forEach(item => {
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();

                tableHtml += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${item.heartRate} BPM</td>
                        <td>${item.oxygenLevel}%</td>
                        <td>${item.temperature}°C</td>
                        <td>${item.respRate} BPM</td>
                        <td>
                            <span class="status-badge ${item.status}">
                                ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = tableHtml;
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading recent health data:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading data</td></tr>';
    }
}

/**
 * Starts periodic updates for real-time data
 */
function startRealtimeUpdates() {
    // Update health metrics every 30 seconds
    setInterval(updateHealthMetrics, 30000);

    // Update table data every 2 minutes
    setInterval(loadRecentHealthData, 120000);
}

// Export dashboard functions for other modules
window.Dashboard = {
    updateHealthMetrics,
    updateHeartRateChart
};