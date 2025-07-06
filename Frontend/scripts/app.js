// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    setupActivityButtons();
    setupSearchButton();
    
    // Initially hide results section
    document.querySelector('.results-section').style.display = 'none';
}

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

// Utility functions
function showLoading() {
    // Can be implemented later for loading indicators
    console.log('Loading...');
}

function hideLoading() {
    // Can be implemented later for loading indicators
    console.log('Loading complete.');
}
