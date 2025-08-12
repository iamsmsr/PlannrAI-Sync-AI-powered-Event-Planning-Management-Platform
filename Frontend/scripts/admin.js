// Admin Dashboard JavaScript

// Configuration
const API_BASE_URL = 'http://localhost:8080'; // Update this when deploying

// Global variables
let currentAdminUser = null;

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard initializing...');
    checkAdminAccess();
    loadAdminUserInfo();
    loadDashboardStats();
    
    // Load pending bookings when dashboard loads
    loadPendingBookings();
    
    // Set up auto-refresh for pending bookings every 30 seconds
    setInterval(loadPendingBookings, 30000);
});

// Check if user has admin access
function checkAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!authToken || !userData) {
        console.log('No authentication found, redirecting to login...');
        redirectToLogin();
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        
        // Check if user has admin role
        if (!user.roles || !user.roles.includes('ADMIN')) {
            console.log('User does not have admin access, redirecting...');
            alert('Access denied. Admin privileges required.');
            redirectToUserDashboard();
            return;
        }
        
        currentAdminUser = user;
        console.log('Admin access verified for:', user.name);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        redirectToLogin();
    }
}

// Load admin user info into the interface
function loadAdminUserInfo() {
    if (!currentAdminUser) return;
    
    const userNameElement = document.querySelector('.admin-user-name');
    const userEmailElement = document.querySelector('.admin-user-email');
    
    if (userNameElement) userNameElement.textContent = currentAdminUser.name;
    if (userEmailElement) userEmailElement.textContent = currentAdminUser.email;
}

// Load dashboard statistics
function loadDashboardStats() {
    console.log('Loading dashboard stats...');
    
    // For now, show placeholder data
    // TODO: Replace with actual API calls when backend is ready
    updateStatCard('Total Users', '0');
    updateStatCard('Total Venues', '0');
    updateStatCard('Total Bookings', '0');
    updateStatCard('Active Users', '0');
}

// Update a stat card with new value
function updateStatCard(title, value) {
    const statCards = document.querySelectorAll('.admin-stat-card');
    
    statCards.forEach(card => {
        const titleElement = card.querySelector('h3');
        const valueElement = card.querySelector('.stat-number');
        
        if (titleElement && titleElement.textContent === title) {
            valueElement.textContent = value;
        }
    });
}

// Show specific admin section
function showAdminSection(sectionName) {
    console.log('Switching to admin section:', sectionName);
    
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById('admin' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1));
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Save app state when switching admin sections
        setTimeout(() => {
            if (typeof saveAppState === 'function') {
                saveAppState();
                console.log('Saved state for admin section:', sectionName);
            }
        }, 100);
    }
    
    // Add active class to clicked menu item
    if (event && event.target) {
        event.target.closest('.admin-menu-item').classList.add('active');
    }
    
    // Load section-specific data
    loadSectionData(sectionName);
}

// Load data for specific section
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            console.log('Loading users data...');
            // TODO: Load users data
            break;
        case 'venues':
            console.log('Loading venues data...');
            // TODO: Load venues data
            break;
        case 'bookings':
            console.log('Loading bookings data...');
            // TODO: Load bookings data
            break;
    }
}

// Test admin connection to backend
async function testAdminConnection() {
    const statusElement = document.getElementById('connectionStatus');
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        showConnectionStatus('No authentication token found', 'error');
        return;
    }
    
    try {
        console.log('Testing admin connection...');
        
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showConnectionStatus(`✅ ${data.message}`, 'success');
            console.log('Admin connection successful:', data);
        } else {
            const errorData = await response.json();
            showConnectionStatus(`❌ Connection failed: ${errorData.message || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Admin connection test failed:', error);
        showConnectionStatus(`❌ Connection failed: ${error.message}`, 'error');
    }
}

// Show connection status
function showConnectionStatus(message, type) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = message;
    statusElement.className = `connection-status ${type}`;
}

// Admin logout
function adminLogout() {
    console.log('Admin logging out...');
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Show logout message
    alert('Logged out successfully');
    
    // Redirect to main page
    redirectToLogin();
}

// Redirect functions
function redirectToLogin() {
    window.location.href = 'index.html';
}

function redirectToUserDashboard() {
    window.location.href = 'index.html#dashboard';
}

// Utility function to make authenticated API calls
async function makeAdminAPICall(endpoint, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        throw new Error('No authentication token');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            alert('Session expired or access denied. Please login again.');
            redirectToLogin();
            return;
        }
        throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
}

// Pending Bookings Management
async function loadPendingBookings() {
    try {
        console.log('Loading pending bookings...');
        
        const response = await fetch(`${API_BASE_URL}/api/admin/pending-bookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load pending bookings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pending bookings loaded:', data);
        
        displayPendingBookings(data.bookings || [], data.count || 0);
        updatePendingBookingsCount(data.count || 0);
        
    } catch (error) {
        console.error('Error loading pending bookings:', error);
        showToast('Failed to load pending bookings', 'error');
    }
}

