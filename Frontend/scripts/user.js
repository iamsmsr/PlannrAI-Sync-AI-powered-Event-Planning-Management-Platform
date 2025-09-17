        // Add Login using ID button below the toast/modal
        setTimeout(() => {
            // Only add if not already present
            if (!document.getElementById('loginByIdBtn')) {
                const modal = document.getElementById('corporateModal');
                const btn = document.createElement('button');
                btn.id = 'loginByIdBtn';
                btn.textContent = 'Login using ID';
                btn.className = 'auth-submit-btn';
                btn.style.marginTop = '20px';
                btn.onclick = showBusinessIdLoginModal;
                modal.querySelector('.auth-modal-content')?.appendChild(btn);
            }
        }, 1000);
// Show modal for business ID login
function showBusinessIdLoginModal() {
    const modal = document.getElementById('corporateModal');
    if (!modal) return;
    // Clear modal content and show only ID input
    const content = modal.querySelector('.auth-modal-content');
    if (!content) return;
    content.innerHTML = `
        <div class="auth-modal-header">
            <h2 class="auth-modal-title">Business Login</h2>
            <button class="auth-close-btn" onclick="closeCorporateModal()">×</button>
        </div>
        <div class="auth-form-container">
            <form id="businessIdLoginForm" class="auth-form">
                <div class="form-group">
                    <label class="form-label" for="businessIdInput">Business ID</label>
                    <input type="text" id="businessIdInput" name="businessId" class="form-input" placeholder="Enter your business ID" required />
                </div>
                <button type="submit" class="auth-submit-btn">Login</button>
            </form>
            <div id="businessIdLoginError" class="error-message" style="display:none;"></div>
        </div>
    `;
    document.body.style.overflow = 'hidden';
    modal.style.display = 'flex';
    // Attach submit handler
    document.getElementById('businessIdLoginForm').onsubmit = handleBusinessIdLogin;
}

