package com.event.event_management.venue.controller;

import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.model.Booking;
import com.event.event_management.venue.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = "*")
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class VenueController {
    
    @Autowired
    private VenueService venueService;
    
    @GetMapping("/search")
    public ResponseEntity<List<Venue>> searchVenues(
            @RequestParam(name = "location", required = false, defaultValue = "Dhaka") String location,
            @RequestParam(name = "eventType", required = false) String eventType) {
        
        List<Venue> venues;
        if (eventType != null && !eventType.trim().isEmpty()) {
            if (location != null && !location.trim().isEmpty()) {
                venues = venueService.searchVenuesByLocationAndEventType(location, eventType);
            } else {
                venues = venueService.searchVenuesByEventType(eventType);
            }
        } else {
            venues = venueService.searchVenuesByLocation(location);
        }
        return ResponseEntity.ok(venues);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Venue>> getAllVenues() {
        System.out.println("=== GET ALL VENUES REQUEST ===");
        List<Venue> venues = venueService.getAllVenues();
        System.out.println("Returning " + venues.size() + " venues");
        return ResponseEntity.ok(venues);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")  // Ensures user is authenticated
    public ResponseEntity<Venue> getVenueById(@PathVariable String id) {
        try {
            System.out.println("Received request to fetch venue: " + id);
            Optional<Venue> venue = venueService.getVenueById(id);
            
            if (!venue.isPresent()) {
                System.out.println("Venue not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Successfully fetched venue: " + id);
            return ResponseEntity.ok(venue.get());
        } catch (Exception e) {
            System.err.println("Error fetching venue by ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
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

    /**
     * Get all bookings where a specific email is listed as a collaborator
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/bookings/collaborator/{email}")
    public ResponseEntity<List<Booking>> getBookingsByCollaborator(@PathVariable String email) {
        try {
            System.out.println("Looking for bookings with collaborator: " + email);
            List<Booking> bookings = venueService.getBookingsByCollaborator(email);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error fetching bookings by collaborator: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all bookings where a company name appears in cooks, vendors, or decorators arrays
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/bookings/business")
    public ResponseEntity<?> getBookingsByBusinessName(
            @RequestHeader("X-Business-Id") String businessId,
            @RequestHeader("X-Business-Email") String businessEmail,
            @RequestParam String companyName) {
        try {
            System.out.println("Looking for bookings with business: " + companyName);
            List<Booking> bookings = venueService.getBookingsByBusinessName(companyName);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            System.err.println("Error fetching bookings by business name: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to fetch bookings: " + e.getMessage()));
        }
    }

    /**
     * Add a cook to a booking (only one cook can be selected)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/add-cook")
    public ResponseEntity<?> addCookToBooking(
            @PathVariable String bookingId,
            @RequestBody ServiceProviderRequest request) {
        try {
            System.out.println("Received request to add cook to booking: " + bookingId + ", value: " + request.getValue());
            Booking updatedBooking = venueService.addCookToBooking(bookingId, request.getValue());
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error adding cook to booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to add cook: " + e.getMessage()));
        }
    }

    /**
     * Add a vendor to a booking (only one vendor can be selected)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/add-vendor")
    public ResponseEntity<?> addVendorToBooking(
            @PathVariable String bookingId,
            @RequestBody ServiceProviderRequest request) {
        try {
            System.out.println("Received request to add vendor to booking: " + bookingId + ", value: " + request.getValue());
            Booking updatedBooking = venueService.addVendorToBooking(bookingId, request.getValue());
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error adding vendor to booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to add vendor: " + e.getMessage()));
        }
    }

    /**
     * Add a decorator to a booking (only one decorator can be selected)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/add-decorator")
    public ResponseEntity<?> addDecoratorToBooking(
            @PathVariable String bookingId,
            @RequestBody ServiceProviderRequest request) {
        try {
            System.out.println("Received request to add decorator to booking: " + bookingId + ", value: " + request.getValue());
            Booking updatedBooking = venueService.addDecoratorToBooking(bookingId, request.getValue());
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error adding decorator to booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to add decorator: " + e.getMessage()));
        }
    }

    /**
     * Remove a cook from a booking (removes the single selected cook)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/remove-cook")
    public ResponseEntity<?> removeCookFromBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) ServiceProviderRequest request) {
        try {
            System.out.println("Received request to remove cook from booking: " + bookingId);
            // Since we're only allowing one cook, we can just clear the list
            // The value from the request isn't actually needed anymore
            Booking updatedBooking = venueService.removeCookFromBooking(bookingId, "");
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error removing cook from booking: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to remove cook: " + e.getMessage()));
        }
    }

    /**
     * Remove a vendor from a booking (removes the single selected vendor)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/remove-vendor")
    public ResponseEntity<?> removeVendorFromBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) ServiceProviderRequest request) {
        try {
            System.out.println("Received request to remove vendor from booking: " + bookingId);
            // Since we're only allowing one vendor, we can just clear the list
            // The value from the request isn't actually needed anymore
            Booking updatedBooking = venueService.removeVendorFromBooking(bookingId, "");
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error removing vendor from booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to remove vendor: " + e.getMessage()));
        }
    }

    /**
     * Remove a decorator from a booking (removes the single selected decorator)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/remove-decorator")
    public ResponseEntity<?> removeDecoratorFromBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) ServiceProviderRequest request) {
        try {
            System.out.println("Received request to remove decorator from booking: " + bookingId);
            // Since we're only allowing one decorator, we can just clear the list
            // The value from the request isn't actually needed anymore
            Booking updatedBooking = venueService.removeDecoratorFromBooking(bookingId, "");
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error removing decorator from booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to remove decorator: " + e.getMessage()));
        }
    }

    /**
     * Add a collaborator to a booking (only one collaborator can be selected)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/add-collaborator")
    public ResponseEntity<?> addCollaboratorToBooking(
            @PathVariable String bookingId,
            @RequestBody ServiceProviderRequest request) {
        try {
            System.out.println("Received request to add collaborator to booking: " + bookingId + ", value: " + request.getValue());
            Booking updatedBooking = venueService.addCollaboratorToBooking(bookingId, request.getValue());
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error adding collaborator to booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to add collaborator: " + e.getMessage()));
        }
    }

    /**
     * Remove a collaborator from a booking (removes the single selected collaborator)
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/bookings/{bookingId}/remove-collaborator")
    public ResponseEntity<?> removeCollaboratorFromBooking(
            @PathVariable String bookingId,
            @RequestBody(required = false) ServiceProviderRequest request) {
        try {
            System.out.println("Received request to remove collaborator from booking: " + bookingId);
            // Since we're only allowing one collaborator, we can just clear the list
            // The value from the request isn't actually needed anymore
            Booking updatedBooking = venueService.removeCollaboratorFromBooking(bookingId, "");
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            System.err.println("Error removing collaborator from booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to remove collaborator: " + e.getMessage()));
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

    // Service Provider Request DTO
    public static class ServiceProviderRequest {
        private String value; // Business ID of the service provider

        // Getters and setters
        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}