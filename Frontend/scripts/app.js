// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // Check for viewDates param in URL and trigger calendar modal if present
    const urlParams = new URLSearchParams(window.location.search);
    const viewDatesId = urlParams.get('viewDates');
    const venueNameParam = urlParams.get('venueName');
    
    if (viewDatesId && typeof viewDates === 'function') {
        // Fetch all venues and assign to the actual global variable
        const API_BASE = window.API_BASE || 'http://localhost:8080';
        fetch(`${API_BASE}/api/venues/all`)
            .then(response => response.json())
            .then(venues => {
                currentSearchResults = venues;
                // Wait for DOM and scripts to be ready, then call viewDates
                setTimeout(() => {
                    viewDates(viewDatesId, venueNameParam || '');
                }, 200);
            });
    }
});

// Also try immediate restoration for faster response
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(restoreAppState, 50); // Faster restoration
    });
} else {
    // Document already loaded, restore immediately
    setTimeout(restoreAppState, 50); // Faster restoration
}

// Try restoration multiple times to be sure it works
setTimeout(restoreAppState, 100);
setTimeout(restoreAppState, 300);
setTimeout(restoreAppState, 1000);

// Initialize the application
function initializeApp() {
    setupActivityButtons();
    setupSearchButton();
    setupChatButton(); // Add chat button setup
    
    // Initially hide results section
    document.querySelector('.results-section').style.display = 'none';
    
    // Check if user is admin and redirect if needed
    checkAndRedirectAdmin();
    
    // Initialize state management
    initializeStateManagement();
    
    // Remove loading class and show content smoothly
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    }, 100);
}

// State Management Functions
function initializeStateManagement() {
    // Restore saved state after user authentication check with longer delay
    setTimeout(() => {
        console.log('Attempting state restoration...');
        restoreAppState();
    }, 500); // Increased delay to 500ms to ensure all scripts are loaded
    
    // Set up periodic state saving (every 30 seconds) to ensure state is always current
    setInterval(() => {
        const authToken = localStorage.getItem('authToken');
        if (authToken && typeof saveAppState === 'function') {
            saveAppState();
        }
    }, 30000); // Save state every 30 seconds
}

// Save current application state - enhanced to capture ALL app states
function saveAppState() {
    const authToken = localStorage.getItem('authToken');
    
    // Only save state if user is authenticated
    if (!authToken) {
        console.log('No auth token - not saving state');
        return;
    }
    
    const state = {
        currentView: getCurrentView(),
        dashboardTab: getCurrentDashboardTab(),
        selectedChatId: window.selectedChatId || null,
        isLoggedIn: !!authToken,
        userEmail: localStorage.getItem('userEmail') || null,
        timestamp: Date.now(),
        // Additional state for search results
        searchQuery: getSearchState(),
        // Additional state for admin
        adminSection: getAdminState()
    };
    
    console.log('Saving state:', state); // Debug log
    localStorage.setItem('appState', JSON.stringify(state));
}

