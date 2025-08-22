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

    // Hide map by default on new search
    const mapContainer = document.getElementById('sideMapContainer');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        if (window.sideMapInstance) {
            window.sideMapInstance.remove();
            window.sideMapInstance = null;
        }
    }

    // Display venues
    if (venues.length === 0) {
        showNoResults();
    } else {
        venues.forEach(venue => {
            const venueCard = createVenueCard(venue);
            resultsContainer.appendChild(venueCard);
        });
    }

    // Setup Show Map button
    const showMapBtn = document.getElementById('showMapBtn');
    if (showMapBtn) {
        showMapBtn.textContent = 'Show Map';
        showMapBtn.onclick = function() {
            const mapContainer = document.getElementById('sideMapContainer');
            if (!mapContainer) return;
            if (mapContainer.style.display === 'none') {
                mapContainer.style.display = 'block';
                showMapBtn.textContent = 'Hide Map';
                // Initialize map if not already
                if (!window.sideMapInstance) {
                    setTimeout(() => {
                        window.sideMapInstance = L.map('sideMap').setView([23.780573, 90.414353], 12);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19,
                        }).addTo(window.sideMapInstance);
                        // Add venue markers (reuse logic from map.js)
                        venues.forEach(venue => {
                            let lat = null, lng = null;
                            if (venue.address && venue.address.includes('|')) {
                                const parts = venue.address.split('|');
                                if (parts[1]) {
                                    const coords = parts[1].split(',');
                                    if (coords.length === 2) {
                                        lat = parseFloat(coords[0]);
                                        lng = parseFloat(coords[1]);
                                    }
                                }
                            }
                            if (lat && lng) {
                                const popupHtml = `
                                    <div style="min-width:200px;max-width:250px;padding:10px 5px 5px 5px;">
                                        <div style="font-size:1.1rem;font-weight:bold;color:#059669;margin-bottom:4px;">${venue.venueName}</div>
                                        <div style="font-size:0.95rem;color:#333;margin-bottom:6px;">${venue.address ? venue.address.split('|')[0] : ''}</div>
                                        <div style="font-size:0.9rem;color:#666;margin-bottom:6px;">
                                            <span style='color:#f59e42;font-size:1.1em;'>★</span> ${venue.ratings ? venue.ratings : 'N/A'}
                                        </div>
                                        <button style='background:#059669;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-size:0.95rem;margin-top:4px;' onclick='window.location.href="index.html?viewDates=${venue.id}&venueName=${encodeURIComponent(venue.venueName)}&autoBook=true"'>View Dates</button>
                                    </div>
                                `;
                                L.marker([lat, lng]).addTo(window.sideMapInstance)
                                    .bindPopup(popupHtml);
                            }
                        });
                        // Show user location
                        window.sideMapInstance.locate({setView: false, maxZoom: 16});
                        window.sideMapInstance.on('locationfound', function(e) {
                            L.marker(e.latlng).addTo(window.sideMapInstance)
                                .bindPopup('You are here').openPopup();
                        });
                    }, 100);
                }
            } else {
                mapContainer.style.display = 'none';
                showMapBtn.textContent = 'Show Map';
                if (window.sideMapInstance) {
                    window.sideMapInstance.remove();
                    window.sideMapInstance = null;
                }
            }
        };
    }
    
    // Don't save state immediately when displaying results to avoid conflicts
    // Save current state with a delay to avoid interfering with calendar
    setTimeout(() => {
        if (typeof saveAppState === 'function') {
            saveAppState();
        }
    }, 500);
    
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
            <p class="venue-address">${venue.address ? venue.address.split('|')[0] : ''}</p>
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
