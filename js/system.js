/**
 * System Module for HealthAdmin Lite
 * Handles system status monitoring and management
 */

let resourceChart = null;
let updateInterval = null;

// Initialize system module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and admin status
    checkAdminAccess();

    // Initialize the system status
    initSystemStatus();

    // Setup event listeners
    setupEventListeners();

    // Start auto-refresh
    startAutoRefresh();
});

/**
 * Checks if the current user has admin access
 * Redirects to login page if not authenticated or not an admin
 */
function checkAdminAccess() {
    // Check if user is logged in
    const authToken = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    if (!authToken) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Check if user is an administrator
    if (userData.role !== 'Administrator' && userData.role !== 'admin') {
        // Not an admin, redirect to dashboard
        window.location.href = 'index.html';
        Utils.showToast('You do not have admin privileges.', 'error');
        return;
    }

    // Update user info in the sidebar
    if (typeof Auth !== 'undefined') {
        Auth.updateUserInfo(userData);
    }
}

/**
 * Initializes the system status page
 */
async function initSystemStatus() {
    try {
        // Load system status data
        await updateSystemStatus();

        // Initialize resource chart
        initResourceChart();

        // Update last refresh time
        updateLastRefreshTime();
    } catch (error) {
        console.error('Error initializing system status:', error);
        Utils.showToast('Error initializing system status', 'error');
    }
}

/**
 * Sets up event listeners for system status page
 */
function setupEventListeners() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-status');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshSystemStatus();
        });
    }

    // System backup button
    const backupBtn = document.getElementById('system-backup');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            showBackupModal();
        });
    }

    // Restart services button
    const restartServicesBtn = document.getElementById('restart-services');
    if (restartServicesBtn) {
        restartServicesBtn.addEventListener('click', function() {
            showRestartServiceModal('all');
        });
    }

    // Restart all services button
    const restartAllServicesBtn = document.getElementById('restart-all-services');
    if (restartAllServicesBtn) {
        restartAllServicesBtn.addEventListener('click', function() {
            showRestartServiceModal('all');
        });
    }

    // Resource history period selector
    const resourceHistoryPeriod = document.getElementById('resource-history-period');
    if (resourceHistoryPeriod) {
        resourceHistoryPeriod.addEventListener('change', function() {
            updateResourceChart(this.value);
        });
    }

    // Database buttons
    const optimizeDbBtn = document.getElementById('optimize-db');
    const backupDbBtn = document.getElementById('backup-db');

    if (optimizeDbBtn) {
        optimizeDbBtn.addEventListener('click', function() {
            optimizeDatabase();
        });
    }

    if (backupDbBtn) {
        backupDbBtn.addEventListener('click', function() {
            backupDatabase();
        });
    }

    // Logs filter
    const logLevelFilter = document.getElementById('log-level-filter');
    if (logLevelFilter) {
        logLevelFilter.addEventListener('change', function() {
            filterSystemLogs(this.value);
        });
    }

    // Download logs button
    const downloadLogsBtn = document.getElementById('download-logs');
    if (downloadLogsBtn) {
        downloadLogsBtn.addEventListener('click', function() {
            downloadSystemLogs();
        });
    }

    // Start backup button in modal
    const startBackupBtn = document.getElementById('start-backup');
    if (startBackupBtn) {
        startBackupBtn.addEventListener('click', function() {
            startSystemBackup();
        });
    }

    // Confirm restart service button in modal
    const confirmRestartBtn = document.getElementById('confirm-restart-service');
    if (confirmRestartBtn) {
        confirmRestartBtn.addEventListener('click', function() {
            confirmRestartService();
        });
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, #cancel-restart-service, #cancel-backup');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
}

/**
 * Updates the system status data
 */
async function updateSystemStatus() {
    try {
        // In a real app, this would call the API to get system status
        // For demo, we'll use mock data from our API.js file
        const response = await API.getSystemStatus();

        if (response.success) {
            // Update system resource widgets
            document.getElementById('cpu-usage').textContent = `${response.system.cpu}%`;
            document.getElementById('memory-usage').textContent = `${response.system.memory}%`;
            document.getElementById('disk-usage').textContent = `${response.system.disk}%`;
            document.getElementById('system-temp').textContent = `${response.system.temperature}°C`;

            // Update progress bars
            document.querySelector('#cpu-usage').nextElementSibling.querySelector('.progress-fill').style.width = `${response.system.cpu}%`;
            document.querySelector('#memory-usage').nextElementSibling.querySelector('.progress-fill').style.width = `${response.system.memory}%`;
            document.querySelector('#disk-usage').nextElementSibling.querySelector('.progress-fill').style.width = `${response.system.disk}%`;
            document.querySelector('#system-temp').nextElementSibling.querySelector('.progress-fill').style.width = `${response.system.temperature}%`;

            // Set color for progress bars based on values
            setProgressBarColor('#cpu-usage', response.system.cpu);
            setProgressBarColor('#memory-usage', response.system.memory);
            setProgressBarColor('#disk-usage', response.system.disk);
            setProgressBarColor('#system-temp', response.system.temperature, 'temperature');

            // Update database info
            document.getElementById('db-size').textContent = response.database.size;
            document.getElementById('db-tables').textContent = response.database.tables || '24';
            document.getElementById('db-connections').textContent = response.database.connections;
            document.getElementById('last-backup').textContent = response.database.lastBackup;

            // Update services status
            updateServicesStatus(response.services);
        } else {
            Utils.showToast('Error fetching system status', 'error');
        }
    } catch (error) {
        console.error('Error updating system status:', error);
        Utils.showToast('Error updating system status', 'error');
    }
}