// Check if user is admin and redirect
async function checkAndRedirectAdmin() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        // Check cached user info first
        const cachedUserInfo = localStorage.getItem('currentUserInfo');
        if (cachedUserInfo) {
            try {
                const currentUser = JSON.parse(cachedUserInfo);
                const isAdmin = currentUser.isAdmin === true || 
                               (currentUser.roles && currentUser.roles.includes('ADMIN'));
                
                if (isAdmin) {
                    console.log('🔧 Admin user detected on index.html, redirecting to admin.html');
                    window.location.href = 'admin.html';
                    return;
                }
            } catch (e) {
                console.log('Failed to parse cached user info');
            }
        }
        
        // If no cached info, fetch user details
        const payload = JSON.parse(atob(token.split('.')[1]));
        const API_BASE = window.API_BASE || 'http://localhost:8080';
        const response = await fetch(`${API_BASE}/api/auth/users/search?query=${encodeURIComponent(payload.sub)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            const currentUser = users.find(u => u.email === payload.sub);
            
            if (currentUser) {
                // Cache user info
                localStorage.setItem('currentUserInfo', JSON.stringify(currentUser));
                
                const isAdmin = currentUser.isAdmin === true || 
                               (currentUser.roles && currentUser.roles.includes('ADMIN'));
                
                if (isAdmin) {
                    console.log('🔧 Admin user detected on index.html, redirecting to admin.html');
                    window.location.href = 'admin.html';
                    return;
                }
            }
        }
    } catch (error) {
        console.log('Error checking admin status:', error);
    }
}

// Get search state
function getSearchState() {
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection && resultsSection.style.display === 'block') {
        const searchInfo = document.querySelector('.search-info');
        return searchInfo ? searchInfo.textContent : null;
    }
    return null;
}

// Get admin state
function getAdminState() {
    if (window.location.pathname.includes('admin')) {
        return {
            path: window.location.pathname,
            hash: window.location.hash
        };
    }
    return null;
}

// Get current view - handles ALL sections of the application
function getCurrentView() {
    // Check for admin section (admin.html or admin view)
    if (window.location.pathname.includes('admin') || document.title.includes('Admin')) {
        console.log('Current view: admin');
        return 'admin';
    }
    
    // Check for dashboard section - improved detection
    const dashboardSection = document.querySelector('.dashboard-section');
    if (dashboardSection) {
        const computedStyle = window.getComputedStyle(dashboardSection);
        const isVisible = computedStyle.display !== 'none' && dashboardSection.style.display !== 'none';
        
        console.log('Dashboard section found, display style:', dashboardSection.style.display);
        console.log('Dashboard section computed display:', computedStyle.display);
        console.log('Dashboard section is visible:', isVisible);
        
        if (isVisible) {
            console.log('Current view: dashboard');
            return 'dashboard';
        }
    }
    
    // Check for search results section
    const resultsSection = document.querySelector('.results-section');
    if (resultsSection) {
        const computedStyle = window.getComputedStyle(resultsSection);
        const isVisible = computedStyle.display !== 'none' && resultsSection.style.display !== 'none';
        if (isVisible) {
            console.log('Current view: results');
            return 'results';
        }
    }
    
    // Check for calendar modal
    const calendarModal = document.getElementById('calendarModal');
    if (calendarModal) {
        const computedStyle = window.getComputedStyle(calendarModal);
        const isVisible = computedStyle.display !== 'none' && calendarModal.style.display !== 'none';
        if (isVisible) {
            console.log('Current view: calendar');
            return 'calendar';
        }
    }
    
    // Check for auth modal
    const authModal = document.getElementById('authModal');
    if (authModal) {
        const computedStyle = window.getComputedStyle(authModal);
        const isVisible = computedStyle.display !== 'none' && authModal.style.display !== 'none';
        if (isVisible) {
            console.log('Current view: auth');
            return 'auth';
        }
    }
    
    // Check if user is logged in but no specific view is detected
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        // If logged in but no specific view detected, assume dashboard
        console.log('Current view: dashboard (logged in, defaulting)');
        return 'dashboard';
    }
    
    // Default to home view
    console.log('Current view: home');
    return 'home';
}

// Get current dashboard tab
function getCurrentDashboardTab() {
    // Check if chat button is active first
    const chatBtn = document.getElementById('dashboardChatBtn');
    if (chatBtn && chatBtn.classList.contains('active')) {
        return 'chat';
    }
    
    // Check for chat section visibility
    const chatSection = document.getElementById('chatSection');
    if (chatSection) {
        const computedStyle = window.getComputedStyle(chatSection);
        const isVisible = computedStyle.display !== 'none' && chatSection.style.display !== 'none';
        if (isVisible) {
            return 'chat';
        }
    }
    
    // Check other active buttons
    const activeBtn = document.querySelector('.dashboard-nav-btn.active');
    if (activeBtn) {
        const onclick = activeBtn.getAttribute('onclick');
        if (onclick && onclick.includes('switchDashboardTab')) {
            const match = onclick.match(/switchDashboardTab\('(\w+)'\)/);
            return match ? match[1] : 'overview';
        }
    }
    return 'overview';
}

// Restore application state
function restoreAppState() {
    console.log('=== RESTORING APP STATE ===');
    const savedState = localStorage.getItem('appState');
    const authToken = localStorage.getItem('authToken');
    
    console.log('Auth token exists:', !!authToken);
    console.log('Saved state exists:', !!savedState);
    
    // Only restore state if user is logged in
    if (!authToken || !savedState) {
        console.log('No restoration needed - not logged in or no saved state');
        // Show content smoothly even if no restoration
        setTimeout(() => {
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        }, 50);
        return;
    }
    
    try {
        const state = JSON.parse(savedState);
        console.log('Parsed state:', state);
        
        // Check if state is not too old (24 hours)
        if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
            console.log('State too old, removing...');
            localStorage.removeItem('appState');
            setTimeout(() => {
                document.body.classList.remove('loading');
                document.body.classList.add('loaded');
            }, 50);
            return;
        }
        
        // Add restoring class for smooth transition
        const dashboardSection = document.querySelector('.dashboard-section');
        if (dashboardSection) {
            dashboardSection.classList.add('restoring');
        }
        
        // Restore the appropriate view - enhanced to handle ALL sections
        switch (state.currentView) {
            case 'admin':
                console.log('Restoring admin view');
                if (state.adminSection && state.adminSection.path) {
                    // If we're not already on admin page, redirect
                    if (!window.location.pathname.includes('admin')) {
                        console.log('Redirecting to admin page...');
                        window.location.href = state.adminSection.path + (state.adminSection.hash || '');
                        return;
                    }
                }
                break;
                
            case 'dashboard':
                console.log('Restoring dashboard view, tab:', state.dashboardTab);
                if (typeof showDashboard === 'function') {
                    showDashboard();
                    if (state.dashboardTab) {
                        setTimeout(() => {
                            if (typeof switchDashboardTab === 'function') {
                                switchDashboardTab(state.dashboardTab);
                                console.log(`Restored to dashboard tab: ${state.dashboardTab}`);
                                
                                // If restoring chat tab, also restore selected chat
                                if (state.dashboardTab === 'chat' && state.selectedChatId && typeof selectChat === 'function') {
                                    setTimeout(() => {
                                        selectChat(state.selectedChatId);
                                    }, 100);
                                }
                            }
                        }, 50);
                    }
                }
                break;
                
            case 'chat':
                console.log('Restoring chat view (legacy), converting to dashboard tab');
                if (typeof showDashboard === 'function') {
                    showDashboard();
                    setTimeout(() => {
                        if (typeof switchDashboardTab === 'function') {
                            switchDashboardTab('chat');
                            console.log('Converted chat view to dashboard chat tab');
                            
                            // Restore selected chat if available
                            if (state.selectedChatId && typeof selectChat === 'function') {
                                setTimeout(() => {
                                    selectChat(state.selectedChatId);
                                }, 100);
                            }
                        }
                    }, 50);
                }
                break;
                
            case 'results':
                console.log('Restoring search results view');
                // For results view, stay on current page but could restore search if needed
                if (state.searchQuery && typeof showSearchResults === 'function') {
                    console.log('Could restore search:', state.searchQuery);
                    // Optionally restore search results here
                }
                break;
                
            case 'calendar':
                console.log('Restoring calendar view');
                // Calendar modal restoration would need specific calendar functions
                break;
                
            case 'auth':
                console.log('Restoring auth modal');
                // Auth modal restoration
                if (typeof showAuthModal === 'function') {
                    showAuthModal('signin');
                }
                break;
                
            default:
                console.log('Staying on home view or unknown view:', state.currentView);
                // Stay on current view if unknown
                break;
        }
        
        // Remove restoring class and show content smoothly
        setTimeout(() => {
            if (dashboardSection) {
                dashboardSection.classList.remove('restoring');
            }
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        }, 150);
        
    } catch (error) {
        console.error('Error restoring app state:', error);
        localStorage.removeItem('appState');
        // Show content even if restoration failed
        setTimeout(() => {
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        }, 50);
    }
}

// Make state management functions globally available
window.saveAppState = saveAppState;
window.restoreAppState = restoreAppState;

// Add manual trigger for testing
window.manualRestoreState = function() {
    console.log('Manual state restoration triggered');
    restoreAppState();
};

// Add debug function to check current view
window.debugCurrentView = function() {
    console.log('=== DEBUG CURRENT VIEW ===');
    const view = getCurrentView();
    console.log('Detected view:', view);
    
    const dashboardSection = document.querySelector('.dashboard-section');
    if (dashboardSection) {
        console.log('Dashboard section exists');
        console.log('Dashboard inline style display:', dashboardSection.style.display);
        console.log('Dashboard computed style display:', window.getComputedStyle(dashboardSection).display);
        console.log('Dashboard offsetParent:', dashboardSection.offsetParent);
    }
    
    console.log('Auth token:', !!localStorage.getItem('authToken'));
    return view;
};

// Also try restoring on window load event and add global state saving
window.addEventListener('load', function() {
    setTimeout(() => {
        console.log('Window load event - attempting state restoration...');
        restoreAppState();
    }, 200);
});

// Add global event listeners to save state on user interactions
document.addEventListener('click', function(event) {
    // Only save state for navigation-related clicks
    if (event.target.matches('.dashboard-nav-btn, .admin-menu-item, .nav-link') || 
        event.target.closest('.dashboard-nav-btn, .admin-menu-item, .nav-link')) {
        setTimeout(() => {
            if (typeof saveAppState === 'function') {
                saveAppState();
            }
        }, 300); // Give time for UI to update
    }
});

// Save state before page unload
window.addEventListener('beforeunload', function() {
    if (typeof saveAppState === 'function') {
        saveAppState();
        console.log('Saved state before page unload');
    }
});

// Setup activity button selection
function setupActivityButtons() {
    const activityBtns = document.querySelectorAll('.activity-btn');
    
    activityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            activityBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
}

// Setup search button functionality
function setupSearchButton() {
    document.querySelector('.search-button').addEventListener('click', function() {
        const selectedActivity = document.querySelector('.activity-btn.active')?.getAttribute('data-activity') || '';
        const location = document.querySelector('.location-input').value.trim();
        
        // Validate input
        if (!location) {
            // Instead of alert, focus on the input and show visual feedback
            const locationInput = document.querySelector('.location-input');
            locationInput.focus();
            locationInput.style.borderColor = '#dc2626';
            setTimeout(() => {
                locationInput.style.borderColor = '';
            }, 2000);
            return;
        }
        
        // Call search function from search.js
        searchVenues(location, selectedActivity);
    });
}

// Setup chat button functionality
function setupChatButton() {
    console.log('Setting up chat button...');
    const chatButton = document.getElementById('dashboardChatBtn');
    if (chatButton) {
        console.log('Chat button found, adding event listener');
        chatButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('=== CHAT BUTTON CLICKED ===');
            console.log('Event triggered, calling switchDashboardTab');
            
            if (typeof switchDashboardTab === 'function') {
                console.log('switchDashboardTab function found, calling it');
                switchDashboardTab('chat');
            } else {
                console.error('switchDashboardTab function not found!');
                // Fallback - directly show chat section
                console.log('Using fallback - directly showing chat section');
                document.getElementById('overviewSection').style.display = 'none';
                document.getElementById('bookingsSection').style.display = 'none';
                document.getElementById('profileSection').style.display = 'none';
                document.getElementById('chatSection').style.display = 'block';
                
                // Make button active
                document.querySelectorAll('.dashboard-nav-btn').forEach(btn => btn.classList.remove('active'));
                chatButton.classList.add('active');
                
                // Load chat list if available
                if (typeof loadChatList === 'function') {
                    loadChatList();
                }
            }
        });
    } else {
        console.error('Chat button not found!');
    }
}

// Utility functions
function showLoading() {
    // Can be implemented later for loading indicators
    console.log('Loading...');
}

function hideLoading() {
    // Can be implemented later for loading indicators
    console.log('Loading complete.');
}

// PlannrAI Assistant: open/close and visibility for non-registered users
function openPlannrAI() {
    const modal = document.getElementById('plannrai-assistant-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
}

function closePlannrAI() {
    const modal = document.getElementById('plannrai-assistant-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    try {
        localStorage.removeItem('plannrai_chat_history');
    } catch (e) {
        console.warn('Failed to remove plannrai_chat_history from localStorage', e);
    }
    // If the assistant is loaded inside an iframe (cross-origin), request it to clear its own storage.
    try {
        const iframe = document.getElementById('plannrai-iframe');
        if (iframe && iframe.contentWindow) {
            // Determine a safe targetOrigin from the iframe src if possible
            let targetOrigin = '*';
            try {
                const src = iframe.getAttribute('src');
                if (src) {
                    const url = new URL(src, window.location.href);
                    targetOrigin = url.origin;
                }
            } catch (err) {
                // fallback to wildcard
            }
            // Send a message the iframe can listen for and clear its own localStorage
            iframe.contentWindow.postMessage({ type: 'plannrai_clear_history' }, targetOrigin);
        }
    } catch (err) {
        console.warn('Failed to postMessage to plannrai iframe to clear history', err);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Wire up the floating button
    const btn = document.getElementById('plannrai-assistant-btn');
    const modal = document.getElementById('plannrai-assistant-modal');
    if (btn) {
        btn.addEventListener('click', function() {
            openPlannrAI();
            // example analytics placeholder
            try { if (window.dataLayer) window.dataLayer.push({ event: 'open_plannrai_assistant' }); } catch(e){}
        });
    }

    // Close when clicking backdrop or close control
    if (modal) {
        modal.querySelector('.plannrai-modal-backdrop')?.addEventListener('click', closePlannrAI);
        modal.querySelector('.plannrai-close')?.addEventListener('click', closePlannrAI);
    }

    // Only show assistant to non-logged-in users
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        // Hide button for logged-in users
        if (btn) btn.style.display = 'none';
    } else {
        // show for guests
        if (btn) {
            btn.style.display = 'flex';
            // Add pulse to draw attention
            btn.classList.add('pulse');
        }

        // Welcome message for first-time visitors only
        const welcomeShown = localStorage.getItem('plannrai_welcome_shown');
        // Add a listener to stop the pulse after first user interaction
        if (btn) {
            const stopPulse = () => { btn.classList.remove('pulse'); btn.removeEventListener('click', stopPulse); };
            btn.addEventListener('click', stopPulse);
        }
    }
});