// Handle business ID login
async function handleBusinessIdLogin(e) {
    e.preventDefault();
    const id = document.getElementById('businessIdInput').value.trim();
    const errorDiv = document.getElementById('businessIdLoginError');
    errorDiv.style.display = 'none';
    if (!id) {
        errorDiv.textContent = 'Please enter your business ID.';
        errorDiv.style.display = 'block';
        return;
    }
        try {
        const API_BASE = window.API_BASE || 'http://localhost:8080';
            const res = await fetch(`${API_BASE}/api/business/${id}`);
        if (!res.ok) {
            errorDiv.textContent = 'Business not found or not approved yet.';
            errorDiv.style.display = 'block';
            return;
        }
        const business = await res.json();
        // Store business info in localStorage for business.html
        console.log("here")
        localStorage.setItem('businessInfo', JSON.stringify(business));
        window.location.href = 'business.html';
    } catch (err) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}
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
    
        // Corporate form submission
        const corporateForm = document.getElementById('corporateForm');
        if (corporateForm) {
            corporateForm.addEventListener('submit', handleCorporateSubmit);
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

// Show corporate modal
function showCorporateModal() {
    const modal = document.getElementById('corporateModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

        // No need to attach event listener here; it's done on DOMContentLoaded
}

// Close corporate modal
function closeCorporateModal() {
    const modal = document.getElementById('corporateModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form and clear errors
    const corporateForm = document.getElementById('corporateForm');
    if (corporateForm) {
        corporateForm.reset();
    }
    clearErrorMessages();
}

// Handle corporate form submission
async function handleCorporateSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const corporateData = {
        companyName: formData.get('companyName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role')
    };
    
 
        console.log('Corporate data:2', corporateData);

    // Add initial rating of 0
    corporateData.rating = 0.0;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
            console.log('Corporate data: 3', corporateData);        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }
    
    try {
        // Add Authorization header if authToken is available
        const headers = {
            'Content-Type': 'application/json',
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
    const response = await fetch(`${API_BASE}/api/business/inquiry`, {
            method: 'POST',
            headers,
            body: JSON.stringify(corporateData)
        });

        let result = {};
        // Only try to parse JSON if response has content
        const text = await response.text();
        if (text) {
            try {
                result = JSON.parse(text);
            } catch (jsonErr) {
                result = { message: 'Invalid server response' };
            }
        }

        if (response.ok) {
            // Show backend message in toast for 10 seconds, then close modal
            showToast(result.message || 'Thank you for your interest!', 'success', 10000);
            setTimeout(() => {
                closeCorporateModal();
            }, 10000);
        } else {
            showErrorMessage('corporate', result.message || 'Failed to submit inquiry. Please try again.');
        }
    } catch (error) {
        console.error('Corporate inquiry error:', error);
        showErrorMessage('corporate', 'Network error. Please check your connection.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit ';
        }
    }
}

// Validate corporate form data


// Handle user signup
async function handleSignup(event) {
    event.preventDefault();
    console.log("aaa")
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
    console.log("aa")
    
    // Show loading state
    setLoadingState('signup', true);
    
    try {
        // TODO: Replace with actual backend URL
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
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
    const response = await fetch(`${API_BASE}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse response JSON:', jsonError);
            result = { message: 'Invalid server response' };
        }
        
        if (response.ok) {
            // Signin successful
            authToken = result.token;
            currentUser = result.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
            // Close modal
            closeAuthModal();
            
            // Check for pending booking intent before redirecting
            checkAndRestoreBookingIntent();
            
            // Check if user is admin and redirect accordingly
            if (currentUser.isAdmin || (currentUser.roles && currentUser.roles.includes('ADMIN'))) {
                // Redirect to admin dashboard
                window.location.href = 'admin.html';
            } else {
                // Show user dashboard
                showDashboard();
            }
        } else {
            // Show error message with better handling
            let errorMessage = 'Invalid email or password.';
            
            if (result && result.message) {
                errorMessage = result.message;
            } else if (result && result.error) {
                errorMessage = result.error;
            } else if (response.status === 400) {
                errorMessage = 'Invalid email or password.';
            } else if (response.status === 401) {
                errorMessage = 'Invalid credentials. Please check your email and password.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            console.error('Signin failed:', response.status, result);
            
            // Use setTimeout to ensure DOM is ready and error message shows
            setTimeout(() => {
                console.log(`🚨 Attempting to show error message: "${errorMessage}"`);
                
                // First, try the regular showErrorMessage function
                try {
                    showErrorMessage('signin', errorMessage);
                } catch (error) {
                    console.error('🚨 Error in showErrorMessage:', error);
                }
                
                // Backup method: directly manipulate the error div
                try {
                    const errorDiv = document.getElementById('signinError');
                    console.log('🚨 Direct error div access:', !!errorDiv);
                    if (errorDiv) {
                        errorDiv.innerHTML = `<strong>Error:</strong> ${errorMessage}`;
                        errorDiv.style.cssText = 'display: block !important; background: #fee; border: 1px solid #f00; color: #c00; padding: 10px; margin: 10px 0; border-radius: 4px;';
                        console.log('🚨 Direct method applied');
                    }
                } catch (error) {
                    console.error('🚨 Error in direct method:', error);
                }
                
                // Ultimate fallback: create a new error element
                try {
                    const formContainer = document.getElementById('signinFormContainer');
                    if (formContainer && !document.querySelector('.dynamic-error')) {
                        const newErrorDiv = document.createElement('div');
                        newErrorDiv.className = 'dynamic-error';
                        newErrorDiv.innerHTML = `<strong>⚠️ Error:</strong> ${errorMessage}`;
                        newErrorDiv.style.cssText = 'display: block !important; background: #ffebee !important; border: 2px solid #f44336 !important; color: #d32f2f !important; padding: 15px !important; margin: 10px 0 !important; border-radius: 8px !important; font-weight: bold !important; font-size: 14px !important;';
                        formContainer.insertBefore(newErrorDiv, formContainer.firstChild);
                        console.log('🚨 Ultimate fallback error created');
                    }
                } catch (error) {
                    console.error('🚨 Error in ultimate fallback:', error);
                    // Last resort: alert
                    alert(`Login Error: ${errorMessage}`);
                }
                
                // Double-check that the modal is visible
                const authModal = document.getElementById('authModal');
                const signinContainer = document.getElementById('signinFormContainer');
                console.log(`🚨 Auth modal display:`, authModal ? authModal.style.display : 'not found');
                console.log(`🚨 Signin container display:`, signinContainer ? signinContainer.style.display : 'not found');
            }, 100);
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
    console.log(`🚨 Showing error for ${form}:`, message);
    let errorDiv = document.getElementById(`${form}Error`);
    console.log(`🚨 Error div found:`, !!errorDiv);
    console.log(`🚨 Error div element:`, errorDiv);
    
    // If error div doesn't exist, create it
    if (!errorDiv) {
        console.log(`🚨 Creating new error div for ${form}`);
        errorDiv = document.createElement('div');
        errorDiv.id = `${form}Error`;
        errorDiv.className = 'error-message';
        
        // Find the form container and insert the error div at the top
        const formContainer = document.getElementById(`${form}FormContainer`);
        if (formContainer) {
            formContainer.insertBefore(errorDiv, formContainer.firstChild);
        } else {
            console.error(`🚨 Form container not found for ${form}`);
            // Fallback: show error in alert
            alert(`Error: ${message}`);
            return;
        }
    }
    
    // Clear any existing content first
    errorDiv.innerHTML = '';
    
    // Set the error message
    errorDiv.textContent = message;
    
    // Force visibility with important styles - use a more direct approach
    errorDiv.style.cssText = `
        display: block !important;
        background-color: #fef2f2 !important;
        border: 1px solid #fecaca !important;
        color: #dc2626 !important;
        padding: 12px !important;
        border-radius: 6px !important;
        margin-bottom: 16px !important;
        font-size: 14px !important;
        opacity: 1 !important;
        visibility: visible !important;
        position: relative !important;
        z-index: 9999 !important;
        width: 100% !important;
        box-sizing: border-box !important;
    `;
    
    console.log(`🚨 Error message set and displayed`);
    
    // Check computed styles
    const computedStyle = window.getComputedStyle(errorDiv);
    console.log(`🚨 Computed display:`, computedStyle.display);
    console.log(`🚨 Computed visibility:`, computedStyle.visibility);
    console.log(`🚨 Error div content:`, errorDiv.textContent);
    console.log(`🚨 Error div offsetHeight:`, errorDiv.offsetHeight);
    console.log(`🚨 Error div offsetWidth:`, errorDiv.offsetWidth);
    
    // Also try to scroll the error into view
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.style.display === 'block') {
            console.log(`🚨 Auto-hiding error message for ${form}`);
            errorDiv.style.display = 'none';
        }
    }, 5000);
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
    
    // Save current state
    if (typeof saveAppState === 'function') {
        saveAppState();
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
    // By default show public navbar when rendering the dashboard (per request)
    // This will make the navbar appear like the logged-out view even while on the dashboard.
    try {
        updateNavigation(false);
    } catch (e) {
        // Fallback to logged-in navigation if updateNavigation fails
        updateNavigation(true);
    }
    
    // Save current state
    setTimeout(() => {
        if (typeof saveAppState === 'function') {
            saveAppState();
        }
    }, 100);
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
    const realtimeChatLink = document.querySelector('.realtime-chat-link');
    
    if (isLoggedIn) {
        // Hide login/signup buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        // Show logout button, dashboard link, and real-time chat link
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (realtimeChatLink) realtimeChatLink.style.display = 'inline-block';
    } else {
        // Show login/signup buttons
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        
        // Hide logout button, dashboard link, and real-time chat link
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (realtimeChatLink) realtimeChatLink.style.display = 'none';
    }
}

// Handle user logout
function logout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('appState'); // Clear saved state
    
    // Reset global variables
    currentUser = null;
    authToken = null;
    
    // Stop auto-refresh
    stopBookingAutoRefresh();
    
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
    console.log('=== switchDashboardTab called with:', tabName, '===');
    
    // Hide all sections
    document.getElementById('overviewSection').style.display = 'none';
    document.getElementById('bookingsSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'none';
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.dashboard-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section and activate nav button
    switch (tabName) {
        case 'overview':
            document.getElementById('overviewSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'overview\')"]').classList.add('active');
            stopBookingAutoRefresh();
            break;
        case 'bookings':
            document.getElementById('bookingsSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'bookings\')"]').classList.add('active');
            loadUserBookings();
            startBookingAutoRefresh();
            
            // Force save state immediately for bookings
            setTimeout(() => {
                if (typeof saveAppState === 'function') {
                    saveAppState();
                    console.log('Forced state save for bookings tab');
                }
            }, 100);
            break;
        case 'profile':
            document.getElementById('profileSection').style.display = 'block';
            document.querySelector('[onclick="switchDashboardTab(\'profile\')"]').classList.add('active');
            stopBookingAutoRefresh();
            break;
        case 'chat':
            console.log('Switching to chat tab - showing chat section');
            document.getElementById('chatSection').style.display = 'block';
            document.getElementById('dashboardChatBtn').classList.add('active');
            stopBookingAutoRefresh();
            
            console.log('Chat section display set to block');
            
            // Initialize chat functionality if available
            if (typeof loadChatList === 'function') {
                console.log('Loading chat list...');
                loadChatList();
            } else {
                console.log('loadChatList function not available');
            }
            
            // Force save state immediately for chat
            setTimeout(() => {
                if (typeof saveAppState === 'function') {
                    saveAppState();
                    console.log('Forced state save for chat tab');
                }
            }, 100);
            break;
    }
    
    // Save current state
    if (typeof saveAppState === 'function') {
        saveAppState();
    }
}

// Make switchDashboardTab globally accessible
window.switchDashboardTab = switchDashboardTab;

// Auto-refresh functionality for bookings
let bookingRefreshInterval = null;

// Start auto-refresh for bookings (every 30 seconds)
function startBookingAutoRefresh() {
    // Clear any existing interval
    if (bookingRefreshInterval) {
        clearInterval(bookingRefreshInterval);
    }
    
    // Start new interval
    bookingRefreshInterval = setInterval(() => {
        // Only refresh if we're on the bookings tab
        const bookingsSection = document.getElementById('bookingsSection');
        if (bookingsSection && bookingsSection.style.display !== 'none') {
            console.log('Auto-refreshing bookings...');
            loadUserBookings();
        }
    }, 30000); // 30 seconds
}

// Stop auto-refresh
function stopBookingAutoRefresh() {
    if (bookingRefreshInterval) {
        clearInterval(bookingRefreshInterval);
        bookingRefreshInterval = null;
    }
}
function extractCoordinates(combinedString) {
  // Check if the input is a valid string and includes the separator
  if (typeof combinedString !== 'string' || !combinedString.includes('|')) {
    console.error("Invalid input: The string must contain '|' to be split.");
    return null;
  }

  // Use the split() method to break the string into an array at the '|' character.
  const parts = combinedString.split('|');

  // The first element of the array is the address, and the second is the coordinates.
  const address = parts[0].trim(); // .trim() removes any leading/trailing whitespace
  const coordinates = parts[1].trim();

  // Return an object with the separated values.
  return   coordinates
}

// Load and display user bookings (both temporary and confirmed)
async function loadUserBookings() {
    console.log('=== loadUserBookings called ===');
    const bookingsContainer = document.querySelector('.bookings-container');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!userData || !userData.id) {
        bookingsContainer.innerHTML = `
            <div class="no-bookings">
                <h3>Please Sign In</h3>
                <p>Sign in to view your booking history.</p>
                <button class="search-venues-btn" onclick="showAuthModal('signin')">Sign In</button>
            </div>
        `;
        return;
    }

    // Show loading state
    bookingsContainer.innerHTML = `
        <div class="loading-state">
            <h3>Loading your bookings...</h3>
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        // Get temporary bookings from localStorage
        const tempBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
        console.log('Temporary bookings from localStorage:', tempBookings);

        // Fetch confirmed bookings from backend (owned)
        let confirmedBookings = [];
        // Fetch bookings where user is a collaborator
        let collaboratorBookings = [];
        try {
            // Fetch bookings where user is owner
            const response = await fetch(`${API_BASE}/api/venues/bookings/user/${userData.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                confirmedBookings = await response.json();
                console.log('Confirmed bookings from backend:', confirmedBookings);
            } else {
                console.warn('Failed to fetch backend bookings, showing temp bookings only');
            }

            // Fetch bookings where user is a collaborator (by email)
            const collabRes = await fetch(`${API_BASE}/api/venues/bookings/collaborator/${encodeURIComponent(userData.email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (collabRes.ok) {
                collaboratorBookings = await collabRes.json();
                console.log('Collaborator bookings from backend:', collaboratorBookings);
            } else {
                console.warn('Failed to fetch collaborator bookings');
            }
        } catch (error) {
            console.warn('Backend request failed, showing temp bookings only:', error);
        }

        // Check if we have any bookings at all
        if (tempBookings.length === 0 && confirmedBookings.length === 0 && collaboratorBookings.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="no-bookings">
                    <h3>No Bookings Yet</h3>
                    <p>Your booking history will appear here when you make your first reservation.</p>
                    <button class="search-venues-btn" onclick="goToSearchFromDashboard()">Search Venues</button>
                </div>
            `;
            return;
        }

        // Helper to add Send Invite button to each card
        function addSendInviteBtn(cardHtml, booking) {
            return cardHtml.replace(
                /(<div class="booking-actions">[\s\S]*?<\/div>)/,
                `$1\n<button class="invite-btn" style="margin-top:8px;background:#059669;" onclick="showInviteModalForBooking('${booking.id}')">Send Invite<\/button>`
            );
        }

        // Helper to check if all selectedDates are in the past
        function isPastEvent(booking) {
            if (!booking.selectedDates || booking.selectedDates.length === 0) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return booking.selectedDates.every(date => {
                const eventDate = new Date(date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate < today;
            });
        }

        // Separate confirmed and collaborator bookings into upcoming and past
        const confirmedUpcoming = [], confirmedPast = [];
        let venues = new Map(); // Cache for venue details

        // Process confirmed bookings
        for (const booking of confirmedBookings) {
            if (!isPastEvent(booking)) {
                // Only fetch venue and weather for upcoming bookings
                if (!venues.has(booking.venueId)) {
                    const venue = await fetchVenueDetails(booking.venueId);
                    if (venue) {
                        // Get user's location
                        const userCoords = await new Promise((resolve) => {
                            navigator.geolocation.getCurrentPosition(
                                (position) => resolve(`${position.coords.longitude},${position.coords.latitude}`),
                                () => resolve(null)
                            );
                        });

                        // Compute venue coordinates from venue.address if available
                        if (venue.address && venue.address.includes('|')) {
                            try {
                                let venueCoords = extractCoordinates(venue.address); // expected 'lat,lng'
                                // Reverse to 'lng,lat' for OSRM consistency
                                venueCoords = venueCoords.split(',').reverse().join(',');
                                booking.venueCoords = venueCoords;
                            } catch (err) {
                                console.warn('Failed to parse venue coordinates for booking', booking.id, err);
                            }
                        }

                        // If we have user's coords as well, try fetching driving distance/duration
                        if (userCoords && booking.venueCoords) {
                            try {
                                console.log('Fetching route from', userCoords, 'to', booking.venueCoords);
                                const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${userCoords};${booking.venueCoords}?overview=false`);
                                const routeData = await routeResponse.json();

                                if (routeData.routes && routeData.routes[0]) {
                                    venue.distanceInfo = {
                                        distance: (routeData.routes[0].distance / 1000).toFixed(2), // Convert to km
                                        duration: Math.round(routeData.routes[0].duration / 60) // Convert to minutes
                                    };
                                    // Also add the distance info and coordinates to the booking
                                    booking.distanceInfo = venue.distanceInfo;
                                    booking.userCoords = userCoords;
                                }
                            } catch (error) {
                                console.error('Error fetching route information:', error);
                            }
                        }
                        venues.set(booking.venueId, venue);
                    }                
                }
                const venue = venues.get(booking.venueId);
                if (venue && venue.location) {
                    booking.weatherInfo = [];
                    try {
                        const weatherPromises = booking.selectedDates.map(date => 
                            fetchWeatherForEvent(venue.location, date)
                                .then(weather => {
                                    if (weather) {
                                        return { date, ...weather };
                                    }
                                    return null;
                                })
                                .catch(err => {
                                    console.warn(`Weather fetch failed for ${date}:`, err);
                                    return null;
                                })
                        );
                        
                        const weatherResults = await Promise.all(weatherPromises);
                        booking.weatherInfo = weatherResults.filter(w => w !== null);
                    } catch (weatherError) {
                        console.error('Error fetching weather for booking:', weatherError);
                        booking.weatherInfo = [];
                    }
                }
                confirmedUpcoming.push(booking);
            } else {
                confirmedPast.push(booking);
            }
        }

        const collabUpcoming = [], collabPast = [];
        // Process collaborator bookings
        for (const booking of collaboratorBookings) {
            if (!isPastEvent(booking)) {
                // Only fetch venue and weather for upcoming bookings
                if (!venues.has(booking.venueId)) {
                    const venue = await fetchVenueDetails(booking.venueId);
                    if (venue) venues.set(booking.venueId, venue);
                }
                const venue = venues.get(booking.venueId);
                if (venue) {
                    booking.weatherInfo = [];
                    for (const date of booking.selectedDates) {
                        const weather = await fetchWeatherForEvent(venue.location, date);
                        if (weather) booking.weatherInfo.push({ date, ...weather });
                    }
                }
                collabUpcoming.push(booking);
            } else {
                collabPast.push(booking);
            }
        }

        let bookingCardsHTML = '';
        // Add temporary bookings first (need to be confirmed)
        if (tempBookings.length > 0) {
            bookingCardsHTML += `
                <div class="temp-bookings-section">
                    <h4 class="section-title">⏰ Pending Confirmation<\/h4>
                    ${tempBookings.map(booking => addSendInviteBtn(createBookingCard(booking), booking)).join('')}
                <\/div>
            `;
        }
        // Add confirmed upcoming bookings (from backend, owned)
        if (confirmedUpcoming.length > 0) {
            bookingCardsHTML += `
                <div class="confirmed-bookings-section">
                    <h4 class="section-title">📋 Confirmed Bookings (Owner)<\/h4>
                    ${confirmedUpcoming.map(booking => addSendInviteBtn(createBookingStatusCard(booking), booking)).join('')}
                <\/div>
            `;
        }
        // Add collaborator upcoming bookings
        if (collabUpcoming.length > 0) {
            bookingCardsHTML += `
                <div class="collaborator-bookings-section">
                    <h4 class="section-title">🤝 Collaborator Bookings<\/h4>
                    ${collabUpcoming.map(booking => addSendInviteBtn(createBookingStatusCard(booking), booking)).join('')}
                <\/div>
            `;
        }
        // Add past events at the bottom
        if (confirmedPast.length > 0 || collabPast.length > 0) {
            bookingCardsHTML += `
                <div class="past-bookings-section">
                    <h4 class="section-title">🕓 Past Events<\/h4>
                    ${confirmedPast.map(booking => addSendInviteBtn(createBookingStatusCard(booking), booking)).join('')}
                    ${collabPast.map(booking => addSendInviteBtn(createBookingStatusCard(booking), booking)).join('')}
                <\/div>
            `;
        }

        // Display user info and all bookings
        bookingsContainer.innerHTML = `
            <div class="user-info">
                <h3>My Bookings</h3>
                <p><strong>User ID:</strong> ${userData.id}</p>
                <p><strong>Name:</strong> ${userData.name}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <div class="refresh-btn-container">
                    <button class="refresh-btn" onclick="refreshBookingsAndSaveState()">🔄 Refresh</button>
                </div>
            </div>
            <div class="bookings-list">
                ${bookingCardsHTML}
            </div>
            <div id="inviteModal" class="auth-modal" style="display:none;z-index:9999;">
                <div class="auth-modal-content" style="max-width:400px;">
                    <div class="auth-modal-header">
                        <h2 class="auth-modal-title">Send Wedding Invite</h2>
                        <button class="auth-close-btn" onclick="closeInviteModal()">×</button>
                    </div>
                    <div class="auth-form-container">
                        <div class="error-message" id="inviteError" style="display:none;"></div>
                        <form id="inviteForm" class="auth-form">
                            <div class="form-group">
                                <label class="form-label" for="inviteEmail">Recipient Email</label>
                                <input type="email" id="inviteEmail" name="inviteEmail" class="form-input" placeholder="Enter email" required />
                            </div>
                            <button type="submit" class="auth-submit-btn">Send Invite</button>
                        </form>
                        <div id="inviteSuccess" style="color:#059669;margin-top:10px;display:none;"></div>
                    </div>
                </div>
            </div>
        `;

        // Start countdown timers for temp bookings
        if (tempBookings.length > 0) {
            startCountdownTimers();
        }

        // Attach invite modal logic for each booking
        window.showInviteModalForBooking = function(bookingId) {
            document.getElementById('inviteModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.getElementById('inviteForm').setAttribute('data-booking-id', bookingId);
            document.getElementById('inviteError').style.display = 'none';
            document.getElementById('inviteSuccess').style.display = 'none';
            document.getElementById('inviteForm').reset();
        };
        window.closeInviteModal = function() {
            document.getElementById('inviteModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('inviteError').style.display = 'none';
            document.getElementById('inviteSuccess').style.display = 'none';
            document.getElementById('inviteForm').removeAttribute('data-booking-id');
            document.getElementById('inviteForm').reset();
        };
        const inviteForm = document.getElementById('inviteForm');
        if (inviteForm) {
            inviteForm.onsubmit = async function(e) {
                e.preventDefault();
                const email = document.getElementById('inviteEmail').value.trim();
                if (!email) return;
                document.getElementById('inviteError').style.display = 'none';
                document.getElementById('inviteSuccess').style.display = 'none';
                // Find the booking by id
                const bookingId = inviteForm.getAttribute('data-booking-id');
                let booking = null;
                const allBookings = [...tempBookings, ...confirmedBookings, ...(collaboratorBookings || [])];
                booking = allBookings.find(b => b.id === bookingId);
                if (!booking) {
                    document.getElementById('inviteError').textContent = 'No booking found to send invite.';
                    document.getElementById('inviteError').style.display = 'block';
                    return;
                }
                // Extract details
                const eventTitle = booking.venueName || 'Event';
                const eventDate = (booking.selectedDates && booking.selectedDates.length > 0) ? booking.selectedDates[0] : null;
                const eventLocation = booking.venueAddress || booking.venueLocation || 'Venue';
                // Get day, month, year, and day of week
                let eventDay = '', eventMonthYear = '', eventDayOfWeek = '';
                if (eventDate) {
                    const dateObj = new Date(eventDate);
                    eventDay = dateObj.getDate().toString();
                    const month = dateObj.toLocaleString('default', { month: 'long' }).toUpperCase();
                    const year = dateObj.getFullYear();
                    eventMonthYear = `${month} ${year}`;
                    eventDayOfWeek = dateObj.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
                }
                // Compose payload for templated.io
                const payload = {
                    "template": "58b64ef2-d0df-4687-bbed-0f4258f1a2e4",
                    "format": "jpg",
                    "layers": {
                        "main_heading": {
                            "text": "YOU'RE INVITED",
                            "color": "rgb(255, 255, 255)"
                        },
                        "event_title": {
                            "text": eventTitle,
                            "color": "rgb(212, 175, 55)"
                        },
                        "event_day": {
                            "text": eventDay,
                            "color": "rgb(255, 255, 255)"
                        },
                        "event_month_year": {
                            "text": eventMonthYear,
                            "color": "rgb(255, 255, 255)"
                        },
                        "event_time": {
                            "text": `${eventDayOfWeek || 'SATURDAY'} AT 7:00 PM`,
                            "color": "rgb(255, 255, 255)"
                        },
                      
                        "rsvp_text": {
                            "text": `RSVP by ${eventMonthYear || ''}<br>to ${email}`,
                            "color": "rgb(160, 174, 192)"
                        }
                    }
                };
                // Call templated.io API
                try {
                    const cardRes = await fetch('https://api.templated.io/v1/render', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer '
                        }
                    });
                    if (!cardRes.ok) throw new Error('Failed to generate invite card');
                    const cardData = await cardRes.json();
                    // Send email via EmailJS
                    try {
                        emailjs.send(
                                'service_',        // service ID
                                'template_',       // template ID
                                {
                                to_email: email,
                              //  from_name: userData.name,
                                event_title: eventTitle,
                                event_date: eventDate,
                                invite_image_url: cardData.url
                                },
                                ''        // ⚠️ must be your real PUBLIC KEY, not user_xxxx
                            )

                            .then((response) => {
                                console.log("✅ Email sent:", response.status, response.text);
                            })
                            .catch((error) => {
                                console.error("❌ Email failed:", error);
                            });
                            
                        document.getElementById('inviteSuccess').innerHTML = `Invite sent to ${email}!<br><img src="${cardData.url}" alt="Invite Card" style="max-width:100%;margin-top:10px;" />`;
                        document.getElementById('inviteSuccess').style.display = 'block';
                    } catch (emailErr) {
                        document.getElementById('inviteError').textContent = 'Failed to send email: ' + emailErr.message;
                        document.getElementById('inviteError').style.display = 'block';
                    }
                } catch (err) {
                    document.getElementById('inviteError').textContent = 'Failed to send invite: ' + err.message;
                    document.getElementById('inviteError').style.display = 'block';
                }
            };
        }

    } catch (error) {
        console.error('Error loading user bookings:', error);
        bookingsContainer.innerHTML = `
            <div class="error-state">
                <h3>Error Loading Bookings</h3>
                <p>Failed to load your bookings. Please try again.</p>
                <button class="retry-btn" onclick="loadUserBookings()">Try Again</button>
            </div>
        `;
    }
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
                    ${isTemp ? `<button class="confirm-booking-btn" onclick="confirmBooking('${booking.id}')">Confirm Booking</button>` : ''}
                    <button class="cancel-booking-btn" onclick="cancelBooking('${booking.id}')">Cancel Booking</button>
                </div>
            </div>
        </div>
    `;
}

// Create booking status card HTML for backend data
function isUpcomingBooking(selectedDates) {
    if (!selectedDates || selectedDates.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if any of the selected dates are in the future
    return selectedDates.some(date => {
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });
}

// API base URL - can be changed for different environments
const API_BASE_URL = (window.API_BASE || 'http://localhost:8080') + '/api';

// Rating and Review Functions
function showRatingModal(bookingId) {
    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.innerHTML = `
        <div class="rating-modal-content">
            <h2>Rate & Review</h2>
            <button class="close-btn" onclick="closeRatingModal()">×</button>
            
            <div class="rating-sections">
                <div class="rating-section">
                    <h3>Venue Rating</h3>
                    <div class="star-rating" data-type="venue">
                        ${generateStarRating('venue')}
                    </div>
                    <textarea id="venueReview" placeholder="Write your review about the venue..." rows="4"></textarea>
                </div>
                
                <div class="rating-section">
                    <h3>Service Providers</h3>
                    <div class="service-ratings">
                        <div class="service-rating">
                            <label>Vendor</label>
                            <div class="star-rating" data-type="vendor">
                                ${generateStarRating('vendor')}
                            </div>
                        </div>
                        <div class="service-rating">
                            <label>Cook</label>
                            <div class="star-rating" data-type="cook">
                                ${generateStarRating('cook')}
                            </div>
                        </div>
                        <div class="service-rating">
                            <label>Decorator</label>
                            <div class="star-rating" data-type="decorator">
                                ${generateStarRating('decorator')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button class="submit-rating-btn" onclick="submitRatings('${bookingId}')">Submit Ratings</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners for star ratings
    document.querySelectorAll('.star-rating').forEach(container => {
        container.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => handleStarClick(star));
            star.addEventListener('mouseover', () => handleStarHover(star));
            star.addEventListener('mouseout', () => handleStarOut(star));
        });
    });
}

