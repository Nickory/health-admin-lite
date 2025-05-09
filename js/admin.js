/**
 * Admin Module for HealthAdmin Lite
 * Handles user management and administrative functions
 */

// Initialize variables for pagination
let currentUserPage = 1;
let usersPerPage = 25;
let userRoleFilter = 'all';
let userSearchQuery = '';
let selectedUserId = null;
let userHealthChart = null;

// Initialize admin module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and admin status
    checkAdminAccess();

    // Initialize the user interface
    initAdminUI();

    // Load initial data
    loadUserStatistics();
    loadUserList();
    loadActivityLogs();

    // Setup event listeners
    setupEventListeners();
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
 * Initializes the admin UI, setting up dropdown behavior
 */
function initAdminUI() {
    // Initialize dropdown behavior
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const toggleButton = dropdown.querySelector('.dropdown-toggle');
        const content = dropdown.querySelector('.dropdown-content');

        // Close all dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!dropdown.contains(event.target)) {
                content.style.display = 'none';
            }
        });

        // Toggle dropdown on button click
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Close other dropdowns first
            document.querySelectorAll('.dropdown-content').forEach(dc => {
                if (dc !== content) {
                    dc.style.display = 'none';
                }
            });

            // Toggle current dropdown
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Setup modal close functionality
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal, #close-user-modal, #cancel-add-user');

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Close modal when clicking outside the content
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Sets up event listeners for admin page interactions
 */
function setupEventListeners() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // User search
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', Utils.debounce(function() {
            userSearchQuery = this.value.trim();
            currentUserPage = 1;
            loadUserList();
        }, 500));
    }

    // Role filter dropdown items
    const roleFilters = document.querySelectorAll('.dropdown-content a[data-role]');
    if (roleFilters) {
        roleFilters.forEach(filter => {
            filter.addEventListener('click', function(e) {
                e.preventDefault();
                userRoleFilter = this.getAttribute('data-role');
                document.querySelector('.dropdown-toggle').textContent = `Filter: ${userRoleFilter.charAt(0).toUpperCase() + userRoleFilter.slice(1)}`;
                document.querySelector('.dropdown-content').style.display = 'none';
                currentUserPage = 1;
                loadUserList();
            });
        });
    }

    // Users per page selector
    const usersPerPageSelect = document.getElementById('users-per-page');
    if (usersPerPageSelect) {
        usersPerPageSelect.addEventListener('change', function() {
            usersPerPage = parseInt(this.value);
            currentUserPage = 1;
            loadUserList();
        });
    }

    // Pagination buttons
    const prevPageBtn = document.getElementById('users-prev-page');
    const nextPageBtn = document.getElementById('users-next-page');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentUserPage > 1) {
                currentUserPage--;
                loadUserList();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            currentUserPage++;
            loadUserList();
        });
    }

    // Add User button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            document.getElementById('add-user-modal').style.display = 'block';
        });
    }

    // Save New User button
    const saveNewUserBtn = document.getElementById('save-new-user-btn');
    if (saveNewUserBtn) {
        saveNewUserBtn.addEventListener('click', saveNewUser);
    }

    // View All Logs button
    const viewAllLogsBtn = document.getElementById('view-all-logs');
    if (viewAllLogsBtn) {
        viewAllLogsBtn.addEventListener('click', function() {
            window.location.href = 'audit-logs.html';
        });
    }

    // User details modal buttons
    const deleteUserBtn = document.getElementById('delete-user-btn');
    const suspendUserBtn = document.getElementById('suspend-user-btn');
    const editUserBtn = document.getElementById('edit-user-btn');
    const viewHealthDataBtn = document.getElementById('view-health-data-btn');

    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', deleteUser);
    }

    if (suspendUserBtn) {
        suspendUserBtn.addEventListener('click', toggleUserStatus);
    }

    if (editUserBtn) {
        editUserBtn.addEventListener('click', editUser);
    }

    if (viewHealthDataBtn) {
        viewHealthDataBtn.addEventListener('click', viewUserHealthData);
    }

    // Health data chart filters
    const userHealthMetric = document.getElementById('user-health-metric');
    const userHealthPeriod = document.getElementById('user-health-period');

    if (userHealthMetric) {
        userHealthMetric.addEventListener('change', updateHealthDataChart);
    }

    if (userHealthPeriod) {
        userHealthPeriod.addEventListener('change', updateHealthDataChart);
    }

    // Health data modal buttons
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportHealthDataBtn = document.getElementById('export-health-data-btn');

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateHealthReport);
    }

    if (exportHealthDataBtn) {
        exportHealthDataBtn.addEventListener('click', exportUserHealthData);
    }
}