function displayPendingBookings(bookings, count) {
    const container = document.querySelector('.pending-bookings-container');
    
    if (!container) {
        console.error('Pending bookings container not found');
        return;
    }
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="no-pending-bookings">
                <h3>No Pending Bookings</h3>
                <p>All bookings have been processed. New booking requests will appear here.</p>
            </div>
        `;
        return;
    }
    
    const bookingsHTML = bookings.map(booking => createPendingBookingCard(booking)).join('');
    
    container.innerHTML = `
        <div class="pending-bookings-header">
            <h3>Pending Booking Requests (${count})</h3>
            <button class="refresh-btn" onclick="loadPendingBookings()">
                <i class="refresh-icon">🔄</i> Refresh
            </button>
        </div>
        <div class="pending-bookings-list">
            ${bookingsHTML}
        </div>
    `;
}

function createPendingBookingCard(booking) {
    // Format dates
    const datesList = booking.selectedDates.map(date => {
        const dateObj = new Date(date + 'T00:00:00');
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }).join(', ');
    
    // Format booking date
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="pending-booking-card" data-booking-id="${booking.id}">
            <div class="booking-header">
                <h4 class="venue-name">${booking.venueName}</h4>
                <span class="booking-amount">$${booking.totalAmount}</span>
            </div>
            <div class="booking-details">
                <div class="booking-info">
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>User ID:</strong> ${booking.userId}</p>
                    <p><strong>Selected Dates:</strong> ${datesList}</p>
                    <p><strong>Requested:</strong> ${bookingDate}</p>
                </div>
                <div class="booking-actions">
                    <button class="approve-btn" onclick="approveBooking('${booking.id}')">
                        ✅ Approve
                    </button>
                    <button class="reject-btn" onclick="rejectBooking('${booking.id}')">
                        ❌ Reject
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function approveBooking(bookingId) {
    try {
        console.log('Approving booking:', bookingId);
        
        // Disable buttons to prevent double-clicking
        const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.classList.contains('approve-btn')) {
                btn.textContent = 'Approving...';
            }
        });
        
        const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to approve booking: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Booking approved successfully:', data);
        
        showToast('Booking approved successfully!', 'success');
        
        // Remove the booking card from the list
        card.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
            loadPendingBookings(); // Refresh the entire list
        }, 500);
        
    } catch (error) {
        console.error('Error approving booking:', error);
        showToast('Failed to approve booking. Please try again.', 'error');
        
        // Re-enable buttons
        const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = false;
            if (btn.classList.contains('approve-btn')) {
                btn.textContent = '✅ Approve';
            }
        });
    }
}

async function rejectBooking(bookingId) {
    try {
        // Ask for rejection reason
        const reason = prompt('Please enter a reason for rejection (optional):') || 'No reason provided';
        
        if (reason === null) return; // User cancelled
        
        console.log('Rejecting booking:', bookingId, 'Reason:', reason);
        
        // Disable buttons
        const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.classList.contains('reject-btn')) {
                btn.textContent = 'Rejecting...';
            }
        });
        
        const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ reason: reason })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to reject booking: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Booking rejected successfully:', data);
        
        showToast('Booking rejected successfully!', 'success');
        
        // Remove the booking card from the list
        card.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
            loadPendingBookings(); // Refresh the entire list
        }, 500);
        
    } catch (error) {
        console.error('Error rejecting booking:', error);
        showToast('Failed to reject booking. Please try again.', 'error');
        
        // Re-enable buttons
        const card = document.querySelector(`[data-booking-id="${bookingId}"]`);
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = false;
            if (btn.classList.contains('reject-btn')) {
                btn.textContent = '❌ Reject';
            }
        });
    }
}

function updatePendingBookingsCount(count) {
    // Update any count badges in the navigation or dashboard
    const countBadges = document.querySelectorAll('.pending-count-badge');
    countBadges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

// Show toast notification (same as user.js)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    let backgroundColor;
    switch(type) {
        case 'success':
            backgroundColor = '#059669';
            break;
        case 'error':
            backgroundColor = '#dc2626';
            break;
        case 'warning':
            backgroundColor = '#d97706';
            break;
        default:
            backgroundColor = '#3b82f6';
    }
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    checkAdminAccess();
});

// Prevent unauthorized access via direct URL
window.addEventListener('beforeunload', function(event) {
    // This runs when the page is about to be unloaded
    // Could add additional security checks here if needed
});

console.log('Admin dashboard script loaded successfully');
