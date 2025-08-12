// Venue Map Logic for Peerspace

var map = L.map('map').setView([23.780573, 90.414353], 12); // Center on Dhaka

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Fetch all venues from backend
fetch('http://localhost:8080/api/venues/all')
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
                        <button style='background:#059669;color:#fff;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-size:0.95rem;margin-top:4px;' onclick='window.location.href="index.html?viewDates=${venue.id}&venueName=${encodeURIComponent(venue.venueName)}"'>View Dates</button>
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

// Optional: Show user's current location
map.locate({setView: false, maxZoom: 16});
map.on('locationfound', function(e) {
    L.marker(e.latlng).addTo(map)
        .bindPopup('You are here').openPopup();
});
