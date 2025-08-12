// Calendar modal functionality

// Global variables for calendar state
let currentVenue = null;
let selectedDates = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Open calendar modal for a specific venue
function viewDates(venueId, venueName) {
    console.log('Opening calendar for venue:', venueName, 'ID:', venueId);
    
    // Find the venue from the current search results
    currentVenue = currentSearchResults.find(venue => venue.id === venueId);
    
    if (!currentVenue) {
        console.error('Venue not found in search results');
        return;
    }
    
    // Reset selected dates
    selectedDates = [];
    
    // Set current month/year to current date
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    
    // Wait a bit for DOM to be ready, then update modal
    setTimeout(() => {
        // Update modal title with safety check
        const venueTitle = document.querySelector('.venue-title');
        if (venueTitle) {
            venueTitle.textContent = `Available Dates for ${venueName}`;
        } else {
            console.error('Could not find .venue-title element');
            return;
        }
        
        // Generate month selector
        generateMonthSelector();
        
        // Generate calendar for current month
        generateCalendar(currentMonth, currentYear);
        
        // Show modal
        const modal = document.getElementById('calendarModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            console.error('Could not find calendar modal');
        }
    }, 100);
}

// Close calendar modal
function closeCalendar() {
    document.getElementById('calendarModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore background scrolling
    selectedDates = [];
    currentVenue = null;
}

// Generate month selector buttons
function generateMonthSelector() {
    const monthSelector = document.querySelector('.month-selector');
    if (!monthSelector) {
        console.error('Could not find .month-selector element');
        return;
    }
    
    monthSelector.innerHTML = '';
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentDate = new Date();
    const currentYearOnly = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();
    
    // Show months from current month onwards (remaining months of the year)
    for (let month = currentMonthIndex; month <= 11; month++) {
        const monthBtn = document.createElement('button');
        monthBtn.className = 'month-btn';
        monthBtn.textContent = `${monthNames[month]} ${currentYearOnly}`;
        
        // Highlight current selected month
        if (month === currentMonth && currentYearOnly === currentYear) {
            monthBtn.classList.add('active');
        }
        
        // Add click handler
        monthBtn.onclick = () => selectMonth(month, currentYearOnly);
        
        monthSelector.appendChild(monthBtn);
    }
}

// Select a specific month
function selectMonth(month, year) {
    currentMonth = month;
    currentYear = year;
    
    // Update active month button
    document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Regenerate calendar
    generateCalendar(month, year);
}

// Generate calendar grid for a specific month
function generateCalendar(month, year) {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) {
        console.error('Could not find .calendar-grid element');
        return;
    }
    
    calendarGrid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const cellDate = new Date(year, month, day);
        const dateString = formatDate(cellDate);
        
        // Check if date is in the past
        if (cellDate < today.setHours(0, 0, 0, 0)) {
            dayCell.classList.add('past');
        }
        // Check if date is booked
        else if (isDateBooked(dateString)) {
            dayCell.classList.add('booked');
        }
        // Check if date is temporarily held
        else if (isDateTempHold(dateString)) {
            dayCell.classList.add('temp-hold');
        }
        // Check if date is selected
        else if (selectedDates.includes(dateString)) {
            dayCell.classList.add('selected');
        }
        else {
            dayCell.classList.add('available');
            // Add click handler for available dates only
            dayCell.onclick = () => toggleDateSelection(dateString, dayCell);
        }
        
        calendarGrid.appendChild(dayCell);
    }
}

// Toggle date selection
function toggleDateSelection(dateString, dayCell) {
    if (selectedDates.includes(dateString)) {
        // Remove from selection
        selectedDates = selectedDates.filter(date => date !== dateString);
        dayCell.classList.remove('selected');
        dayCell.classList.add('available');
    } else {
        // Add to selection
        selectedDates.push(dateString);
        dayCell.classList.remove('available');
        dayCell.classList.add('selected');
    }
}

// Check if a date is booked
function isDateBooked(dateString) {
    if (!currentVenue || !currentVenue.currentBookings) return false;
    
    // Parse the dateString "2025-07-05"
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const day = date.getDate(); // Get the day of month (1-31)
    
    const bookingKey = `${month}/${year}`; // e.g., "7/25"
    
    // Check if this month/year has bookings AND if this specific day is booked
    const monthBookings = currentVenue.currentBookings[bookingKey];
    return monthBookings && monthBookings.includes(day);
}

// Check if a date is temporarily held
function isDateTempHold(dateString) {
    if (!currentVenue || !currentVenue.tempEvent) return false;
    
    // Parse the dateString "2025-07-05"
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    const day = date.getDate(); // Get the day of month (1-31)
    
    const tempKey = `${month}/${year}`; // e.g., "7/25"
    
    // Check if this month/year has temp events AND if this specific day is temp held
    const monthTempEvents = currentVenue.tempEvent[tempKey];
    return monthTempEvents && monthTempEvents.includes(day);
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Book dates function - checks login and creates temp booking
function bookDates() {
    // Check if any dates are selected
    if (selectedDates.length === 0) {
        // Visual feedback instead of alert
        const bookBtn = document.querySelector('.book-dates-btn');
        const originalText = bookBtn.textContent;
        bookBtn.textContent = 'Please select at least one date';
        bookBtn.style.backgroundColor = '#dc2626';
        setTimeout(() => {
            bookBtn.textContent = originalText;
            bookBtn.style.backgroundColor = '#059669';
        }, 2000);
        return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        // User not logged in - show login modal
        closeCalendar();
        showAuthModal('signin');
        return;
    }
    
    // User is logged in - create temp booking
    const bookingId = 'booking_' + Date.now();
    const tempExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const user = JSON.parse(userData);
    
    const newBooking = {
        id: bookingId,
        userId: user.id,
        venueId: currentVenue.id,
        venueName: currentVenue.venueName,
        selectedDates: [...selectedDates],
        status: 'temp',
        bookingDate: new Date().toISOString(),
        tempExpiry: tempExpiry.toISOString()
    };
    
    // Save to localStorage
    const userBookings = JSON.parse(localStorage.getItem('userBookings')) || [];
    userBookings.push(newBooking);
    localStorage.setItem('userBookings', JSON.stringify(userBookings));
    
    console.log('Creating temp booking for venue:', currentVenue.id);
    console.log('Selected dates:', selectedDates);
    console.log('Booking saved:', newBooking);
    
    // Close calendar and show dashboard
    closeCalendar();
    showDashboard();
    
    // Switch to My Bookings tab
    switchDashboardTab('bookings');
    
    // Show success message
    const confirmMessage = document.createElement('div');
    confirmMessage.innerHTML = `<strong>Dates Reserved!</strong><br>You have 10 minutes to confirm your booking for ${currentVenue.venueName}`;
    confirmMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        line-height: 1.4;
    `;
    document.body.appendChild(confirmMessage);
    
    // Remove the message after 4 seconds
    setTimeout(() => {
        if (confirmMessage.parentNode) {
            confirmMessage.parentNode.removeChild(confirmMessage);
        }
    }, 4000);
}

// Initialize calendar functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('calendarModal');
        if (event.target === modal) {
            closeCalendar();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('calendarModal');
            if (modal.style.display === 'flex') {
                closeCalendar();
            }
        }
    });
});
