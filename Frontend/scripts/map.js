// Venue Map Logic for Peerspace

var map = L.map('map').setView([23.780573, 90.414353], 12); // Center on Dhaka

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Fetch all venues from backend
const API_BASE = window.API_BASE || 'http://localhost:8080';
fetch(`${API_BASE}/api/venues/all`)
    .then(response => response.json())
    .then(venues => {
        venues.forEach(venue => {
            // Extract coordinates from address (format: 'address|lat,lng')
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
                L.marker([lat, lng]).addTo(map)
                    .bindPopup(popupHtml);
            }
        });
    })
    .catch(err => {
        console.error('Failed to load venues:', err);
    });

// Check for URL parameters to handle direct venue booking from external links
const urlParams = new URLSearchParams(window.location.search);
const venueId = urlParams.get('venueId');
const venueName = urlParams.get('venueName');
const autoBook = urlParams.get('autoBook');

if (venueId && venueName && autoBook) {
    console.log('🔄 Map: Auto-booking requested for venue:', venueName);
    // Redirect to index.html with booking intent
    setTimeout(() => {
        window.location.href = `index.html?viewDates=${venueId}&venueName=${encodeURIComponent(venueName)}&autoBook=true`;
    }, 1000); // Small delay to let map load first
}

// Optional: Show user's current location
map.locate({setView: false, maxZoom: 16});
map.on('locationfound', function(e) {
    console.log(e.latlng)
    const { lat, lng } = e.latlng;
    L.marker(e.latlng).addTo(map)
        .bindPopup('You are here').openPopup();
});

// Check URL parameters for route visualization
const showRoute = urlParams.get('showRoute');
const fromCoords = urlParams.get('from');
const toCoords = urlParams.get('to');

async function fetchAndDrawRoute(from, to) {
    try {
        const [fromLng, fromLat] = from.split(',');
        const [toLng, toLat] = to.split(',');

        // Add markers for start and end points
        L.marker([fromLat, fromLng]).addTo(map).bindPopup('Start Location');
        L.marker([toLat, toLng]).addTo(map).bindPopup('Destination');

        // Fetch route from OSRM (use HTTPS)
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
            const route = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#059669', weight: 6, opacity: 0.7 }
            }).addTo(map);
            const bounds = route.getBounds();
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    } catch (error) {
        console.error('Error fetching route:', error);
    }
}

if (showRoute && toCoords) {
    // If 'from' is provided, use it. Otherwise try to obtain user's location via browser geolocation.
    if (fromCoords) {
        fetchAndDrawRoute(fromCoords, toCoords);
    } else {
        // Try to get the user's location via the map's locate feature
        map.once('locationfound', function(e) {
            const fcoords = `${e.latlng.lng},${e.latlng.lat}`;
            fetchAndDrawRoute(fcoords, toCoords);
            L.marker([e.latlng.lat, e.latlng.lng]).addTo(map).bindPopup('Start Location').openPopup();
        });

        map.once('locationerror', function(err) {
            console.warn('Could not determine user location for routing:', err);
            // As a fallback, just show the destination marker so user can manually navigate
            const parts = toCoords.split(',');
            const tlat = parts[1];
            const tlng = parts[0];
            L.marker([tlat, tlng]).addTo(map).bindPopup('Destination').openPopup();
        });

        // Trigger locate if not already started
        map.locate({ setView: false, maxZoom: 16 });
    }
}
