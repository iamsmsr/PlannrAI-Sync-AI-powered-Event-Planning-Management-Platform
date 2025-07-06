// Search functionality and related operations

// Global variable to store current search results
let currentSearchResults = [];

// Search venues function
function searchVenues(location, activity) {
    const url = `http://localhost:8080/api/venues/search?location=${location}&activity=${activity}`;
    
    console.log('Searching with URL:', url);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Venues found:', data);
            currentSearchResults = data; // Store results globally
            displaySearchResults(data, location, activity);
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorMessage('Failed to fetch venues. Please try again.');
        });
}

// Display search results
function displaySearchResults(venues, location, activity) {
    // Hide hero and awards sections
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.awards-section').style.display = 'none';
    
    // Show results section
    document.querySelector('.results-section').style.display = 'block';
    
    // Update search info
    document.querySelector('.search-info').textContent = 
        `Found ${venues.length} venues in ${location}${activity ? ` for ${activity}` : ''}`;
    
    // Clear previous results
    const resultsContainer = document.querySelector('.venues-container');
    resultsContainer.innerHTML = '';
    
    // Display venues
    if (venues.length === 0) {
        showNoResults();
    } else {
        venues.forEach(venue => {
            const venueCard = createVenueCard(venue);
            resultsContainer.appendChild(venueCard);
        });
    }
    
    // Preserve login state if user is logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
        // User is logged in, update navigation to show logged in state
        const loginBtn = document.querySelector('.nav-link[onclick="showAuthModal(\'signin\')"]');
        const signupBtn = document.querySelector('.signup-btn');
        const logoutBtn = document.querySelector('.logout-btn');
        const dashboardLink = document.querySelector('.dashboard-link');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
    }
}

// Create venue card element
function createVenueCard(venue) {
    const card = document.createElement('div');
    card.className = 'venue-card';
    
    card.innerHTML = `
        <div class="venue-image">
            <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" 
                 alt="${venue.venueName}" />
        </div>
        <div class="venue-info">
            <h3 class="venue-name">${venue.venueName}</h3>
            <p class="venue-address">${venue.address}</p>
            <p class="venue-location">${venue.location}</p>
            <div class="venue-rating">
                <span class="rating">⭐ ${venue.ratings}</span>
                <span class="reviews">(${venue.reviews ? venue.reviews.length : 0} reviews)</span>
            </div>
            <button class="view-dates-btn" onclick="viewDates('${venue.id}', '${venue.venueName}')">View Dates</button>
        </div>
    `;
    
    return card;
}

// Show no results message
function showNoResults() {
    const resultsContainer = document.querySelector('.venues-container');
    resultsContainer.innerHTML = `
        <div class="no-results">
            <h3>No venues found</h3>
            <p>Try searching in a different location or adjust your search criteria.</p>
        </div>
    `;
}

// Show error message
function showErrorMessage(message) {
    const resultsContainer = document.querySelector('.venues-container');
    resultsContainer.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Back to search function
function backToSearch() {
    // Show hero and awards sections
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.awards-section').style.display = 'block';
    
    // Hide results section
    document.querySelector('.results-section').style.display = 'none';
    
    // Preserve login state if user is logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
        // User is logged in, update navigation to show logged in state
        const loginBtn = document.querySelector('.nav-link[onclick="showAuthModal(\'signin\')"]');
        const signupBtn = document.querySelector('.signup-btn');
        const logoutBtn = document.querySelector('.logout-btn');
        const dashboardLink = document.querySelector('.dashboard-link');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
    }
}
