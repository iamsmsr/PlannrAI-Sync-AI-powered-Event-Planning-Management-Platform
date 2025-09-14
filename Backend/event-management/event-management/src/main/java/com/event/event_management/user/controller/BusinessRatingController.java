package com.event.event_management.user.controller;

import com.event.event_management.user.service.BusinessRatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/business")
@CrossOrigin(origins = "*")
public class BusinessRatingController {

    @Autowired
    private BusinessRatingService businessRatingService;

    @PostMapping("/rating")
    public ResponseEntity<?> updateBusinessRating(@RequestBody BusinessRatingRequest request) {
        try {
            System.out.println("Received business rating request: " + 
                "BookingId=" + request.getBookingId() + 
                ", ServiceType=" + request.getServiceType() + 
                ", Rating=" + request.getRating());
                
            businessRatingService.updateBusinessRating(
                request.getBookingId(),
                request.getServiceType(),
                request.getRating()
            );
            
            return ResponseEntity.ok(Map.of("message", "Rating updated successfully"));
        } catch (Exception e) {
            System.err.println("Error updating business rating: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    public static class BusinessRatingRequest {
        private String bookingId;
        private String serviceType;
        private Double rating;

        public String getBookingId() { return bookingId; }
        public void setBookingId(String bookingId) { this.bookingId = bookingId; }

        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }

        public Double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating; }
    }
}
