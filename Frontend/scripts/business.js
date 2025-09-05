const API_BASE = 'http://localhost:8080';

function renderBusinessInfo() {
    const infoDiv = document.getElementById('businessInfoContent');
    const business = JSON.parse(localStorage.getItem('businessInfo'));
    if (!business) {
        infoDiv.innerHTML = '<div class="error-message">No business info found. Please login again.</div>';
        return;
    }
    infoDiv.innerHTML = `
        <div class="info-row"><span class="info-label">ID:</span> <span class="info-value">${business.id}</span></div>
        <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">${business.email || '-'}</span></div>
        <div class="info-row"><span class="info-label">Company Name:</span> <span class="info-value">${business.companyName || '-'}</span></div>
        <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${business.phone || '-'}</span></div>
        <div class="info-row"><span class="info-label">Role:</span> <span class="info-value">${business.role || '-'}</span></div>
    `;
    renderBusinessServices(business.id);
    fetchBusinessEvents();
}

async function renderBusinessServices(businessId) {
    const servicesDiv = document.getElementById('businessServicesContent');
    servicesDiv.innerHTML = '<h3>Your Services</h3><div class="loading">Loading...</div>';
    try {
        const resp = await fetch(`${API_BASE}/api/business/${businessId}`);
        if (!resp.ok) throw new Error('Failed to fetch business services');
        const business = await resp.json();
        
        const infoDiv = document.getElementById('businessInfoContent');
        infoDiv.innerHTML = `
            <div class="info-row"><span class="info-label">ID:</span> <span class="info-value">${business.id}</span></div>
            <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">${business.email || '-'}</span></div>
            <div class="info-row"><span class="info-label">Company Name:</span> <span class="info-value">${business.companyName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${business.phone || '-'}</span></div>
            <div class="info-row"><span class="info-label">Role:</span> <span class="info-value">${business.role || '-'}</span></div>
        `;

        const services = business.services || [];
        if (!services.length) {
            servicesDiv.innerHTML = '<h3>Your Services</h3><div class="info-message">No services added yet.</div>';
            return;
        }

        servicesDiv.innerHTML = '<h3>Your Services</h3>' +
            services.map((service, idx) => `
                <div class="service-item">
                    <div class="service-detail"><strong>Event Type:</strong> ${service.eventType}</div>
                    <div class="service-detail"><strong>Price Range:</strong> ${service.priceRange}</div>
                    <div class="service-detail"><strong>Experience with Venues:</strong> ${service.venueIds && service.venueIds.length ? service.venueIds.join(', ') : 'None'}</div>
                </div>
            `).join('');
    } catch (err) {
        servicesDiv.innerHTML = '<h3>Your Services</h3><div class="error-message">Error loading services.</div>';
    }
}

async function fetchBusinessEvents() {
    const business = JSON.parse(localStorage.getItem('businessInfo'));
    if (!business) return;

    try {
        const response = await fetch(`${API_BASE}/api/venues/bookings/business?companyName=${encodeURIComponent(business.companyName)}`, {
            headers: {
                'X-Business-Id': business.id,
                'X-Business-Email': business.email
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }

        const events = await response.json();
        renderEvents(events);
    } catch (error) {
        const eventsDiv = document.getElementById('businessEvents');
        eventsDiv.innerHTML = '<div class="error-message">Failed to load events. Please try again later.</div>';
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function renderEvents(events) {
    const eventsDiv = document.getElementById('businessEvents');
    
    if (!events || events.length === 0) {
        eventsDiv.innerHTML = '<div class="info-message">No events found.</div>';
        return;
    }

    const eventsHtml = events.map((event, index) => `
        <div class="event-item" onclick="toggleEventDetails(${index})">
            <div class="event-title">${event.venueName}</div>
            <div class="event-details" id="event-details-${index}">
                <div class="event-detail-row">
                    <strong>Date(s):</strong> ${event.selectedDates.map(date => formatDate(date)).join(', ')}
                </div>
                <div class="event-detail-row">
                    <strong>Status:</strong> ${event.status}
                </div>
                <div class="event-detail-row">
                    <strong>Booking Date:</strong> ${formatDate(event.bookingDate)}
                </div>
            </div>
        </div>
    `).join('');

    eventsDiv.innerHTML = eventsHtml;
}

function toggleEventDetails(index) {
    const detailsDiv = document.getElementById(`event-details-${index}`);
    detailsDiv.classList.toggle('show');
}

// Service Modal Functions
function openAddServiceModal() {
    document.getElementById('addServiceModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    loadVenueList();
}

function closeAddServiceModal() {
    document.getElementById('addServiceModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addServiceError').style.display = 'none';
    document.getElementById('addServiceSuccess').style.display = 'none';
}

async function loadVenueList() {
    const venueListDiv = document.getElementById('venueList');
    venueListDiv.innerHTML = '<div class="loading">Loading venues...</div>';
    try {
        const response = await fetch(`${API_BASE}/api/venues/all`);
        if (!response.ok) throw new Error('Failed to fetch venues');
        const venues = await response.json();
        
        if (!venues || venues.length === 0) {
            venueListDiv.innerHTML = '<div class="info-message">No venues found.</div>';
            return;
        }

        venueListDiv.innerHTML = venues.map(venue => `
            <label class="venue-item">
                <input type="checkbox" name="venueExperience" value="${venue.id}" />
                ${venue.venueName}
            </label>
        `).join('');
    } catch (err) {
        venueListDiv.innerHTML = '<div class="error-message">Error loading venues.</div>';
    }
}

async function handleServiceFormSubmit(e) {
    e.preventDefault();
    const business = JSON.parse(localStorage.getItem('businessInfo'));
    if (!business) {
        showAddServiceError('Business info not found. Please login again.');
        return;
    }

    const eventType = document.getElementById('eventType').value;
    const priceRange = document.getElementById('priceRange').value.trim();
    const venueCheckboxes = document.querySelectorAll('input[name="venueExperience"]:checked');
    const venueIds = Array.from(venueCheckboxes).map(cb => cb.value);

    if (!eventType || !priceRange) {
        showAddServiceError('Please fill all required fields.');
        return;
    }

    try {
        const payload = {
            businessId: business.id,
            eventType,
            priceRange,
            venueIds
        };

        const resp = await fetch(`${API_BASE}/api/business/service`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Business-Id': business.id,
                'X-Business-Email': business.email
            },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.message || 'Failed to save service');
        }

        showAddServiceSuccess('Service added successfully!');
        setTimeout(() => {
            closeAddServiceModal();
            renderBusinessServices(business.id);
        }, 1200);
    } catch (err) {
        showAddServiceError(err.message);
    }
}

function showAddServiceError(msg) {
    const errDiv = document.getElementById('addServiceError');
    errDiv.textContent = msg;
    errDiv.style.display = 'block';
    document.getElementById('addServiceSuccess').style.display = 'none';
}

function showAddServiceSuccess(msg) {
    const succDiv = document.getElementById('addServiceSuccess');
    succDiv.textContent = msg;
    succDiv.style.display = 'block';
    document.getElementById('addServiceError').style.display = 'none';
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    renderBusinessInfo();
    
    // Set up event listeners
    document.getElementById('addServiceBtn').onclick = openAddServiceModal;
    document.getElementById('addServiceForm').onsubmit = handleServiceFormSubmit;
});