function generateStarRating(type) {
    return Array(5).fill(0).map((_, i) => `
        <span class="star" data-rating="${i + 1}" data-type="${type}">★</span>
    `).join('');
}

function handleStarClick(star) {
    const container = star.closest('.star-rating');
    const rating = star.dataset.rating;
    container.dataset.value = rating;
    updateStars(container, rating);
}

function handleStarHover(star) {
    const container = star.closest('.star-rating');
    const rating = star.dataset.rating;
    updateStars(container, rating);
}

function handleStarOut(star) {
    const container = star.closest('.star-rating');
    const rating = container.dataset.value || 0;
    updateStars(container, rating);
}

function updateStars(container, rating) {
    container.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('active', s.dataset.rating <= rating);
    });
}

function closeRatingModal() {
    const modal = document.querySelector('.rating-modal');
    if (modal) modal.remove();
}

async function submitRatings(bookingId) {
    const venueRating = document.querySelector('[data-type="venue"]').dataset.value;
    const vendorRating = document.querySelector('[data-type="vendor"]').dataset.value;
    const cookRating = document.querySelector('[data-type="cook"]').dataset.value;
    const decoratorRating = document.querySelector('[data-type="decorator"]').dataset.value;
    const venueReview = document.getElementById('venueReview').value;

    console.log('Submitting ratings for booking:', bookingId);
    console.log('Ratings:', { venueRating, vendorRating, cookRating, decoratorRating });

    try {
        // Submit ratings for service providers
        const serviceRatings = [
            { type: 'vendor', rating: parseFloat(vendorRating || 0) },
            { type: 'cook', rating: parseFloat(cookRating || 0) },
            { type: 'decorator', rating: parseFloat(decoratorRating || 0) }
        ];

        // Update service provider ratings
        for (const service of serviceRatings) {
            if (service.rating > 0) {
                console.log(`Submitting ${service.type} rating:`, service.rating, 'for booking:', bookingId);
                const response = await fetch(`${API_BASE}/api/business/rating`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        bookingId,
                        serviceType: service.type,
                        rating: service.rating
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to submit ${service.type} rating:`, response.status, errorText);
                    throw new Error(`Failed to submit ${service.type} rating: ${response.status}`);
                }
                console.log(`${service.type} rating submitted successfully`);
            }
        }

        // Submit venue rating and review
        if (venueRating) {
            console.log('Submitting venue rating:', venueRating, 'for booking:', bookingId);
            const venueResponse = await fetch(`${API_BASE}/api/venues/rating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`

                },
                body: JSON.stringify({
                    bookingId,
                    rating: parseFloat(venueRating),
                    review: venueReview
                })
            });

            if (!venueResponse.ok) {
                const errorText = await venueResponse.text();
                console.error('Failed to submit venue rating:', venueResponse.status, errorText);
                throw new Error(`Failed to submit venue rating: ${venueResponse.status}`);
            }
        }

        showToast('Ratings submitted successfully!', 'success');
        closeRatingModal();
    } catch (error) {
        console.error('Error submitting ratings:', error);
        showToast('Failed to submit ratings. Please try again.', 'error');
    }
}

// Function to show route on map
function showRouteOnMap(userCoords, venueCoords) {
    // Open map.html with coordinates as parameters
    // If userCoords is not available, omit the 'from' parameter and let map.js try browser geolocation
    const url = userCoords ? `map.html?showRoute=true&from=${encodeURIComponent(userCoords)}&to=${encodeURIComponent(venueCoords)}` : `map.html?showRoute=true&to=${encodeURIComponent(venueCoords)}`;
    window.open(url, '_blank');
}

// Fetch weather for a city and date
async function fetchWeatherForEvent(city, date) {
    if (!city || !date) {
        console.error('City and date are required for weather fetch');
        return null;
    }

    if (!authToken) {
        console.error('No auth token available');
        return null;
    }

    // Check if date is in the future
    const eventDate = new Date(date);
    const today = new Date();
    
    // If date is more than 7 days in the future, return a placeholder
    if ((eventDate - today) > (7 * 24 * 60 * 60 * 1000)) {
        console.log(`Date ${date} is more than 7 days away. Returning forecast unavailable message.`);
        return {
            city: city,
            temperature: null,
            main: 'Forecast unavailable',
            message: 'Weather forecast only available for next 7 days'
        };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/prediction/weather/${encodeURIComponent(city)}/${encodeURIComponent(date)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log(`No weather data available for ${city} on ${date}`);
                return null;
            }
            throw new Error(`Weather fetch failed: ${response.statusText}`);
        }
        
        const weatherData = await response.json();
        console.log(`Weather data for ${city} on ${date}:`, weatherData);
        return weatherData;
    } catch (error) {
        console.error(`Error fetching weather for ${city} on ${date}:`, error);
        return null;
    }
}
async function userLocation() {
    map.on('locationfound', function(e) {
    // Get the coordinates from the event object
    const { lat, lng } = e.latlng;
    const accuracy = e.accuracy; // The accuracy of the location in meters

    console.log(`Latitude: ${lat}, Longitude: ${lng}`);
    console.log(`Accuracy: ${accuracy} meters`);
    return {lat, lng};
})};
// Fetch venue details including city
async function fetchVenueDetails(venueId) {
    if (!venueId) {
        console.error('Venue ID is required');
        return null;
    }

    if (!authToken) {
        console.error('No auth token available');
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/venues/${venueId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Venue not found with ID: ${venueId}`);
                return null;
            }
            throw new Error(`Venue fetch failed with status: ${response.status}`);
        }
        
        const venue = await response.json();
        console.log(`Fetched venue details for ID ${venueId}:`, venue);
        return venue;
    } catch (error) {
        console.error(`Error fetching venue ${venueId}:`, error);
        return null;
    }
}