/**
 * Sets the color of a progress bar based on its value
 * @param {string} elementId - ID of the element containing the value
 * @param {number} value - Current value
 * @param {string} type - Type of metric (default, temperature)
 */
function setProgressBarColor(elementId, value, type = 'default') {
    const progressBar = document.querySelector(elementId).nextElementSibling.querySelector('.progress-fill');

    if (type === 'temperature') {
        // Temperature specific thresholds
        if (value > 70) {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #ff4757, #ff6b81)';
        } else if (value > 60) {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #ff9f43, #feca57)';
        } else {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #2ed573, #7bed9f)';
        }
    } else {
        // Default thresholds
        if (value > 80) {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #ff4757, #ff6b81)';
        } else if (value > 60) {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #ff9f43, #feca57)';
        } else {
            progressBar.style.backgroundImage = 'linear-gradient(to right, #2ed573, #7bed9f)';
        }
    }
}

/**
 * Updates the services status table
 * @param {Array} services - List of services
 */
function updateServicesStatus(services) {
    const servicesTable = document.getElementById('services-table');
    if (!servicesTable || !services) return;

    // In a real app, this would update the table with actual service data
    // For demo, we'll leave it as is since it's already populated with mock data
}

/**
 * Initializes the resource usage chart
 */
async function initResourceChart() {
    const ctx = document.getElementById('resourceChart');
    if (!ctx) return;

    const period = document.getElementById('resource-history-period').value;

    try {
        // In a real app, this would fetch resource history data from the API
        // For demo, we'll generate mock data

        const data = generateResourceHistoryData(period);

        // Create chart
        resourceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'CPU Usage (%)',
                        data: data.cpu,
                        borderColor: 'rgba(74, 138, 244, 1)',
                        backgroundColor: 'rgba(74, 138, 244, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Memory Usage (%)',
                        data: data.memory,
                        borderColor: 'rgba(46, 213, 115, 1)',
                        backgroundColor: 'rgba(46, 213, 115, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Disk Usage (%)',
                        data: data.disk,
                        borderColor: 'rgba(255, 159, 67, 1)',
                        backgroundColor: 'rgba(255, 159, 67, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
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
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing resource chart:', error);
    }
}

/**
 * Updates the resource usage chart with a new period
 * @param {string} period - Time period (hour, day, week, month)
 */
function updateResourceChart(period) {
    if (!resourceChart) return;

    try {
        // Generate new data for the selected period
        const data = generateResourceHistoryData(period);

        // Update chart data
        resourceChart.data.labels = data.labels;
        resourceChart.data.datasets[0].data = data.cpu;
        resourceChart.data.datasets[1].data = data.memory;
        resourceChart.data.datasets[2].data = data.disk;

        // Update chart
        resourceChart.update();
    } catch (error) {
        console.error('Error updating resource chart:', error);
    }
}

/**
 * Generates mock resource history data for the chart
 * @param {string} period - Time period (hour, day, week, month)
 * @returns {Object} Chart data object with labels and datasets
 */
