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
            li.textContent = (type === 'collaborator') ? item : item;
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
    async function addItem(type, value) {
        clearError();
        // Replace with your backend endpoint
        const res = await fetch(`${API_BASE}/api/venues/bookings/${bookingId}/add-${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ value })
        });
        if (!res.ok) { showError('Failed to add.'); return; }
        bookingData = await res.json();
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

    input.addEventListener('input', function() {
        const query = input.value.trim();
        if (timeout) clearTimeout(timeout);
        if (dropdown) dropdown.remove();
        if (!query) return;
        timeout = setTimeout(async () => {
            const results = await fetchBusinessesByRole(role, query, true); // get objects
            showDropdown(input, results, async (selectedBiz) => {
                if (dropdown) dropdown.remove();
                // Hide input and add button
                input.style.display = 'none';
                const addBtn = input.parentNode.querySelector('button[type="submit"]');
                if (addBtn) addBtn.style.display = 'none';
                // Show details
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'collab-business-details';
                detailsDiv.innerHTML = `<strong>${selectedBiz.companyName || selectedBiz.name}</strong><br>
                    Email: ${selectedBiz.email || ''}<br>
                    Phone: ${selectedBiz.phone || ''}<br>
                    Role: ${selectedBiz.role || ''}`;
                input.parentNode.insertBefore(detailsDiv, input.nextSibling);
                // Store in DB for this booking
                await addItem(role, selectedBiz.companyName || selectedBiz.name);
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

document.addEventListener('DOMContentLoaded', function() {
    setupRoleAutocomplete('vendorInput', 'vendor');
    setupRoleAutocomplete('cookInput', 'cook');
    setupRoleAutocomplete('decoratorInput', 'decorator');
});