function createBookingStatusCard(booking) {
    const statusInfo = getBookingStatusInfo(booking.status, booking.notes);
    const formattedDates = booking.selectedDates ? booking.selectedDates.join(', ') : 'No dates';
    const bookingDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Unknown';
    const isUpcoming = isUpcomingBooking(booking.selectedDates);

    // Add weather information if available
    let weatherHTML = '';
    if (isUpcoming && booking.weatherInfo) {
        weatherHTML = `
            <div class="weather-info" style="margin-top: 10px; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                <h5 style="margin: 0 0 8px 0; color: #374151;">🌤️ Weather Forecast</h5>
                ${booking.weatherInfo.map(info => {
                    const date = new Date(info.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const weather = info.weather || info.condition || 'N/A'; // Handle different weather property names
                    const temp = info.temperature ? `${info.temperature}°C` : 'N/A';
                    
                    return `
                    <div style="margin-bottom: 6px;">
                        <strong>${date}:</strong>
                        <span>${weather === 'N/A' ? '' : '☀️'} ${weather} ${temp}</span>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    return `
        <div class="booking-card booking-status-${booking.status.toLowerCase()}">
            <div class="booking-header">
                <h4 class="booking-venue">${booking.venueName || 'Unknown Venue'}</h4>
            </div>
            
            <div class="booking-details">
                <div class="booking-info">
                    <p><strong>Selected Dates:</strong> ${formattedDates}</p>
                    <p><strong>Booking Date:</strong> ${bookingDate}</p>
                    ${weatherHTML}
                    ${booking.venueCoords ? `
                        <div class="distance-info" style="margin-top: 10px; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                            <h5 style="margin: 0 0 8px 0; color: #374151;">🚗 Travel Information</h5>
                            ${booking.distanceInfo ? `<p style="margin: 4px 0;"><strong>Distance:</strong> ${booking.distanceInfo.distance} km</p>
                            <p style="margin: 4px 0;"><strong>Estimated time:</strong> ${booking.distanceInfo.duration} minutes</p>` : `<p style="margin:4px 0;color:#6b7280;">Distance not calculated. Click below to view route.</p>`}
                            <button onclick="showRouteOnMap('${booking.userCoords || ''}', '${booking.venueCoords}')" 
                                    style="background: #059669; color: white; border: none; border-radius: 4px; 
                                           padding: 6px 12px; margin-top: 8px; cursor: pointer; width: 100%;">
                                🗺️ Show Route
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="booking-status">
                    <div class="status-indicator ${statusInfo.class}">
                        <span class="status-icon">${statusInfo.icon}</span>
                        <span class="status-text">${statusInfo.text}</span>
                    </div>
                    
                    ${booking.status === 'ACTIVE' && isUpcoming ? `
                        <button class="collaborate-btn" onclick="window.location.href='collab.html?bookingId=${booking.id}'">
                            🤝 Collaborate
                        </button>
                    ` : ''}
                    
                    ${statusInfo.message ? `
                        <div class="status-message ${statusInfo.messageClass}">
                            ${statusInfo.message}
                        </div>
                    ` : ''}
                    
                    ${booking.approvedBy ? `
                        <div class="admin-info">
                            <p><strong>Processed by:</strong> ${booking.approvedBy}</p>
                            ${booking.approvedAt ? `<p><strong>Date:</strong> ${new Date(booking.approvedAt).toLocaleString()}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="booking-actions">
                ${booking.status === 'PENDING' ? `
                    <button class="action-btn secondary" onclick="loadUserBookings()">🔄 Check Status</button>
                ` : ''}
                ${booking.status === 'ACTIVE' ? `
                    <button class="action-btn success" disabled>✓ Confirmed</button>
                ` : ''}
                ${booking.status === 'REJECTED' ? `
                    <button class="action-btn danger" disabled>✗ Rejected</button>
                ` : ''}
                ${!isUpcomingBooking(booking.selectedDates) && booking.status === 'ACTIVE' ? `
                    <button class="action-btn primary" onclick="showRatingModal('${booking.id}')">⭐ Rate & Review</button>
                ` : ''}
            </div>
        </div>
    `;
}

// Get status information for display
function getBookingStatusInfo(status, notes) {
    switch (status) {
        case 'PENDING':
            return {
                class: 'status-pending',
                icon: '⏳',
                text: 'Pending Review',
                message: 'Your booking is under admin review. Please wait for approval.',
                messageClass: 'message-info'
            };
        case 'ACTIVE':
            return {
                class: 'status-approved',
                icon: '✅',
                text: 'Approved & Active',
                message: 'Your booking has been approved and is confirmed!',
                messageClass: 'message-success'
            };
        case 'REJECTED':
            return {
                class: 'status-rejected',
                icon: '❌',
                text: 'Rejected',
                message: notes ? `Reason: ${notes}` : 'Your booking was rejected by the admin.',
                messageClass: 'message-error'
            };
        default:
            return {
                class: 'status-unknown',
                icon: '❓',
                text: 'Unknown Status',
                message: 'Status unknown. Please contact support.',
                messageClass: 'message-warning'
            };
    }
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

// Confirm booking - send to backend and update status
async function confirmBooking(bookingId) {
    try {
        // Get the booking from localStorage
        const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
        const booking = userBookings.find(b => b.id === bookingId);
        
        if (!booking) {
            showToast('Booking not found', 'error');
            return;
        }
        
        // Check if user is authenticated
        if (!currentUser || !authToken) {
            showToast('Please sign in to confirm booking', 'error');
            return;
        }
        
        // Disable the confirm button to prevent double-clicking
        const confirmBtn = document.querySelector(`button[onclick="confirmBooking('${bookingId}')"]`);
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Confirming...';
        }
        
        // Prepare booking data for backend
        const bookingData = {
            userId: currentUser.id,
            venueId: booking.venueId,
            venueName: booking.venueName,
            selectedDates: booking.selectedDates,
            bookingDate: new Date().toISOString()
        };
        
        console.log('Sending booking data to backend:', bookingData);
        
        // Send to backend
    const response = await fetch(`${API_BASE}/api/venues/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(bookingData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Booking confirmed successfully:', result);
            
            // Remove the temporary booking from localStorage
            const updatedBookings = userBookings.filter(b => b.id !== bookingId);
            localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
            
            // Show success message
            showToast('Booking confirmed successfully! It is now pending admin approval.', 'success');
            
            // Refresh the bookings display
            loadUserBookings();
            
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Booking confirmation failed:', errorData);
            showToast(errorData.message || 'Failed to confirm booking. Please try again.', 'error');
            
            // Re-enable the button
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm Booking';
            }
        }
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        showToast('Network error. Please check your connection and try again.', 'error');
        
        // Re-enable the button
        const confirmBtn = document.querySelector(`button[onclick="confirmBooking('${bookingId}')"]`);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Booking';
        }
    }
}

