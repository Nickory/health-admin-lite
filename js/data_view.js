/**
 * Data View Module for HealthAdmin Lite
 * Handles health data visualization, filtering, and management
 */

// Current state variables
let currentPage = 1;
let currentLimit = 25;
let currentDataType = 'all';
let currentDateRange = 'week';
let healthMetricsChart = null;
let currentChartViewType = 'line';

// Initialize data view when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    if (typeof Auth !== 'undefined') {
        Auth.checkAuthStatus();
    }

    initDataView();
    setupEventListeners();
});

/**
 * Initialize data view with initial data
 */
async function initDataView() {
    try {
        // Initialize health metrics chart
        initHealthMetricsChart();

        // Load health data records
        await loadHealthData();

        // Load alerts
        await loadAbnormalAlerts();
    } catch (error) {
        console.error('Data view initialization error:', error);
        Utils.showToast('Error loading health data. Please try again later.', 'error');
    }
}

/**
 * Set up event listeners for data view interactions
 */
function setupEventListeners() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Date range selector
    const dateRangeSelect = document.getElementById('date-range');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            if (this.value === 'custom') {
                customDateRange.style.display = 'block';
            } else {
                customDateRange.style.display = 'none';
                currentDateRange = this.value;
            }
        });
    }

    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    // Chart view type selector
    const chartViewType = document.getElementById('chart-view-type');
    if (chartViewType) {
        chartViewType.addEventListener('change', function() {
            updateChartType(this.value);
        });
    }

    // Entries per page selector
    const entriesPerPage = document.getElementById('entries-per-page');
    if (entriesPerPage) {
        entriesPerPage.addEventListener('change', function() {
            currentLimit = parseInt(this.value);
            currentPage = 1;
            loadHealthData();
        });
    }

    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadHealthData();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            currentPage++;
            loadHealthData();
        });
    }

    // Export data button
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportHealthData);
    }

    // Import data button
    const importDataBtn = document.getElementById('import-data');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importHealthData);
    }

    // Modal close buttons
    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeDataRecordModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeDataRecordModal);
    }

    // Modal action buttons
    const deleteRecordBtn = document.getElementById('delete-record');
    const editRecordBtn = document.getElementById('edit-record');

    if (deleteRecordBtn) {
        deleteRecordBtn.addEventListener('click', deleteDataRecord);
    }

    if (editRecordBtn) {
        editRecordBtn.addEventListener('click', editDataRecord);
    }
}

/**
 * Initializes the health metrics comparison chart
 */
async function initHealthMetricsChart() {
    const ctx = document.getElementById('healthMetricsChart').getContext('2d');

    // Fetch initial chart data for all metrics
    const heartRateData = await API.getChartData('heart-rate', currentDateRange);
    const oxygenData = await API.getChartData('oxygen', currentDateRange);
    const respData = await API.getChartData('respiratory', currentDateRange);

    if (heartRateData.success && oxygenData.success && respData.success) {
        const labels = heartRateData.labels;

        // Create chart
        healthMetricsChart = new Chart(ctx, {
            type: currentChartViewType,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Heart Rate (BPM)',
                        data: heartRateData.data,
                        backgroundColor: 'rgba(74, 138, 244, 0.1)',
                        borderColor: 'rgba(74, 138, 244, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(74, 138, 244, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Oxygen Level (%)',
                        data: oxygenData.data,
                        backgroundColor: 'rgba(0, 200, 83, 0.1)',
                        borderColor: 'rgba(0, 200, 83, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(0, 200, 83, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Respiratory Rate (BPM)',
                        data: respData.data,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Heart Rate (BPM)'
                        },
                        min: 40,
                        max: 120,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Oxygen Level (%)'
                        },
                        min: 90,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Respiratory Rate (BPM)'
                        },
                        min: 8,
                        max: 25,
                        grid: {
                            drawOnChartArea: false
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
                        position: 'top',
                        align: 'center'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1
                    }
                }
            }
        });
    }
}

/**
 * Updates the chart type (line or bar)
 * @param {string} chartType - Type of chart (line or bar)
 */
