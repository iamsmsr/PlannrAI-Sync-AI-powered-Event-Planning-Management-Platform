package com.event.event_management.venue.service;

import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.model.Booking;
import com.event.event_management.venue.repository.VenueRepository;
import com.event.event_management.venue.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@Service
public class VenueService {
    
    @Autowired
    private VenueRepository venueRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    /**
     * Get all bookings where a business name appears in cooks, vendors, or decorators arrays
     * @param businessName The name of the business to search for
     * @return List of bookings where the business is involved
     */
    public List<Booking> getBookingsByBusinessName(String businessName) {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Booking> matchingBookings = new ArrayList<>();

        for (Booking booking : allBookings) {
            // Check cooks array
            if (booking.getCooks() != null && booking.getCooks().contains(businessName)) {
                matchingBookings.add(booking);
                continue;
            }
            
            // Check vendors array
            if (booking.getVendors() != null && booking.getVendors().contains(businessName)) {
                matchingBookings.add(booking);
                continue;
            }
            
            // Check decorators array
            if (booking.getDecorators() != null && booking.getDecorators().contains(businessName)) {
                matchingBookings.add(booking);
            }
        }

        return matchingBookings;
    }

    /**
     * Add a cook to a booking
     * @param bookingId The booking ID
     * @param cookId The cook's business ID
     * @return The updated booking
     */
    public Booking addCookToBooking(String bookingId, String cookId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Log current cooks before change
        System.out.println("Current cooks before adding: " + booking.getCooks());

        // Add the cook (this will clear any existing cooks)
        booking.addCook(cookId);
        booking.setUpdatedAt(LocalDateTime.now().toString());

        // Log after change
        System.out.println("Cooks after adding: " + booking.getCooks());

        return bookingRepository.save(booking);
    }

    /**
     * Add a vendor to a booking
     * @param bookingId The booking ID
     * @param vendorId The vendor's business ID
     * @return The updated booking
     */
    public Booking addVendorToBooking(String bookingId, String vendorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Log current vendors before change
        System.out.println("Current vendors before adding: " + booking.getVendors());

        // Add the vendor (this will clear any existing vendors)
        booking.addVendor(vendorId);
        booking.setUpdatedAt(LocalDateTime.now().toString());

        // Log after change
        System.out.println("Vendors after adding: " + booking.getVendors());

        return bookingRepository.save(booking);
    }

    /**
     * Add a decorator to a booking
     * @param bookingId The booking ID
     * @param decoratorId The decorator's business ID
     * @return The updated booking
     */
    public Booking addDecoratorToBooking(String bookingId, String decoratorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Log current decorators before change
        System.out.println("Current decorators before adding: " + booking.getDecorators());

        // Add the decorator (this will clear any existing decorators)
        booking.addDecorator(decoratorId);
        booking.setUpdatedAt(LocalDateTime.now().toString());

        // Log after change
        System.out.println("Decorators after adding: " + booking.getDecorators());

        return bookingRepository.save(booking);
    }

    /**
     * Remove a cook from a booking
     * @param bookingId The booking ID
     * @param cookId The cook's business ID
     * @return The updated booking
     */
    public Booking removeCookFromBooking(String bookingId, String cookId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Debug logging
        System.out.println("Current cooks in booking: " + booking.getCooks());
        System.out.println("Attempting to remove cook with ID: " + cookId);

        // In the single selection model, we just clear the list regardless of the ID
        // This makes it more robust as we don't need to worry about ID matching
        booking.getCooks().clear();
        System.out.println("All cooks removed from booking");

        booking.setUpdatedAt(LocalDateTime.now().toString());
        return bookingRepository.save(booking);
    }

    /**
     * Remove a vendor from a booking
     * @param bookingId The booking ID
     * @param vendorId The vendor's business ID
     * @return The updated booking
     */
    public Booking removeVendorFromBooking(String bookingId, String vendorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Debug logging
        System.out.println("Current vendors in booking: " + booking.getVendors());
        System.out.println("Attempting to remove vendor with ID: " + vendorId);

        // In the single selection model, we just clear the list regardless of the ID
        // This makes it more robust as we don't need to worry about ID matching
        booking.getVendors().clear();
        System.out.println("All vendors removed from booking");

        booking.setUpdatedAt(LocalDateTime.now().toString());
        return bookingRepository.save(booking);
    }

