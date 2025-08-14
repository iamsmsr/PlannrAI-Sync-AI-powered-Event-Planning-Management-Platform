package com.event.event_management.venue.controller;

import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.model.Booking;
import com.event.event_management.venue.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = "*")
public class VenueController {
    
    @Autowired
    private VenueService venueService;
    
    @GetMapping("/search")
    public ResponseEntity<List<Venue>> searchVenues(
            @RequestParam(name = "location", required = false, defaultValue = "Dhaka") String location,
            @RequestParam(name = "activity", required = false) String activity) {
        
        List<Venue> venues = venueService.searchVenuesByLocation(location);
        return ResponseEntity.ok(venues);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Venue>> getAllVenues() {
        System.out.println("=== GET ALL VENUES REQUEST ===");
        List<Venue> venues = venueService.getAllVenues();
        System.out.println("Returning " + venues.size() + " venues");
        return ResponseEntity.ok(venues);
    }
    @GetMapping("/bookings/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable String id) {
        try {
            Optional<Booking> bookingOpt = venueService.getBookingById(id);
            return bookingOpt
                    .map(booking -> ResponseEntity.ok().body(booking))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body((Booking) Map.of("message", "Booking not found")));
        } catch (Exception e) {
            System.err.println("Error fetching booking by ID: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to fetch booking: " + e.getMessage()));
        }
    }

    // Booking endpoints
    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        try {
            System.out.println("=== CREATE BOOKING REQUEST ===");
            System.out.println("User ID: " + request.getUserId());
            System.out.println("Venue ID: " + request.getVenueId());
            System.out.println("Venue Name: " + request.getVenueName());
            System.out.println("Selected Dates: " + request.getSelectedDates());
            
            // Validate required fields
            if (request.getUserId() == null || request.getVenueId() == null || 
                request.getVenueName() == null || request.getSelectedDates() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Missing required booking information");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Create booking
            Booking booking = venueService.createBooking(
                request.getUserId(),
                request.getVenueId(),
                request.getVenueName(),
                request.getSelectedDates(),
                request.getBookingDate()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Booking created successfully");
            response.put("bookingId", booking.getId());
            response.put("status", booking.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error creating booking: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create booking: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        try {
            List<Booking> bookings = venueService.getAllBookings();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error fetching bookings: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/bookings/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable String userId) {
        try {
            List<Booking> bookings = venueService.getUserBookings(userId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error fetching user bookings: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/bookings/status/{status}")
    public ResponseEntity<List<Booking>> getBookingsByStatus(@PathVariable String status) {
        try {
            List<Booking> bookings = venueService.getBookingsByStatus(status);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error fetching bookings by status: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // BookingRequest DTO
    public static class BookingRequest {
        private String userId;
        private String venueId;
        private String venueName;
        private List<String> selectedDates;
        private String bookingDate;
        
        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getVenueId() { return venueId; }
        public void setVenueId(String venueId) { this.venueId = venueId; }
        
        public String getVenueName() { return venueName; }
        public void setVenueName(String venueName) { this.venueName = venueName; }
        
        public List<String> getSelectedDates() { return selectedDates; }
        public void setSelectedDates(List<String> selectedDates) { this.selectedDates = selectedDates; }
        
        public String getBookingDate() { return bookingDate; }
        public void setBookingDate(String bookingDate) { this.bookingDate = bookingDate; }
    }
}