function generateResourceHistoryData(period) {
    const labels = [];
    const cpuData = [];
    const memoryData = [];
    const diskData = [];

    const now = new Date();
    const seed = now.getTime();

    let pointCount = 0;
    let interval = 0;
    let format = '';

    // Determine data points based on period
    switch (period) {
        case 'hour':
            pointCount = 60;
            interval = 60 * 1000; // 1 minute
            format = 'time';
            break;
        case 'day':
            pointCount = 24;
            interval = 60 * 60 * 1000; // 1 hour
            format = 'time';
            break;
        case 'week':
            pointCount = 7;
            interval = 24 * 60 * 60 * 1000; // 1 day
            format = 'date';
            break;
        case 'month':
            pointCount = 30;
            interval = 24 * 60 * 60 * 1000; // 1 day
            format = 'date';
            break;
        default:
            pointCount = 24;
            interval = 60 * 60 * 1000;
            format = 'time';
    }

    // Generate data points
    for (let i = pointCount - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * interval));

        // Format time label
        let label = '';
        if (format === 'time') {
            label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            label = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        labels.push(label);

        // Generate semi-random data using a seeded random function
        const random = (min, max, seed, offset) => {
            const x = Math.sin(seed + offset) * 10000;
            const r = x - Math.floor(x);
            return Math.floor(r * (max - min + 1)) + min;
        };

        // CPU usage - varies more
        const cpu = random(20, 70, seed + i, 0);
        cpuData.push(cpu + (i % 3 === 0 ? random(0, 15, seed + i, 1) : 0));

        // Memory usage - more stable, generally increasing
        memoryData.push(30 + Math.min(i, 20) + random(0, 10, seed + i, 2));

        // Disk usage - very stable, slight increase
        diskData.push(55 + (i * 0.05) + random(0, 3, seed + i, 3));
    }

    return {
        labels,
        cpu: cpuData,
        memory: memoryData,
        disk: diskData
    };
}

/**
 * Refreshes the system status data
 */
async function refreshSystemStatus() {
    try {
        // Show loading toast
        Utils.showToast('Refreshing system status...', 'info');

        // Update system status
        await updateSystemStatus();

        // Update resource chart with current period
        const period = document.getElementById('resource-history-period').value;
        updateResourceChart(period);

        // Update last refresh time
        updateLastRefreshTime();

        // Show success toast
        Utils.showToast('System status refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing system status:', error);
        Utils.showToast('Error refreshing system status', 'error');
    }
}

/**
 * Updates the last refresh time display
 */
function updateLastRefreshTime() {
    const timeElement = document.getElementById('last-update-time');
    if (timeElement) {
        timeElement.textContent = `Last updated: Just now`;
    }
}

/**
 * Starts the auto-refresh timer
 */
function startAutoRefresh() {
    // Clear existing interval if any
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    // Set auto-refresh interval (2 minutes)
    updateInterval = setInterval(function() {
        const timeElement = document.getElementById('last-update-time');
        if (timeElement && timeElement.textContent.includes('Just now')) {
            timeElement.textContent = `Last updated: 1 minute ago`;
        } else if (timeElement && timeElement.textContent.includes('1 minute ago')) {
            // Refresh after 2 minutes
            refreshSystemStatus();
        }
    }, 60000); // Check every minute
}

/**
 * Shows the backup system modal
 */
function showBackupModal() {
    document.getElementById('backup-system-modal').style.display = 'block';
}

/**
 * Shows the restart service confirmation modal
 * @param {string} serviceId - ID of the service to restart, or 'all' for all services
 */
function showRestartServiceModal(serviceId) {
    const modal = document.getElementById('restart-service-modal');
    const serviceNameSpan = document.getElementById('service-name-to-restart');

    if (modal && serviceNameSpan) {
        if (serviceId === 'all') {
            serviceNameSpan.textContent = 'all services';
        } else {
            // In a real app, you would fetch the service name from the API
            // For demo, we'll use a mapping
            const serviceNames = {
                'web-server': 'Web Server',
                'db-server': 'Database Server',
                'api-server': 'API Server',
                'data-collector': 'Data Collector Service',
                'notification-service': 'Notification Service',
                'backup-service': 'Backup Service'
            };

            serviceNameSpan.textContent = serviceNames[serviceId] || serviceId;
        }

        // Store service ID as data attribute for the confirm button
        document.getElementById('confirm-restart-service').setAttribute('data-service-id', serviceId);

        modal.style.display = 'block';
    }
}

/**
 * Confirms and executes a service restart
 */
async function confirmRestartService() {
    const serviceId = document.getElementById('confirm-restart-service').getAttribute('data-service-id');

    try {
        // Close the modal
        closeAllModals();

        // Show loading toast
        Utils.showToast(`Restarting ${serviceId === 'all' ? 'all services' : 'service'}...`, 'info');

        // In a real app, this would call the API to restart the service
        // For demo, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success toast
        Utils.showToast(
            serviceId === 'all'
                ? 'All services have been restarted successfully'
                : `Service has been restarted successfully`,
            'success'
        );

        // Refresh system status after restart
        await refreshSystemStatus();
    } catch (error) {
        console.error('Error restarting service:', error);
        Utils.showToast('Error restarting service', 'error');
    }
}

/**
 * Starts a system backup
 */