function updateChartType(chartType) {
    if (!healthMetricsChart) return;

    currentChartViewType = chartType;
    healthMetricsChart.config.type = chartType;
    healthMetricsChart.update();
}

/**
 * Applies the selected filters to the data view
 */
async function applyFilters() {
    // Get filter values
    const dateRange = document.getElementById('date-range').value;
    const dataType = document.getElementById('data-type').value;

    // Check if custom date range is selected
    if (dateRange === 'custom') {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            Utils.showToast('Please select both start and end dates for custom range.', 'warning');
            return;
        }

        currentDateRange = {
            startDate,
            endDate
        };
    } else {
        currentDateRange = dateRange;
    }

    currentDataType = dataType;
    currentPage = 1;

    // Update chart based on selected filters
    await updateChartWithFilters();

    // Reload health data with new filters
    await loadHealthData();

    Utils.showToast('Filters applied successfully.', 'success');
}

/**
 * Updates the chart with selected filters
 */
async function updateChartWithFilters() {
    if (!healthMetricsChart) return;

    try {
        // Determine which metrics to show based on data type
        let metrics = [];

        switch (currentDataType) {
            case 'heart-rate':
                metrics = ['heart-rate'];
                break;
            case 'oxygen':
                metrics = ['oxygen'];
                break;
            case 'temperature':
                metrics = ['temperature'];
                break;
            case 'respiratory':
                metrics = ['respiratory'];
                break;
            default:
                metrics = ['heart-rate', 'oxygen', 'respiratory'];
                break;
        }

        const chartDataPromises = metrics.map(metric => API.getChartData(metric, currentDateRange));
        const results = await Promise.all(chartDataPromises);

        // Get labels from the first result
        const labels = results[0].labels;

        // Update chart datasets
        healthMetricsChart.data.labels = labels;

        // Clear existing datasets
        healthMetricsChart.data.datasets = [];

        // Add datasets based on selected metrics
        if (metrics.includes('heart-rate')) {
            healthMetricsChart.data.datasets.push({
                label: 'Heart Rate (BPM)',
                data: results[metrics.indexOf('heart-rate')].data,
                backgroundColor: 'rgba(74, 138, 244, 0.1)',
                borderColor: 'rgba(74, 138, 244, 1)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(74, 138, 244, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y'
            });
        }

        if (metrics.includes('oxygen')) {
            healthMetricsChart.data.datasets.push({
                label: 'Oxygen Level (%)',
                data: results[metrics.indexOf('oxygen')].data,
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                borderColor: 'rgba(0, 200, 83, 1)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(0, 200, 83, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y1'
            });
        }

        if (metrics.includes('respiratory')) {
            healthMetricsChart.data.datasets.push({
                label: 'Respiratory Rate (BPM)',
                data: results[metrics.indexOf('respiratory')].data,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderColor: 'rgba(244, 67, 54, 1)',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y2'
            });
        }

        // Update chart
        healthMetricsChart.update();
    } catch (error) {
        console.error('Error updating chart with filters:', error);
    }
}

/**
 * Loads health data records based on current filters
 */
