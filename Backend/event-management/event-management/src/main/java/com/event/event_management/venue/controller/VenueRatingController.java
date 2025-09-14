package com.event.event_management.venue.controller;

import com.event.event_management.venue.service.VenueRatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = "*")
public class VenueRatingController {

    @Autowired
    private VenueRatingService venueRatingService;

    @PostMapping("/rating")
    public ResponseEntity<?> updateVenueRating(@RequestBody VenueRatingRequest request) {
        try {
            System.out.println("Received venue rating request: " + 
                "BookingId=" + request.getBookingId() + 
                ", Rating=" + request.getRating() + 
                ", Review=" + request.getReview());
                
            venueRatingService.updateVenueRating(
                request.getBookingId(),
                request.getRating(),
                request.getReview()
            );
            
            return ResponseEntity.ok(Map.of("message", "Venue rating and review updated successfully"));
        } catch (Exception e) {
            System.err.println("Error updating venue rating: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    public static class VenueRatingRequest {
        private String bookingId;
        private Double rating;
        private String review;

        public String getBookingId() { return bookingId; }
        public void setBookingId(String bookingId) { this.bookingId = bookingId; }

        public Double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating; }

        public String getReview() { return review; }
        public void setReview(String review) { this.review = review; }
    }
}