    /**
     * Remove a decorator from a booking
     * @param bookingId The booking ID
     * @param decoratorId The decorator's business ID
     * @return The updated booking
     */
    public Booking removeDecoratorFromBooking(String bookingId, String decoratorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Debug logging
        System.out.println("Current decorators in booking: " + booking.getDecorators());
        System.out.println("Attempting to remove decorator with ID: " + decoratorId);

        // In the single selection model, we just clear the list regardless of the ID
        // This makes it more robust as we don't need to worry about ID matching
        booking.getDecorators().clear();
        System.out.println("All decorators removed from booking");

        booking.setUpdatedAt(LocalDateTime.now().toString());
        return bookingRepository.save(booking);
    }

    /**
     * Add a collaborator to a booking
     * @param bookingId The booking ID
     * @param collaboratorId The collaborator's business ID
     * @return The updated booking
     */
    public Booking addCollaboratorToBooking(String bookingId, String collaboratorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Log current collaborators before change
        System.out.println("Current collaborators before adding: " + booking.getCollaborators());

        // Add the collaborator (this will clear any existing collaborators)
        booking.addCollaborator(collaboratorId);
        booking.setUpdatedAt(LocalDateTime.now().toString());

        // Log after change
        System.out.println("Collaborators after adding: " + booking.getCollaborators());

        return bookingRepository.save(booking);
    }

    /**
     * Remove a collaborator from a booking
     * @param bookingId The booking ID
     * @param collaboratorId The collaborator's business ID
     * @return The updated booking
     */
    public Booking removeCollaboratorFromBooking(String bookingId, String collaboratorId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Debug logging
        System.out.println("Current collaborators in booking: " + booking.getCollaborators());
        System.out.println("Attempting to remove collaborator with ID: " + collaboratorId);

        // In the single selection model, we just clear the list regardless of the ID
        // This makes it more robust as we don't need to worry about ID matching
        booking.getCollaborators().clear();
        System.out.println("All collaborators removed from booking");

        booking.setUpdatedAt(LocalDateTime.now().toString());
        return bookingRepository.save(booking);
    }
    public List<Venue> searchVenuesByLocation(String location) {
        return venueRepository.findByLocationIgnoreCase(location);
    }
    
    public List<Venue> searchVenuesByEventType(String eventType) {
        return venueRepository.findByEventTypeContainingIgnoreCase(eventType);
    }
    
    public List<Venue> searchVenuesByLocationAndEventType(String location, String eventType) {
        return venueRepository.findByLocationIgnoreCaseAndEventTypeContainingIgnoreCase(location, eventType);
    }
    
    public List<Venue> getAllVenues() {
        System.out.println("Fetching all venues from database");
        List<Venue> allVenues = venueRepository.findAll();
        System.out.println("Total venues found: " + allVenues.size());
        return allVenues;
    }
    
    public Optional<Venue> getVenueById(String id) {
        System.out.println("Fetching venue with ID: " + id);
        return venueRepository.findById(id);
    }
    
    // Booking related methods
    public Booking createBooking(String userId, String venueId, String venueName, 
                                List<String> selectedDates, String bookingDate) {
        System.out.println("Creating new booking for user: " + userId);
        
        Booking booking = new Booking(userId, venueId, venueName, selectedDates, bookingDate);
        Booking savedBooking = bookingRepository.save(booking);
        
        System.out.println("Booking created with ID: " + savedBooking.getId());
        return savedBooking;
    }
    
    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public List<Booking> getBookingsByStatus(String status) {
        return bookingRepository.findByStatus(status);
    }

