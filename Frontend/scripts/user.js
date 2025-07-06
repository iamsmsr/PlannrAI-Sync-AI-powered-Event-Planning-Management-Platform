// User authentication and dashboard functionality

// Global variables for user management
let currentUser = null;
let authToken = null;

// Initialize user functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Initialize auth form listeners
    initializeAuthForms();
});

// Check if user is already authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        authToken = token;
        currentUser = JSON.parse(userData);
        // User is logged in, start on homepage and update navigation
        showHomePage();
        updateNavigation(true);
    } else {
        showHomePage();
        updateNavigation(false);
    }
}

// Initialize authentication form listeners
function initializeAuthForms() {
    // Sign up form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Sign in form submission
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignin);
    }
}

// Show authentication modal
function showAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    const signinForm = document.getElementById('signinFormContainer');
    const signupForm = document.getElementById('signupFormContainer');
    
    // Show appropriate form
    if (mode === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close authentication modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clear form data
    clearAuthForms();
}

// Clear authentication forms
function clearAuthForms() {
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');
    
    if (signupForm) signupForm.reset();
    if (signinForm) signinForm.reset();
    
    // Clear error messages
    clearErrorMessages();
}

// Switch between signin and signup forms
function switchAuthMode(mode) {
    const signinForm = document.getElementById('signinFormContainer');
    const signupForm = document.getElementById('signupFormContainer');
    
    clearErrorMessages();
    
    if (mode === 'signup') {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    } else {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    }
}

// Handle user signup
async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        phone: formData.get('phone')
    };
    
    // Validate form data
    if (!validateSignupData(userData)) {
        return;
    }
    
    // Show loading state
    setLoadingState('signup', true);
    
    try {
        // TODO: Replace with actual backend URL
        const response = await fetch('http://localhost:8080/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                phone: userData.phone
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Signup successful - show success message in green
            clearErrorMessages();
            showErrorMessage('signin', 'Account created successfully! Please sign in.');
            const errorDiv = document.getElementById('signinError');
            if (errorDiv) {
                errorDiv.style.color = '#059669';
                errorDiv.style.backgroundColor = '#d1fae5';
                errorDiv.style.borderColor = '#059669';
            }
            switchAuthMode('signin');
        } else {
            // Show error message
            showErrorMessage('signup', result.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showErrorMessage('signup', 'Network error. Please check your connection.');
    } finally {
        setLoadingState('signup', false);
    }
}

// Handle user signin
async function handleSignin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    // Validate form data
    if (!validateSigninData(loginData)) {
        return;
    }
    
    // Show loading state
    setLoadingState('signin', true);
    
    try {
        // TODO: Replace with actual backend URL
        const response = await fetch('http://localhost:8080/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Signin successful
            authToken = result.token;
            currentUser = result.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
            // Close modal and show dashboard directly - no popup
            closeAuthModal();
            showDashboard();
        } else {
            // Show error message
            showErrorMessage('signin', result.message || 'Invalid email or password.');
        }
    } catch (error) {
        console.error('Signin error:', error);
        showErrorMessage('signin', 'Network error. Please check your connection.');
    } finally {
        setLoadingState('signin', false);
    }
}

// Validate signup data
function validateSignupData(data) {
    clearErrorMessages();
    
    // Name validation
    if (!data.name || data.name.trim().length < 2) {
        showErrorMessage('signup', 'Name must be at least 2 characters long.');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showErrorMessage('signup', 'Please enter a valid email address.');
        return false;
    }
    
    // Password validation
    if (!data.password || data.password.length < 6) {
        showErrorMessage('signup', 'Password must be at least 6 characters long.');
        return false;
    }
    
    // Confirm password validation
    if (data.password !== data.confirmPassword) {
        showErrorMessage('signup', 'Passwords do not match.');
        return false;
    }
    
    // Phone validation (optional but if provided, should be valid)
    if (data.phone && data.phone.trim() !== '') {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(data.phone)) {
            showErrorMessage('signup', 'Please enter a valid phone number.');
            return false;
        }
    }
    
    return true;
}

// Validate signin data
function validateSigninData(data) {
    clearErrorMessages();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showErrorMessage('signin', 'Please enter a valid email address.');
        return false;
    }
    
    // Password validation
    if (!data.password || data.password.length === 0) {
        showErrorMessage('signin', 'Please enter your password.');
        return false;
    }
    
    return true;
}