async function loadHealthData() {
    const tableBody = document.getElementById('health-data-records');
    if (!tableBody) return;

    try {
        const filters = {
            page: currentPage,
            limit: currentLimit,
            dataType: currentDataType,
            dateRange: currentDateRange
        };

        const response = await API.getHealthData(filters);

        if (response.success && response.data.length > 0) {
            let tableHtml = '';

            response.data.forEach(item => {
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();

                tableHtml += `
                    <tr data-id="${item.id}">
                        <td>${formattedDate}</td>
                        <td>${item.heartRate}</td>
                        <td>${item.oxygenLevel}</td>
                        <td>${item.temperature}</td>
                        <td>${item.respRate}</td>
                        <td>
                            <span class="status-badge ${item.status}">
                                ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                        </td>
                        <td class="table-actions">
                            <button class="btn" onclick="viewDataRecord(${item.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-primary" onclick="editDataRecord(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger" onclick="confirmDeleteRecord(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableBody.innerHTML = tableHtml;

            // Update pagination
            updatePagination(response.pagination);
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading health data:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error loading data</td></tr>';
    }
}

/**
 * Updates pagination controls
 * @param {Object} pagination - Pagination information
 */
function updatePagination(pagination) {
    const paginationInfo = document.getElementById('data-pagination-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');

    if (paginationInfo) {
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(start + pagination.limit - 1, pagination.total);

        paginationInfo.textContent = `Showing ${start} to ${end} of ${pagination.total} entries`;
    }

    if (prevPageBtn) {
        prevPageBtn.disabled = pagination.page === 1;
    }

    if (nextPageBtn) {
        nextPageBtn.disabled = pagination.page === pagination.pages;
    }

    if (pageNumbers) {
        let pageHtml = '';

        // Determine which page numbers to show
        let startPage = Math.max(1, pagination.page - 2);
        let endPage = Math.min(pagination.pages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageHtml += `
                <button class="btn ${i === pagination.page ? 'btn-primary' : ''}" 
                       onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }

        pageNumbers.innerHTML = pageHtml;
    }
}

/**
 * Changes the current page
 * @param {number} page - Page number to navigate to
 */
function changePage(page) {
    currentPage = page;
    loadHealthData();
}

/**
 * Loads abnormal data alerts
 */
async function loadAbnormalAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    try {
        // In a real application, this would fetch actual alerts from the API
        const response = await API.getHealthData();

        if (response.success && response.alerts && response.alerts.length > 0) {
            let alertsHtml = '';

            response.alerts.forEach(alert => {
                const alertClass = alert.type === 'warning' ? 'warning' : 'danger';
                const alertColor = alert.type === 'warning' ? 'var(--warning-color)' : 'var(--danger-color)';

                const date = new Date(alert.timestamp);
                const formattedDate = date.toLocaleString();

                alertsHtml += `
                    <div class="alert" style="background-color: rgba(${alertClass === 'warning' ? '255, 179, 0' : '244, 67, 54'}, 0.1); padding: 15px; border-left: 4px solid ${alertColor}; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: ${alertColor}; margin-bottom: 5px;">${alert.metric} Alert</h4>
                                <p>${alert.message} (${formattedDate})</p>
                            </div>
                            <div>
                                <button class="btn btn-${alertClass}" onclick="dismissAlert(${alert.id})">Dismiss</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            alertsContainer.innerHTML = alertsHtml;
        } else {
            alertsContainer.innerHTML = '<p>No abnormal data alerts at this time.</p>';
        }
    } catch (error) {
        console.error('Error loading abnormal alerts:', error);
    }
}

/**
 * Views a data record's details
 * @param {number} recordId - ID of the record to view
 */
function viewDataRecord(recordId) {
    // In a real application, fetch the record from the API
    // For demo, use mock data from the table
    const recordRow = document.querySelector(`tr[data-id="${recordId}"]`);
    if (!recordRow) return;

    const cells = recordRow.querySelectorAll('td');

    const recordDetails = {
        id: recordId,
        timestamp: cells[0].textContent,
        heartRate: cells[1].textContent,
        oxygenLevel: cells[2].textContent,
        temperature: cells[3].textContent,
        respRate: cells[4].textContent,
        status: cells[5].querySelector('.status-badge').textContent.trim()
    };

    // Populate modal with record details
    const recordDetailsContainer = document.getElementById('record-details');

    recordDetailsContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Date & Time:</strong>
                <span>${recordDetails.timestamp}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Heart Rate:</strong>
                <span>${recordDetails.heartRate} BPM</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Oxygen Level:</strong>
                <span>${recordDetails.oxygenLevel}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Temperature:</strong>
                <span>${recordDetails.temperature}°C</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Respiratory Rate:</strong>
                <span>${recordDetails.respRate} BPM</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <strong>Status:</strong>
                <span class="status-badge ${recordDetails.status.toLowerCase()}">${recordDetails.status}</span>
            </div>
        </div>
    `;

    // Store record ID for action buttons
    document.getElementById('edit-record').setAttribute('data-id', recordId);
    document.getElementById('delete-record').setAttribute('data-id', recordId);

    // Show modal
    document.getElementById('data-record-modal').style.display = 'block';
}

/**
 * Edits a data record
 * @param {number} recordId - ID of the record to edit
 */
function editDataRecord(recordId) {
    // Close modal if open
    closeDataRecordModal();

    // In a real application, this would open an edit form
    // For demo, just show a toast message
    Utils.showToast(`Editing record #${recordId}. This feature would open an edit form.`, 'info');
}

/**
 * Confirms deletion of a data record
 * @param {number} recordId - ID of the record to delete
 */
function confirmDeleteRecord(recordId) {
    if (confirm(`Are you sure you want to delete record #${recordId}?`)) {
        deleteDataRecord(recordId);
    }
}

/**
 * Deletes a data record
 * @param {number|Event} recordIdOrEvent - Record ID or event object
 */
function deleteDataRecord(recordIdOrEvent) {
    let recordId;

    // Check if called from event or directly
    if (typeof recordIdOrEvent === 'object') {
        recordId = recordIdOrEvent.target.getAttribute('data-id');
    } else {
        recordId = recordIdOrEvent;
    }

    // In a real application, this would call the API to delete the record
    // For demo, just remove from the table
    const recordRow = document.querySelector(`tr[data-id="${recordId}"]`);
    if (recordRow) {
        recordRow.remove();
    }

    // Close modal if open
    closeDataRecordModal();

    Utils.showToast(`Record #${recordId} has been deleted.`, 'success');
}

/**
 * Closes the data record modal
 */
function closeDataRecordModal() {
    document.getElementById('data-record-modal').style.display = 'none';
}

/**
 * Dismisses an alert
 * @param {number} alertId - ID of the alert to dismiss
 */
function dismissAlert(alertId) {
    const alertElement = document.querySelector(`.alert button[onclick="dismissAlert(${alertId})"]`).closest('.alert');

    if (alertElement) {
        // Fade out and remove
        alertElement.style.opacity = '0';
        alertElement.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            alertElement.remove();

            // Check if there are any alerts left
            const alertsContainer = document.getElementById('alerts-container');
            if (alertsContainer && !alertsContainer.querySelector('.alert')) {
                alertsContainer.innerHTML = '<p>No abnormal data alerts at this time.</p>';
            }
        }, 300);
    }
}

/**
 * Exports health data as CSV
 */
function exportHealthData() {
    try {
        // In a real application, this would generate a CSV from actual data
        // For demo, create a simple CSV with mock data
        const csvContent = `Date,Heart Rate (BPM),Oxygen Level (%),Temperature (°C),Respiratory Rate (BPM),Status
2025-05-08 14:30:00,75,98,36.6,16,Normal
2025-05-08 13:30:00,72,97,36.5,15,Normal
2025-05-08 12:30:00,80,96,36.7,17,Normal
2025-05-08 11:30:00,85,97,36.8,18,Normal
2025-05-08 10:30:00,78,98,36.6,16,Normal
2025-05-08 09:30:00,110,95,37.2,20,Danger
2025-05-08 08:30:00,68,93,36.4,14,Warning
2025-05-08 07:30:00,72,98,36.5,15,Normal
2025-05-08 06:30:00,70,97,36.4,14,Normal
2025-05-08 05:30:00,65,98,36.3,13,Normal`;

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `health_data_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Utils.showToast('Health data exported successfully.', 'success');
    } catch (error) {
        console.error('Error exporting health data:', error);
        Utils.showToast('Error exporting health data.', 'error');
    }
}

/**
 * Imports health data from CSV
 */
function importHealthData() {
    // In a real application, this would open a file picker and process the CSV
    // For demo, just show a toast message

    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];

        if (file) {
            // Show loading toast
            Utils.showToast(`Importing data from ${file.name}...`, 'info');

            // Simulate processing time
            setTimeout(() => {
                Utils.showToast('Health data imported successfully.', 'success');

                // Refresh data view
                loadHealthData();
            }, 1500);
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Expose functions to global scope
window.changePage = changePage;
window.viewDataRecord = viewDataRecord;
window.editDataRecord = editDataRecord;
window.confirmDeleteRecord = confirmDeleteRecord;
window.deleteDataRecord = deleteDataRecord;
window.dismissAlert = dismissAlert;