    /**
     * Get all bookings where the specified email is listed as a collaborator
     * @param collaboratorEmail The collaborator's email
     * @return List of bookings where the email is a collaborator
     */
    public List<Booking> getBookingsByCollaborator(String collaboratorEmail) {
        System.out.println("Finding bookings for collaborator email: " + collaboratorEmail);
        return bookingRepository.findByCollaboratorsContaining(collaboratorEmail);
    }

    public Booking approveBooking(String bookingId, String adminUserId) {
        System.out.println("Approving booking: " + bookingId + " by admin: " + adminUserId);
        
        // Find the booking
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (!bookingOpt.isPresent()) {
            throw new RuntimeException("Booking not found with ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        
        // Check if booking is in PENDING status
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is not in PENDING status. Current status: " + booking.getStatus());
        }
        
        // Update booking status
        booking.setStatus("ACTIVE");
        booking.setApprovedBy(adminUserId);
        booking.setApprovedAt(LocalDateTime.now().toString());
        booking.setUpdatedAt(LocalDateTime.now().toString());
        
        // Save updated booking
        Booking savedBooking = bookingRepository.save(booking);
        
        // Update venue's currentBookings
        updateVenueCurrentBookings(booking.getVenueId(), booking.getSelectedDates());
        
        System.out.println("Booking approved successfully: " + savedBooking.getId());
        return savedBooking;
    }

    public Booking rejectBooking(String bookingId, String adminUserId, String reason) {
        System.out.println("Rejecting booking: " + bookingId + " by admin: " + adminUserId);
        
        // Find the booking
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (!bookingOpt.isPresent()) {
            throw new RuntimeException("Booking not found with ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        
        // Check if booking is in PENDING status
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is not in PENDING status. Current status: " + booking.getStatus());
        }
        
        // Update booking status
        booking.setStatus("REJECTED");
        booking.setApprovedBy(adminUserId);
        booking.setApprovedAt(LocalDateTime.now().toString());
        booking.setNotes(reason);
        booking.setUpdatedAt(LocalDateTime.now().toString());
        
        // Save updated booking (no venue update needed for rejected bookings)
        Booking savedBooking = bookingRepository.save(booking);
        
        System.out.println("Booking rejected successfully: " + savedBooking.getId());
        return savedBooking;
    }

    private void updateVenueCurrentBookings(String venueId, List<String> selectedDates) {
        System.out.println("Updating venue currentBookings for venue: " + venueId);
        
        // Find the venue
        Optional<Venue> venueOpt = venueRepository.findById(venueId);
        if (!venueOpt.isPresent()) {
            System.err.println("Venue not found with ID: " + venueId);
            return;
        }
        
        Venue venue = venueOpt.get();
        Map<String, List<Integer>> currentBookings = venue.getCurrentBookings();
        
        // Initialize currentBookings if null
        if (currentBookings == null) {
            currentBookings = new HashMap<>();
            venue.setCurrentBookings(currentBookings);
        }
        
        // Process each selected date
        for (String dateStr : selectedDates) {
            try {
                // Parse date string (format: "2025-07-10")
                String[] dateParts = dateStr.split("-");
                int year = Integer.parseInt(dateParts[0]);
                int month = Integer.parseInt(dateParts[1]);
                int day = Integer.parseInt(dateParts[2]);
                
                // Create month/year key (format: "7/25")
                String monthYearKey = month + "/" + (year % 100);
                
                // Get or create the list for this month/year
                List<Integer> bookedDays = currentBookings.getOrDefault(monthYearKey, new ArrayList<>());
                
                // Add the day if not already present
                if (!bookedDays.contains(day)) {
                    bookedDays.add(day);
                    // Sort the list to keep days in order
                    bookedDays.sort(Integer::compareTo);
                }
                
                // Update the map
                currentBookings.put(monthYearKey, bookedDays);
                
                System.out.println("Added day " + day + " to month " + monthYearKey);
                
            } catch (Exception e) {
                System.err.println("Error parsing date: " + dateStr + " - " + e.getMessage());
            }
        }
        
        // Save updated venue
        venueRepository.save(venue);
        System.out.println("Venue currentBookings updated successfully");
    }
}