// Show/hide loading state
function setLoadingState(form, isLoading) {
    const submitBtn = document.querySelector(`#${form}Form button[type="submit"]`);
    if (submitBtn) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Loading...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = form === 'signup' ? 'Sign Up' : 'Sign In';
        }
    }
}

// Show error message
function showErrorMessage(form, message) {
    const errorDiv = document.getElementById(`${form}Error`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Show success message without popup
function showSuccessMessage(message) {
    // Instead of alert, we'll just log it or show it in a non-intrusive way
    console.log('Success:', message);
    // You could implement a toast notification here instead
}

// Clear error messages
function clearErrorMessages() {
    const errorDivs = document.querySelectorAll('.error-message');
    errorDivs.forEach(div => {
        div.textContent = '';
        div.style.display = 'none';
    });
}

// Show homepage (default state)
function showHomePage() {
    // Show hero and awards sections
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.awards-section').style.display = 'block';
    
    // Hide other sections
    document.querySelector('.results-section').style.display = 'none';
    if (document.querySelector('.dashboard-section')) {
        document.querySelector('.dashboard-section').style.display = 'none';
    }
    
    // Don't automatically update navigation - let caller handle it
    // updateNavigation(false); // Removed this line
}

// Show dashboard
function showDashboard() {
    // Hide hero and awards sections
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.awards-section').style.display = 'none';
    document.querySelector('.results-section').style.display = 'none';
    
    // Show dashboard section
    const dashboardSection = document.querySelector('.dashboard-section');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        updateDashboardContent();
    }
    
    // Update navigation
    updateNavigation(true);
}

// Update dashboard content
function updateDashboardContent() {
    if (currentUser) {
        const welcomeMessage = document.querySelector('.dashboard-welcome');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${currentUser.name}!`;
        }
        
        const userEmail = document.querySelector('.dashboard-email');
        if (userEmail) {
            userEmail.textContent = currentUser.email;
        }
    }
}

// Update navigation based on auth status
function updateNavigation(isLoggedIn) {
    const loginBtn = document.querySelector('.nav-link[onclick="showAuthModal(\'signin\')"]');
    const signupBtn = document.querySelector('.signup-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const dashboardLink = document.querySelector('.dashboard-link');
    
    if (isLoggedIn) {
        // Hide login/signup buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        // Show logout button and dashboard link
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
    } else {
        // Show login/signup buttons
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        
        // Hide logout button and dashboard link
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

// Handle user logout
function logout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Reset global variables
    currentUser = null;
    authToken = null;
    
    // Show homepage and update navigation to logged-out state
    showHomePage();
    updateNavigation(false);
}

// Go back to search from dashboard
function goToSearchFromDashboard() {
    // Show homepage but maintain login state
    showHomePage();
    
    // If user is logged in, update navigation to reflect that
    if (currentUser && authToken) {
        updateNavigation(true);
    }
}

// Dashboard tab switching functionality
function switchDashboardTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.dashboard-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hide all sections
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('bookingsSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Show selected section and activate tab
    switch(tabName) {
        case 'overview':
            document.getElementById('overviewSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'overview\')"]').classList.add('active');
            break;
        case 'bookings':
            document.getElementById('bookingsSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'bookings\')"]').classList.add('active');
            loadUserBookings();
            break;
        case 'profile':
            document.getElementById('profileSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'profile\')"]').classList.add('active');
            break;
    }
}

// Load and display user bookings
function loadUserBookings() {
    console.log('=== loadUserBookings called ===');
    const bookingsContainer = document.querySelector('.bookings-container');
    const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    console.log('Bookings container:', bookingsContainer);
    console.log('User bookings from localStorage:', userBookings);
    console.log('User data from localStorage:', userData);
    
    if (userBookings.length === 0) {
        bookingsContainer.innerHTML = `
            <div class="no-bookings">
                <h3>No Bookings Yet</h3>
                <p>Your booking history will appear here when you make your first reservation.</p>
                <button class="search-venues-btn" onclick="goToSearchFromDashboard()">Search Venues</button>
            </div>
        `;
        return;
    }
    
    // Display user info and bookings
    bookingsContainer.innerHTML = `
        <div class="user-info">
            <h3>My Bookings</h3>
            <p><strong>User ID:</strong> ${userData ? userData.id : 'N/A'}</p>
            <p><strong>Name:</strong> ${userData ? userData.name : 'Guest'}</p>
            <p><strong>Email:</strong> ${userData ? userData.email : 'Not logged in'}</p>
        </div>
        <div class="bookings-list">
            ${userBookings.map(booking => createBookingCard(booking)).join('')}
        </div>
    `;
    
    // Start countdown timers for temp bookings
    startCountdownTimers();
}

// Create booking card HTML
function createBookingCard(booking) {
    const isTemp = booking.status === 'temp';
    const statusClass = isTemp ? 'temp-booking' : 'confirmed-booking';
    const statusText = isTemp ? 'Temporary Hold' : 'Confirmed Booking';
    
    // Format dates
    const datesList = booking.selectedDates.map(date => {
        const dateObj = new Date(date + 'T00:00:00');
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }).join(', ');
    
    // Calculate time remaining for temp bookings
    let timerHTML = '';
    if (isTemp && booking.tempExpiry) {
        const now = new Date().getTime();
        const expiry = new Date(booking.tempExpiry).getTime();
        const timeLeft = expiry - now;
        
        if (timeLeft > 0) {
            timerHTML = `
                <div class="countdown-timer" data-expiry="${booking.tempExpiry}">
                    <span class="timer-label">Time remaining:</span>
                    <span class="timer-display">--:--</span>
                </div>
            `;
        }
    }
    
    return `
        <div class="booking-card ${statusClass}">
            <div class="booking-image">
                <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" 
                     alt="${booking.venueName}" />
            </div>
            <div class="booking-details">
                <h4 class="venue-name">${booking.venueName}</h4>
                <p class="booking-user-id"><strong>Booking ID:</strong> ${booking.id}</p>
                <p class="booking-user-id"><strong>User ID:</strong> ${booking.userId}</p>
                <p class="booking-dates"><strong>Dates:</strong> ${datesList}</p>
                <p class="booking-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </p>
                ${timerHTML}
                <div class="booking-actions">
                    ${isTemp ? `<button class="confirm-booking-btn" onclick="confirmBooking('${booking.id}')" disabled>Confirm Booking</button>` : ''}
                    <button class="cancel-booking-btn" onclick="cancelBooking('${booking.id}')">Cancel Booking</button>
                </div>
            </div>
        </div>
    `;
}

// Start countdown timers for temporary bookings
function startCountdownTimers() {
    const timers = document.querySelectorAll('.countdown-timer');
    
    timers.forEach(timer => {
        const expiry = new Date(timer.dataset.expiry).getTime();
        const display = timer.querySelector('.timer-display');
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const timeLeft = expiry - now;
            
            if (timeLeft <= 0) {
                display.textContent = 'EXPIRED';
                timer.style.color = '#dc2626';
                // Auto-remove expired booking
                setTimeout(() => {
                    const bookingCard = timer.closest('.booking-card');
                    if (bookingCard) {
                        removeExpiredBooking(timer.dataset.expiry);
                    }
                }, 1000);
                return;
            }
            
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    });
}

// Cancel booking and clear from localStorage
function cancelBooking(bookingId) {
    const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
    const updatedBookings = userBookings.filter(booking => booking.id !== bookingId);
    
    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    
    // Show success message
    showToast('Booking cancelled successfully', 'success');
    
    // Refresh the bookings display
    loadUserBookings();
}

// Remove expired booking
function removeExpiredBooking(expiry) {
    const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
    const updatedBookings = userBookings.filter(booking => booking.tempExpiry !== expiry);
    
    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    
    // Show expiry message
    showToast('Temporary booking expired', 'warning');
    
    // Refresh the bookings display
    loadUserBookings();
}

// Confirm booking (placeholder for now)
function confirmBooking(bookingId) {
    showToast('Booking confirmation feature will be implemented later', 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#3b82f6'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Test function to create a sample booking for debugging
function createTestBooking() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        showToast('Please sign in first!', 'error');
        return;
    }
    
    const bookingId = 'booking_test_' + Date.now();
    const tempExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const testBooking = {
        id: bookingId,
        userId: userData.id,
        venueId: 'venue_test_1',
        venueName: 'Test Venue - Beautiful Garden Space',
        selectedDates: ['2025-07-10', '2025-07-11'],
        status: 'temp',
        bookingDate: new Date().toISOString(),
        tempExpiry: tempExpiry.toISOString()
    };
    
    // Save to localStorage
    const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
    userBookings.push(testBooking);
    localStorage.setItem('userBookings', JSON.stringify(userBookings));
    
    console.log('Test booking created:', testBooking);
    showToast('Test booking created! Check My Bookings tab.', 'success');
    
    // Switch to bookings tab
    switchDashboardTab('bookings');
}
