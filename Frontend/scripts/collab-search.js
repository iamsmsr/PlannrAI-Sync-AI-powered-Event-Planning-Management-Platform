// collab-search.js
// Autocomplete and search for vendors, cooks, decorators by role


// --- Access Control & Data ---
    const API_BASE = 'http://localhost:8080';
    const bookingId = new URLSearchParams(window.location.search).get('bookingId');
    const authToken = localStorage.getItem('authToken');

    let currentUser = null;
    let bookingData = null;
    let isOwnerOrCollaborator = false;

    async function fetchBooking() {
        if (!bookingId || !authToken) return null;
        // Replace with your backend endpoint
        const res = await fetch(`http://localhost:8080/api/venues/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) return null;
        return await res.json();
    }

    function showError(msg) {
        const err = document.getElementById('collabError');
        err.textContent = msg;
        err.style.display = 'block';
    }
    function showSuccess(msg) {
        const s = document.getElementById('collabSuccess');
        s.textContent = msg;
        s.style.display = 'block';
        setTimeout(() => { s.style.display = 'none'; }, 3000);
    }
    function clearError() { document.getElementById('collabError').style.display = 'none'; }

    async function checkAccessAndInit() {
        
        if (!currentUser) {
            showError('You must be logged in.');
            return;
        }
        bookingData = await fetchBooking();
        if (!bookingData) {
            showError('Booking not found.');
            return;
        }
        // Owner or collaborator check (user.js logic)
        isOwnerOrCollaborator = (bookingData.userId === currentUser.id) ||
            (bookingData.collaborators && bookingData.collaborators.includes(currentUser.email));
        if (!isOwnerOrCollaborator) {
            showError('You do not have access to collaborate on this event.');
            return;
        }
        document.getElementById('collabContainer').style.display = 'block';
        document.getElementById('collabInfo').textContent = `Event: ${bookingData.venueName || 'Venue'} | Dates: ${(bookingData.selectedDates||[]).join(', ')}`;
        renderAll();
    }

    // --- Renderers ---
    function renderAll() {
        renderList('vendorList', bookingData.vendors || [], 'vendor');
        renderList('cookList', bookingData.cooks || [], 'cook');
        renderList('decoratorList', bookingData.decorators || [], 'decorator');
        renderList('collaboratorsList', bookingData.collaborators || [], 'collaborator');
    }
    function renderList(listId, items, type) {
        const ul = document.getElementById(listId);
        ul.innerHTML = '';
        items.forEach((item, idx) => {
            const li = document.createElement('li');
            
            // Create name span that's clickable for business users
            const nameSpan = document.createElement('span');
            nameSpan.textContent = (type === 'collaborator') ? item : item;
            if (type !== 'collaborator') {
                nameSpan.style.cursor = 'pointer';
                nameSpan.onclick = () => showBusinessDetails(item, type, li);
            }
            li.appendChild(nameSpan);

            // Add details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'business-details-container';
            detailsDiv.style.display = 'none';
            li.appendChild(detailsDiv);

            if (type !== 'collaborator' || item !== bookingData.ownerEmail) {
                const btn = document.createElement('button');
                btn.className = 'collab-remove-btn';
                btn.textContent = 'Remove';
                btn.onclick = () => removeItem(type, idx);
                li.appendChild(btn);
            }
            ul.appendChild(li);
        });
    }

    // --- Add/Remove Handlers ---
    async function addItem(type, value, selectedBiz = null) {
        clearError();
        // Replace with your backend endpoint
        const res = await fetch(`${API_BASE}/api/venues/bookings/${bookingId}/add-${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ value })
        });
        if (!res.ok) { showError('Failed to add.'); return; }
        bookingData = await res.json();

        // If adding a business (vendor, cook, decorator), create a chat with them
        if (selectedBiz && ['vendor', 'cook', 'decorator'].includes(type)) {
            try {
                // Get current user info
                const userData = localStorage.getItem('userData');
                const currentUserData = userData ? JSON.parse(userData) : null;

                if (!currentUserData || !currentUserData.email) {
                    console.error('Current user data not found');
                    return;
                }

                // Create chat with the business
                const chatRes = await fetch(`${API_BASE}/api/chat/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                        'X-Business-Id': selectedBiz.id,
                        'X-Business-Email': selectedBiz.email
                    },
                    body: JSON.stringify({
                        otherUserEmail: currentUserData.email
                    })
                });

                if (!chatRes.ok) {
                    const error = await chatRes.json();
                    console.error('Failed to create chat with business:', error);
                } else {
                    console.log('Chat created successfully with business');
                }
            } catch (error) {
                console.error('Error creating chat:', error);
            }
        }

        renderAll();
        showSuccess('Added successfully!');
    }
    async function removeItem(type, idx) {
        clearError();
        // Replace with your backend endpoint
        const res = await fetch(`${API_BASE}/api/venues/bookings/${bookingId}/remove-${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ idx })
        });
        if (!res.ok) { showError('Failed to remove.'); return; }
        bookingData = await res.json();
        renderAll();
        showSuccess('Removed successfully!');

        // Restore input and add button for the removed type
        let inputId, formId;
        if (type === 'vendor') { inputId = 'vendorInput'; formId = 'vendorForm'; }
        else if (type === 'cook') { inputId = 'cookInput'; formId = 'cookForm'; }
        else if (type === 'decorator') { inputId = 'decoratorInput'; formId = 'decoratorForm'; }
        if (inputId && formId) {
            const input = document.getElementById(inputId);
            const form = document.getElementById(formId);
            if (input) input.style.display = '';
            if (form) {
                const btn = form.querySelector('button[type="submit"]');
                if (btn) btn.style.display = '';
            }
            // Remove any details divs next to the input
            if (input && input.nextSibling && input.nextSibling.className === 'collab-business-details') {
                input.nextSibling.remove();
            }
        }
    }

    // --- Form Listeners ---
    document.addEventListener('DOMContentLoaded', () => {
        // Set currentUser from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
        checkAccessAndInit();
        document.getElementById('vendorForm').onsubmit = e => {
            e.preventDefault();
            addItem('vendor', document.getElementById('vendorInput').value.trim());
            document.getElementById('vendorInput').value = '';
        };
        document.getElementById('cookForm').onsubmit = e => {
            e.preventDefault();
            addItem('cook', document.getElementById('cookInput').value.trim());
            document.getElementById('cookInput').value = '';
        };
        document.getElementById('decoratorForm').onsubmit = e => {
            e.preventDefault();
            addItem('decorator', document.getElementById('decoratorInput').value.trim());
            document.getElementById('decoratorInput').value = '';
        };
        document.getElementById('inviteForm').onsubmit = e => {
            e.preventDefault();
            addItem('collaborator', document.getElementById('inviteEmail').value.trim());
            document.getElementById('inviteEmail').value = '';
        };
    });
