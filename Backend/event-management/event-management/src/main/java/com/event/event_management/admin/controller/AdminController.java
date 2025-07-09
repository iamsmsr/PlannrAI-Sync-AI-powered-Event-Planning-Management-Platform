package com.event.event_management.admin.controller;

import com.event.event_management.venue.model.Booking;
import com.event.event_management.venue.service.VenueService;
import com.event.event_management.config.JwtUtils;
import com.event.event_management.user.model.User;
import com.event.event_management.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private VenueService venueService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserService userService;

    // Helper method to validate admin access
    private ResponseEntity<?> validateAdminAccess(HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Missing or invalid authorization header");
                return ResponseEntity.status(401).body(error);
            }
            
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // Validate JWT token
            if (!jwtUtils.validateJwtToken(token)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid or expired token");
                return ResponseEntity.status(401).body(error);
            }
            
            // Get user email from token
            String email = jwtUtils.getEmailFromJwtToken(token);
            
            // Find user by email
            User user = userService.findByEmail(email);
            if (user == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.status(401).body(error);
            }
            
            // Check if user has ADMIN role
            if (!user.getRoles().contains("ADMIN")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied. Admin privileges required.");
                return ResponseEntity.status(403).body(error);
            }
            
            return null; // No error, user is valid admin
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Authentication failed: " + e.getMessage());
            return ResponseEntity.status(401).body(error);
        }
    }
    
    // Helper method to get admin user ID from token
    private String getAdminUserIdFromToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            String token = authHeader.substring(7);
            String email = jwtUtils.getEmailFromJwtToken(token);
            User user = userService.findByEmail(email);
            return user.getId();
        } catch (Exception e) {
            return "admin_default"; // Fallback
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getAdminDashboard(HttpServletRequest request) {
        // Validate admin access
        ResponseEntity<?> validationError = validateAdminAccess(request);
        if (validationError != null) {
            return validationError;
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Welcome to Admin Dashboard");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending-bookings")
    public ResponseEntity<?> getPendingBookings(HttpServletRequest request) {
        // Validate admin access
        ResponseEntity<?> validationError = validateAdminAccess(request);
        if (validationError != null) {
            return validationError;
        }
        
        try {
            System.out.println("=== GET PENDING BOOKINGS REQUEST ===");
            
            List<Booking> pendingBookings = venueService.getBookingsByStatus("PENDING");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Pending bookings retrieved successfully");
            response.put("count", pendingBookings.size());
            response.put("bookings", pendingBookings);
            
            System.out.println("Found " + pendingBookings.size() + " pending bookings");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error fetching pending bookings: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch pending bookings: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PutMapping("/bookings/{bookingId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable String bookingId, HttpServletRequest request) {
        // Validate admin access
        ResponseEntity<?> validationError = validateAdminAccess(request);
        if (validationError != null) {
            return validationError;
        }
        
        try {
            System.out.println("=== APPROVE BOOKING REQUEST ===");
            System.out.println("Booking ID: " + bookingId);
            
            // Get admin user ID from token
            String adminUserId = getAdminUserIdFromToken(request);
            
            Booking approvedBooking = venueService.approveBooking(bookingId, adminUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Booking approved successfully");
            response.put("bookingId", approvedBooking.getId());
            response.put("status", approvedBooking.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error approving booking: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to approve booking: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PutMapping("/bookings/{bookingId}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable String bookingId, @RequestBody(required = false) RejectRequest request, HttpServletRequest httpRequest) {
        // Validate admin access
        ResponseEntity<?> validationError = validateAdminAccess(httpRequest);
        if (validationError != null) {
            return validationError;
        }
        
        try {
            System.out.println("=== REJECT BOOKING REQUEST ===");
            System.out.println("Booking ID: " + bookingId);
            
            // Get admin user ID from token
            String adminUserId = getAdminUserIdFromToken(httpRequest);
            String reason = request != null ? request.getReason() : "No reason provided";
            
            Booking rejectedBooking = venueService.rejectBooking(bookingId, adminUserId, reason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Booking rejected successfully");
            response.put("bookingId", rejectedBooking.getId());
            response.put("status", rejectedBooking.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error rejecting booking: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to reject booking: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // RejectRequest DTO
    public static class RejectRequest {
        private String reason;
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}