async function startSystemBackup() {
    // Get selected options
    const backupDatabase = document.getElementById('backup-database').checked;
    const backupUserFiles = document.getElementById('backup-user-files').checked;
    const backupSystemConfig = document.getElementById('backup-system-config').checked;
    const backupLogs = document.getElementById('backup-logs').checked;
    const backupLocation = document.getElementById('backup-location').value;
    const compression = document.getElementById('backup-compression').value;
    const encryption = document.getElementById('backup-encryption').value;

    if (!backupDatabase && !backupUserFiles && !backupSystemConfig && !backupLogs) {
        Utils.showToast('Please select at least one component to backup', 'warning');
        return;
    }

    try {
        // Close the modal
        closeAllModals();

        // Show loading toast
        Utils.showToast('Starting system backup...', 'info');

        // In a real app, this would call the API to start a backup
        // For demo, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Show success toast
        Utils.showToast('System backup started successfully. You will be notified when it completes.', 'success');
    } catch (error) {
        console.error('Error starting backup:', error);
        Utils.showToast('Error starting backup', 'error');
    }
}

/**
 * Optimizes the database
 */
async function optimizeDatabase() {
    try {
        // Show loading toast
        Utils.showToast('Optimizing database...', 'info');

        // In a real app, this would call the API to optimize the database
        // For demo, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success toast
        Utils.showToast('Database optimized successfully', 'success');
    } catch (error) {
        console.error('Error optimizing database:', error);
        Utils.showToast('Error optimizing database', 'error');
    }
}

/**
 * Backs up the database
 */
async function backupDatabase() {
    try {
        // Show loading toast
        Utils.showToast('Backing up database...', 'info');

        // In a real app, this would call the API to backup the database
        // For demo, we'll simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success toast
        Utils.showToast('Database backup completed successfully', 'success');
    } catch (error) {
        console.error('Error backing up database:', error);
        Utils.showToast('Error backing up database', 'error');
    }
}

/**
 * Filters system logs by level
 * @param {string} level - Log level (all, info, warning, error, critical)
 */
function filterSystemLogs(level) {
    const logEntries = document.querySelectorAll('.log-entry');

    logEntries.forEach(entry => {
        const logLevel = entry.querySelector('.log-level').textContent.toLowerCase();

        if (level === 'all' || logLevel === level) {
            entry.style.display = 'flex';
        } else {
            entry.style.display = 'none';
        }
    });
}

/**
 * Downloads system logs
 */
function downloadSystemLogs() {
    try {
        // In a real app, this would call the API to get logs
        // For demo, we'll generate a sample log file

        const logContent = `2025-05-09 10:15:02 [INFO] [API Server] User 'johndoe' logged in successfully.
2025-05-09 10:14:45 [INFO] [Data Collector] New health data received from device ID: DEV-2023-045.
2025-05-09 10:12:03 [WARNING] [Database Server] High query load detected (45 queries/sec).
2025-05-09 10:10:22 [ERROR] [Notification Service] Failed to send notification email to user 'janedoe@example.com'.
2025-05-09 10:05:16 [INFO] [Web Server] HTTP request handled: GET /api/health-data/user/15 (200 OK).
2025-05-09 09:58:04 [CRITICAL] [System] Disk space running low (85% used). Consider cleanup or expansion.
2025-05-09 09:45:22 [INFO] [API Server] New user 'sarahsmith' registered successfully.`;

        // Create download link
        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.setAttribute('href', url);
        link.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.log`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Utils.showToast('System logs downloaded successfully', 'success');
    } catch (error) {
        console.error('Error downloading logs:', error);
        Utils.showToast('Error downloading logs', 'error');
    }
}

/**
 * Closes all modal dialogs
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

/**
 * Restarts a specific service
 * @param {string} serviceId - ID of the service to restart
 */
function restartService(serviceId) {
    showRestartServiceModal(serviceId);
}

/**
 * Stops a specific service
 * @param {string} serviceId - ID of the service to stop
 */
function stopService(serviceId) {
    // In a real app, this would call the API to stop the service
    // For demo, show a toast message
    Utils.showToast(`Stopping ${serviceId}...`, 'info');

    // Simulate a delay
    setTimeout(() => {
        Utils.showToast(`${serviceId} stopped successfully`, 'success');
    }, 1500);
}

/**
 * Starts a specific service
 * @param {string} serviceId - ID of the service to start
 */
function startService(serviceId) {
    // In a real app, this would call the API to start the service
    // For demo, show a toast message
    Utils.showToast(`Starting ${serviceId}...`, 'info');

    // Simulate a delay
    setTimeout(() => {
        Utils.showToast(`${serviceId} started successfully`, 'success');
    }, 1500);
}

// Export functions for global access
window.restartService = restartService;
window.stopService = stopService;
window.startService = startService;