function setupRoleAutocomplete(inputId, role) {
    const input = document.getElementById(inputId);
    let timeout = null;
    let dropdown = null;
    let selectedBiz = null;

    input.addEventListener('input', function() {
        const query = input.value.trim();
        if (timeout) clearTimeout(timeout);
        if (dropdown) dropdown.remove();
        if (!query) return;
        timeout = setTimeout(async () => {
            const results = await fetchBusinessesByRole(role, query, true); // get objects
            showDropdown(input, results, function(biz) {
                selectedBiz = biz;
                input.value = biz.companyName || biz.name || '';
                if (dropdown) dropdown.remove();
                // Show details
                let detailsDiv = input.parentNode.querySelector('.collab-business-details');
                if (!detailsDiv) {
                    detailsDiv = document.createElement('div');
                    detailsDiv.className = 'collab-business-details';
                    input.parentNode.insertBefore(detailsDiv, input.nextSibling);
                }
                detailsDiv.innerHTML = `<strong>${biz.companyName || biz.name}</strong><br>
                    Email: ${biz.email || ''}<br>
                    Phone: ${biz.phone || ''}<br>
                    Role: ${biz.role || ''}<br>
                    Rating: <span class="business-rating">${biz.rating !== undefined ? biz.rating.toFixed(1) : 'N/A'} ⭐</span>`;
                // Add button to confirm adding
                let addBtn = detailsDiv.querySelector('.collab-add-biz-btn');
                if (!addBtn) {
                    addBtn = document.createElement('button');
                    addBtn.textContent = 'Add & Create Chat';
                    addBtn.className = 'collab-add-biz-btn';
                    addBtn.style.marginTop = '8px';
                    addBtn.onclick = async function(e) {
                        e.preventDefault();
                        input.style.display = 'none';
                        this.style.display = 'none';
                        // Save to DB and create chat
                        await addItem(role, biz.companyName || biz.name, biz);
                    };
                    detailsDiv.appendChild(addBtn);
                } else {
                    addBtn.style.display = 'inline-block';
                }
            });
        }, 250);
    });
    input.addEventListener('blur', function() {
        setTimeout(() => { if (dropdown) dropdown.remove(); }, 200);
    });

    function showDropdown(input, items, onSelect) {
        dropdown = document.createElement('ul');
        dropdown.className = 'collab-autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.zIndex = 1000;
        dropdown.style.width = input.offsetWidth + 'px';
        dropdown.style.left = input.getBoundingClientRect().left + window.scrollX + 'px';
        dropdown.style.top = input.getBoundingClientRect().bottom + window.scrollY + 'px';
        dropdown.style.listStyle = 'none';
        dropdown.style.padding = '0';
        dropdown.style.margin = '0';
        items.forEach(biz => {
            const li = document.createElement('li');
            li.textContent = biz.companyName || biz.name || '';
            li.style.padding = '8px';
            li.style.cursor = 'pointer';
            li.addEventListener('mousedown', () => onSelect(biz));
            dropdown.appendChild(li);
        });
        document.body.appendChild(dropdown);
    }
}