// Show toast notification
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
    }, 4000); // Increased to 4 seconds for error messages
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

// Refresh bookings and save current state
function refreshBookingsAndSaveState() {
    loadUserBookings();
    // Save state to ensure we stay in bookings after any reload
    if (typeof saveAppState === 'function') {
        setTimeout(() => {
            saveAppState();
        }, 100);
    }
}

// Check and restore view intent after successful login (simplified)
function checkAndRestoreBookingIntent() {
    const pendingViewIntent = localStorage.getItem('pendingViewIntent');
    
    if (pendingViewIntent) {
        try {
            const viewIntent = JSON.parse(pendingViewIntent);
            console.log('🔄 Found pending view intent:', viewIntent);
            
            // Check if the intent is still valid (not too old)
            const intentAge = Date.now() - viewIntent.timestamp;
            const maxAge = 30 * 60 * 1000; // 30 minutes
            
            if (intentAge > maxAge) {
                console.log('🔄 View intent too old, clearing...');
                localStorage.removeItem('pendingViewIntent');
                return;
            }
            
            // Remove the pending intent
            localStorage.removeItem('pendingViewIntent');
            
            // Restore the view intent
            setTimeout(() => {
                restoreViewIntent(viewIntent);
            }, 500); // Small delay to ensure UI is ready
            
        } catch (error) {
            console.error('🔄 Error restoring view intent:', error);
            localStorage.removeItem('pendingViewIntent');
        }
    }
}

// Restore view intent - simply show the calendar for the venue
function restoreViewIntent(viewIntent) {
    console.log('🔄 Restoring view intent for venue:', viewIntent.venueName);
    
    // Show welcome back message
    showViewRestoredNotification(viewIntent.venueName);
    
    // Simply call viewDates again - now that user is logged in, it will work
    setTimeout(() => {
        if (typeof showCalendarForVenue === 'function') {
            showCalendarForVenue(viewIntent.venueId, viewIntent.venueName);
        } else if (typeof viewDates === 'function') {
            viewDates(viewIntent.venueId, viewIntent.venueName);
        }
    }, 1000); // Give time for notification to show
}

// Show notification that view was restored
function showViewRestoredNotification(venueName) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📅</span>
            <div>
                <div style="font-weight: bold;">Welcome Back!</div>
                <div style="font-size: 14px; opacity: 0.9;">Opening calendar for ${venueName}</div>
            </div>
        </div>
    `;
    
    // Add animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}