/**
 * Loads user statistics for the dashboard widgets
 */
async function loadUserStatistics() {
    try {
        // In a real app, this would fetch statistics from the API
        // For demo, we'll use mock data

        // Update widget values
        document.getElementById('total-users').textContent = '48';
        document.getElementById('healthcare-users').textContent = '12';
        document.getElementById('patient-users').textContent = '32';
        document.getElementById('admin-users').textContent = '4';

    } catch (error) {
        console.error('Error loading user statistics:', error);
        Utils.showToast('Error loading user statistics', 'error');
    }
}

/**
 * Loads the user list with pagination and filtering
 */
async function loadUserList() {
    const tableBody = document.getElementById('user-list-table');
    if (!tableBody) return;

    try {
        // In a real app, this would fetch user list from the API with filters
        // For demo, we'll simulate an API call with mock data

        // Call the API to get users (using our mock API for demo)
        const response = await mockGetUsers({
            page: currentUserPage,
            limit: usersPerPage,
            role: userRoleFilter,
            search: userSearchQuery
        });

        if (response.success) {
            let tableHtml = '';

            response.users.forEach(user => {
                const statusClass = user.status === 'active' ? 'normal' :
                                   user.status === 'pending' ? 'warning' : 'danger';

                tableHtml += `
                    <tr data-id="${user.id}">
                        <td>${user.id}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden;">
                                    <img src="${user.avatar}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <span>${user.name}</span>
                            </div>
                        </td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                        <td><span class="status-badge ${statusClass}">${Utils.capitalizeFirst(user.status)}</span></td>
                        <td>${user.lastLogin}</td>
                        <td class="table-actions">
                            <button class="btn btn-sm btn-primary" onclick="viewUserDetails(${user.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm" onclick="editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="confirmDeleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            if (response.users.length === 0) {
                tableHtml = '<tr><td colspan="8" style="text-align: center;">No users found</td></tr>';
            }

            tableBody.innerHTML = tableHtml;

            // Update pagination
            updateUsersPagination(response.pagination);
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Error loading users</td></tr>';
            Utils.showToast('Error loading users: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Error loading user list:', error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Error loading users</td></tr>';
        Utils.showToast('Error loading users', 'error');
    }
}

/**
 * Loads recent activity logs
 */
async function loadActivityLogs() {
    const tableBody = document.getElementById('activity-log-table');
    if (!tableBody) return;

    try {
        // In a real app, this would fetch recent logs from the API
        // For demo, we'll use mock data

        const logs = [
            {
                time: '2025-05-09 10:15:02',
                user: 'johndoe',
                action: 'Login',
                details: 'Successful login',
                ipAddress: '192.168.1.101'
            },
            {
                time: '2025-05-09 10:10:45',
                user: 'adminuser',
                action: 'User Update',
                details: 'Updated user profile for sarahsmith',
                ipAddress: '192.168.1.100'
            },
            {
                time: '2025-05-09 09:58:32',
                user: 'sarahsmith',
                action: 'Registration',
                details: 'New user registered',
                ipAddress: '203.0.113.42'
            },
            {
                time: '2025-05-09 09:45:18',
                user: 'adminuser',
                action: 'System',
                details: 'Database backup completed',
                ipAddress: '192.168.1.100'
            },
            {
                time: '2025-05-09 09:30:05',
                user: 'drwilliams',
                action: 'Data Access',
                details: 'Accessed patient records for johndoe',
                ipAddress: '192.168.1.105'
            }
        ];

        let tableHtml = '';

        logs.forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.time}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                    <td>${log.ipAddress}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHtml;

    } catch (error) {
        console.error('Error loading activity logs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading activity logs</td></tr>';
    }
}

/**
 * Updates the users pagination controls
 * @param {Object} pagination - Pagination information
 */
function updateUsersPagination(pagination) {
    const paginationInfo = document.getElementById('users-pagination-info');
    const prevPageBtn = document.getElementById('users-prev-page');
    const nextPageBtn = document.getElementById('users-next-page');
    const pageNumbers = document.getElementById('users-page-numbers');

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

        for (let i = 1; i <= pagination.pages; i++) {
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
    currentUserPage = page;
    loadUserList();
}

/**
 * Displays user details in a modal
 * @param {number} userId - ID of the user to view
 */
async function viewUserDetails(userId) {
    selectedUserId = userId;

    try {
        // In a real app, this would fetch user details from the API
        // For demo, we'll find the user in our mock data
        const userData = await mockGetUserById(userId);

        if (userData) {
            const modal = document.getElementById('user-details-modal');
            const content = document.getElementById('user-details-content');

            // Update suspend button text based on user status
            const suspendBtn = document.getElementById('suspend-user-btn');
            if (suspendBtn) {
                suspendBtn.textContent = userData.status === 'active' ? 'Suspend Account' : 'Activate Account';
                suspendBtn.classList.toggle('btn-warning', userData.status === 'active');
                suspendBtn.classList.toggle('btn-success', userData.status !== 'active');
            }

            // Create user details HTML
            let detailsHtml = `
                <div class="user-profile-header">
                    <div class="user-avatar-large">
                        <img src="${userData.avatar}" alt="${userData.name}">
                    </div>
                    <div class="user-info-large">
                        <h3>${userData.name}</h3>
                        <span class="role-badge ${userData.role.toLowerCase()}">${userData.role}</span>
                        <span class="status-badge ${userData.status === 'active' ? 'normal' : userData.status === 'pending' ? 'warning' : 'danger'}">
                            ${Utils.capitalizeFirst(userData.status)}
                        </span>
                    </div>
                </div>
                
                <div class="user-details-section">
                    <h4>Account Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">User ID</span>
                            <span class="detail-value">${userData.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Username</span>
                            <span class="detail-value">${userData.username}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${userData.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Account Created</span>
                            <span class="detail-value">${userData.created}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Last Login</span>
                            <span class="detail-value">${userData.lastLogin}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Last IP Address</span>
                            <span class="detail-value">${userData.lastIP || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="user-details-section">
                    <h4>Contact Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Phone</span>
                            <span class="detail-value">${userData.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Address</span>
                            <span class="detail-value">${userData.address || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">City</span>
                            <span class="detail-value">${userData.city || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">State/Province</span>
                            <span class="detail-value">${userData.state || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Country</span>
                            <span class="detail-value">${userData.country || 'Not provided'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="user-details-section">
                    <h4>Activity Summary</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Total Logins</span>
                            <span class="detail-value">${userData.stats?.logins || '0'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Data Points</span>
                            <span class="detail-value">${userData.stats?.dataPoints || '0'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Last Activity</span>
                            <span class="detail-value">${userData.stats?.lastActivity || 'Never'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Active Sessions</span>
                            <span class="detail-value">${userData.stats?.activeSessions || '0'}</span>
                        </div>
                    </div>
                </div>
            `;

            // Add medical info if user is a patient
            if (userData.role === 'Patient') {
                detailsHtml += `
                    <div class="user-details-section">
                        <h4>Medical Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Blood Type</span>
                                <span class="detail-value">${userData.medicalInfo?.bloodType || 'Not provided'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Allergies</span>
                                <span class="detail-value">${userData.medicalInfo?.allergies || 'None reported'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Conditions</span>
                                <span class="detail-value">${userData.medicalInfo?.conditions || 'None reported'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Medications</span>
                                <span class="detail-value">${userData.medicalInfo?.medications || 'None reported'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Emergency Contact</span>
                                <span class="detail-value">${userData.medicalInfo?.emergencyContact || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            content.innerHTML = detailsHtml;
            modal.style.display = 'block';
        } else {
            Utils.showToast('User not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing user details:', error);
        Utils.showToast('Error loading user details', 'error');
    }
}

/**
 * Shows confirmation dialog for deleting a user
 * @param {number} userId - ID of the user to delete
 */
function confirmDeleteUser(userId) {
    selectedUserId = userId;

    if (confirm(`Are you sure you want to delete user #${userId}? This action cannot be undone.`)) {
        deleteUser();
    }
}

/**
 * Deletes the selected user
 */
async function deleteUser() {
    if (!selectedUserId) return;

    try {
        // In a real app, this would call the API to delete the user
        // For demo, we'll simulate a successful deletion

        Utils.showToast(`User #${selectedUserId} has been deleted.`, 'success');

        // Close the modal if open
        document.getElementById('user-details-modal').style.display = 'none';

        // Reload the user list
        await loadUserList();
        await loadUserStatistics();

    } catch (error) {
        console.error('Error deleting user:', error);
        Utils.showToast('Error deleting user', 'error');
    }
}

/**
 * Toggles the selected user's status (active/suspended)
 */
async function toggleUserStatus() {
    if (!selectedUserId) return;

    try {
        // In a real app, this would call the API to update the user status
        // For demo, we'll simulate a successful update

        const userData = await mockGetUserById(selectedUserId);
        const newStatus = userData.status === 'active' ? 'suspended' : 'active';
        const action = newStatus === 'active' ? 'activated' : 'suspended';

        Utils.showToast(`User #${selectedUserId} has been ${action}.`, 'success');

        // Close the modal
        document.getElementById('user-details-modal').style.display = 'none';

        // Reload the user list
        await loadUserList();

    } catch (error) {
        console.error('Error updating user status:', error);
        Utils.showToast('Error updating user status', 'error');
    }
}

/**
 * Opens edit modal for the selected user
 * @param {number} userId - ID of the user to edit (optional, uses selectedUserId if not provided)
 */
function editUser(userId = null) {
    if (userId) selectedUserId = userId;
    if (!selectedUserId) return;

    // In a real app, this would open an edit form pre-populated with user data
    // For demo, just show a toast message

    // Close the details modal if open
    document.getElementById('user-details-modal').style.display = 'none';

    Utils.showToast(`Editing user #${selectedUserId}. This feature would open an edit form.`, 'info');
}

/**
 * Saves a new user
 */
async function saveNewUser() {
    const name = document.getElementById('new-user-name').value;
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('new-user-email').value;
    const role = document.getElementById('new-user-role').value;
    const password = document.getElementById('new-user-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const phone = document.getElementById('new-user-phone').value;
    const status = document.getElementById('new-user-status').value;

    // Validate input
    if (!name || !username || !email || !role || !password) {
        Utils.showToast('Please fill in all required fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        Utils.showToast('Passwords do not match', 'error');
        return;
    }

    try {
        // In a real app, this would call the API to create the user
        // For demo, we'll simulate a successful creation

        Utils.showToast(`User ${name} has been created successfully.`, 'success');

        // Close the modal
        document.getElementById('add-user-modal').style.display = 'none';

        // Reset form
        document.getElementById('add-user-form').reset();

        // Reload the user list and statistics
        await loadUserList();
        await loadUserStatistics();

    } catch (error) {
        console.error('Error creating user:', error);
        Utils.showToast('Error creating user', 'error');
    }
}

/**
 * Opens the health data modal for the selected user
 */
async function viewUserHealthData() {
    if (!selectedUserId) return;

    try {
        // In a real app, this would fetch the user's health data from the API
        const userData = await mockGetUserById(selectedUserId);

        if (userData) {
            // Close the user details modal
            document.getElementById('user-details-modal').style.display = 'none';

            // Update the health data modal title
            const modalTitle = document.querySelector('#user-health-data-modal .modal-header h3');
            if (modalTitle) {
                modalTitle.textContent = `Health Data: ${userData.name}`;
            }

            // Initialize the health data chart
            initHealthDataChart();

            // Load health data table
            loadUserHealthDataTable();

            // Update health summary
            updateHealthSummary();

            // Show the modal
            document.getElementById('user-health-data-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error viewing user health data:', error);
        Utils.showToast('Error loading health data', 'error');
    }
}

/**
 * Initializes the health data chart
 */
async function initHealthDataChart() {
    const ctx = document.getElementById('userHealthChart');
    if (!ctx) return;

    const metric = document.getElementById('user-health-metric').value;
    const period = document.getElementById('user-health-period').value;

    try {
        // In a real app, this would fetch the user's health data from the API
        // For demo, we'll use mock data

        const response = await API.getChartData(metric, period);

        if (response.success) {
            // Destroy previous chart if it exists
            if (userHealthChart) {
                userHealthChart.destroy();
            }

            // Create the chart
            userHealthChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: response.labels,
                    datasets: [{
                        label: getMetricLabel(metric),
                        data: response.data,
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
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#333',
                            bodyColor: '#666',
                            borderColor: 'rgba(74, 138, 244, 0.3)',
                            borderWidth: 1
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error initializing health data chart:', error);
    }
}

/**
 * Updates the health data chart with the selected metric and period
 */
async function updateHealthDataChart() {
    const metric = document.getElementById('user-health-metric').value;
    const period = document.getElementById('user-health-period').value;

    try {
        // In a real app, this would fetch the user's health data from the API
        // For demo, we'll use mock data

        const response = await API.getChartData(metric, period);

        if (response.success && userHealthChart) {
            // Update chart data
            userHealthChart.data.labels = response.labels;
            userHealthChart.data.datasets[0].label = getMetricLabel(metric);
            userHealthChart.data.datasets[0].data = response.data;

            // Update scales based on metric
            if (metric === 'heart-rate') {
                userHealthChart.options.scales.y.min = 40;
                userHealthChart.options.scales.y.max = 120;
            } else if (metric === 'oxygen') {
                userHealthChart.options.scales.y.min = 90;
                userHealthChart.options.scales.y.max = 100;
            } else if (metric === 'temperature') {
                userHealthChart.options.scales.y.min = 35;
                userHealthChart.options.scales.y.max = 38;
            } else if (metric === 'respiratory') {
                userHealthChart.options.scales.y.min = 8;
                userHealthChart.options.scales.y.max = 25;
            }

            userHealthChart.update();
        }
    } catch (error) {
        console.error('Error updating health data chart:', error);
    }
}

/**
 * Gets the label for a health metric
 * @param {string} metric - The metric code
 * @returns {string} Human-readable label
 */
function getMetricLabel(metric) {
    switch (metric) {
        case 'heart-rate':
            return 'Heart Rate (BPM)';
        case 'oxygen':
            return 'Oxygen Level (%)';
        case 'temperature':
            return 'Temperature (°C)';
        case 'respiratory':
            return 'Respiratory Rate (BPM)';
        default:
            return metric;
    }
}

/**
 * Loads the user's health data table
 */
async function loadUserHealthDataTable() {
    const tableBody = document.getElementById('user-health-data-table');
    if (!tableBody) return;

    try {
        // In a real app, this would fetch the user's health data from the API
        // For demo, we'll use mock data

        const response = await API.getHealthData({ limit: 10 });

        if (response.success) {
            let tableHtml = '';

            response.data.forEach(item => {
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();

                tableHtml += `
                    <tr>
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
                    </tr>
                `;
            });

            tableBody.innerHTML = tableHtml;
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No data available</td></tr>';
        }
    } catch (error) {
        console.error('Error loading health data table:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading data</td></tr>';
    }
}

/**
 * Updates the health summary section
 */
function updateHealthSummary() {
    // In a real app, this would fetch the user's health summary from the API
    // For demo, we'll use mock data

    document.getElementById('avg-heart-rate').textContent = '72 BPM';
    document.getElementById('avg-oxygen').textContent = '98%';
    document.getElementById('avg-temp').textContent = '36.6°C';
    document.getElementById('abnormal-count').textContent = '3';
}

/**
 * Generates a health report for the selected user
 */
function generateHealthReport() {
    // In a real app, this would generate a health report
    // For demo, show a toast message

    Utils.showToast('Generating health report... This feature would create a detailed PDF report.', 'info');
}

/**
 * Exports the user's health data
 */
function exportUserHealthData() {
    // In a real app, this would export the user's health data
    // For demo, simulate a CSV export

    try {
        // Create a sample CSV content
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
        link.setAttribute('download', `user_${selectedUserId}_health_data.csv`);
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
 * Mock function to get user by ID
 * @param {number} userId - User ID
 * @returns {Object} User data or null if not found
 */
async function mockGetUserById(userId) {
    // This is a mock function that would be replaced by an API call in a real app
    const mockUsers = [
        {
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            role: 'Patient',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            created: '2025-01-15',
            lastLogin: '2025-05-09 10:15:02',
            lastIP: '192.168.1.101',
            phone: '+1 (555) 123-4567',
            address: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            country: 'US',
            medicalInfo: {
                bloodType: 'O+',
                allergies: 'Penicillin, Peanuts',
                conditions: 'Hypertension, Type 2 Diabetes',
                medications: 'Lisinopril 10mg, Metformin 500mg',
                emergencyContact: 'Jane Doe: +1 (555) 987-6543'
            },
            stats: {
                logins: 42,
                dataPoints: 1254,
                lastActivity: '5 minutes ago',
                activeSessions: 1
            }
        },
        {
            id: 2,
            name: 'Jane Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            role: 'Healthcare Professional',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            created: '2025-02-10',
            lastLogin: '2025-05-08 15:30:45',
            lastIP: '192.168.1.105',
            phone: '+1 (555) 234-5678',
            address: '456 Oak Ave',
            city: 'Metropolis',
            state: 'NY',
            country: 'US',
            stats: {
                logins: 68,
                dataPoints: 0,
                lastActivity: '1 day ago',
                activeSessions: 0
            }
        },
        {
            id: 3,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'Administrator',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            created: '2025-01-01',
            lastLogin: '2025-05-09 09:45:18',
            lastIP: '192.168.1.100',
            phone: '+1 (555) 987-6543',
            address: '789 System Ave',
            city: 'Techville',
            state: 'CA',
            country: 'US',
            stats: {
                logins: 124,
                dataPoints: 0,
                lastActivity: '2 hours ago',
                activeSessions: 1
            }
        }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find user by ID
    return mockUsers.find(user => user.id === userId) || null;
}

/**
 * Mock function to get users with pagination and filtering
 * @param {Object} options - Search and pagination options
 * @returns {Object} Response with users and pagination info
 */
async function mockGetUsers(options = {}) {
    // This is a mock function that would be replaced by an API call in a real app
    const { page = 1, limit = 10, role = 'all', search = '' } = options;

    // Mock data
    const mockUsers = [
        {
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            role: 'Patient',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-09 10:15:02'
        },
        {
            id: 2,
            name: 'Jane Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            role: 'Healthcare Professional',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-08 15:30:45'
        },
        {
            id: 3,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'Administrator',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-09 09:45:18'
        },
        {
            id: 4,
            name: 'Sarah Wilson',
            username: 'sarahwilson',
            email: 'sarah.wilson@example.com',
            role: 'Patient',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-09 09:58:32'
        },
        {
            id: 5,
            name: 'Dr. Williams',
            username: 'drwilliams',
            email: 'dr.williams@example.com',
            role: 'Healthcare Professional',
            status: 'active',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-09 09:30:05'
        },
        {
            id: 6,
            name: 'Robert Johnson',
            username: 'robjohnson',
            email: 'rob.johnson@example.com',
            role: 'Patient',
            status: 'suspended',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: '2025-05-01 14:22:10'
        },
        {
            id: 7,
            name: 'Emily Davis',
            username: 'emilydavis',
            email: 'emily.davis@example.com',
            role: 'Patient',
            status: 'pending',
            avatar: 'https://via.placeholder.com/150',
            lastLogin: 'Never'
        }
    ];

    // Apply role filter
    let filteredUsers = mockUsers;
    if (role !== 'all') {
        const roleMapping = {
            'admin': 'Administrator',
            'healthcare': 'Healthcare Professional',
            'patient': 'Patient'
        };

        filteredUsers = mockUsers.filter(user =>
            user.role === roleMapping[role]
        );
    }

    // Apply search filter
    if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(searchLower) ||
            user.username.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = filteredUsers.slice(start, end);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        success: true,
        users: paginatedUsers,
        pagination: {
            total,
            page,
            limit,
            pages
        }
    };
}

// Export functions for global access
window.viewUserDetails = viewUserDetails;
window.editUser = editUser;
window.confirmDeleteUser = confirmDeleteUser;
window.changePage = changePage;