async function fetchBusinessesByRole(role, query) {
    try {
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/business/search?role=${encodeURIComponent(role)}&q=${encodeURIComponent(query)}`, {
            headers
        });
        if (!res.ok) return [];
        const data = await res.json();
        // If want objects, return as is, else just names
        if (arguments[2]) return Array.isArray(data) ? data : [];
        if (Array.isArray(data)) {
            return data.map(biz => biz.companyName || biz.name || '');
        }
        return [];
    } catch {
        return [];
    }
}

async function showBusinessDetails(businessName, role, listItem) {
    const detailsContainer = listItem.querySelector('.business-details-container');
    // Toggle visibility if details are already loaded
    if (detailsContainer.innerHTML !== '') {
        detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
        return;
    }
    try {
        // Search for the business
        const results = await fetchBusinessesByRole(role, businessName, true);
        const business = results.find(b => (b.companyName || b.name) === businessName);
        if (business) {
            let servicesHtml = '';
            if (business.id) {
                // Fetch latest business info to get services
                try {
                    const resp = await fetch(`${API_BASE}/api/business/${business.id}`);
                    if (resp.ok) {
                        const fullBiz = await resp.json();
                        const services = fullBiz.services || [];
                        if (services.length) {
                            // Fetch all venues for mapping IDs to names
                            let venueMap = {};
                            try {
                                const venueResp = await fetch(`${API_BASE}/api/venues/all`);
                                if (venueResp.ok) {
                                    const venues = await venueResp.json();
                                    venues.forEach(v => venueMap[v.id] = v.venueName);
                                }
                            } catch {}
                            servicesHtml = `<div style='margin-top:10px;'><strong>Services:</strong><ul style='padding-left:18px;'>` +
                                services.map(s => {
                                    let venueNames = (s.venueIds||[]).map(id => venueMap[id] || id).join(', ');
                                    return `<li>Event: ${s.eventType}, Price: ${s.priceRange}, Venues: ${venueNames || 'None'}</li>`;
                                }).join('') +
                                '</ul></div>';
                        } else {
                            servicesHtml = `<div style='margin-top:10px;color:#6b7280;'>No services listed.</div>`;
                        }
                    }
                } catch {}
            }
            detailsContainer.innerHTML = `
                <div class="business-details">
                    <p><strong>Company:</strong> ${business.companyName || business.name}</p>
                    <p><strong>Email:</strong> ${business.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${business.phone || 'N/A'}</p>
                    <p><strong>Role:</strong> ${business.role || role}</p>
                    <p><strong>Rating:</strong> <span class="business-rating">${business.rating !== undefined ? business.rating.toFixed(1) : 'N/A'} ⭐</span></p>
                    ${business.description ? `<p><strong>Description:</strong> ${business.description}</p>` : ''}
                    ${servicesHtml}
                </div>
            `;
            detailsContainer.style.display = 'block';
        } else {
            detailsContainer.innerHTML = '<p class="error">Business details not found</p>';
            detailsContainer.style.display = 'block';
        }
    } catch (error) {
        detailsContainer.innerHTML = '<p class="error">Error loading business details</p>';
        detailsContainer.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupRoleAutocomplete('vendorInput', 'vendor');
    setupRoleAutocomplete('cookInput', 'cook');
    setupRoleAutocomplete('decoratorInput', 'decorator');
});
