package com.event.event_management.venue.service;

import com.event.event_management.venue.model.Booking;
import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VenueRatingService {

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public void updateVenueRating(String bookingId, Double rating, String review) {
        // Find the booking by ID in the bookings collection
        Query bookingQuery = new Query(Criteria.where("id").is(bookingId));
        Booking booking = mongoTemplate.findOne(bookingQuery, Booking.class, "bookings");
        
        if (booking == null) {
            throw new RuntimeException("Booking not found with ID: " + bookingId);
        }

        System.out.println("Found booking for venue: " + booking.getVenueName() + " with venueId: " + booking.getVenueId());
        
        // Now find the venue using the venueId from the booking
        Query venueQuery = new Query(Criteria.where("id").is(booking.getVenueId()));
        Venue venue = mongoTemplate.findOne(venueQuery, Venue.class, "venues");
        
        if (venue == null) {
            throw new RuntimeException("Venue not found with ID: " + booking.getVenueId());
        }
        
        System.out.println("Updating venue: " + venue.getVenueName() + " with rating: " + rating);
        
        // Create review object using the inner Review class
        Venue.Review newReview = new Venue.Review("user", rating, review != null ? review : "");

        // Add to reviews array
        List<Venue.Review> reviews = venue.getReviews();
        if (reviews == null) {
            reviews = new java.util.ArrayList<>();
            venue.setReviews(reviews);
        }
        reviews.add(newReview);

        // Calculate new average rating
        double totalRating = 0.0;
        int ratingCount = 0;
        
        for (Venue.Review existingReview : reviews) {
            if (existingReview.getRating() != null) {
                totalRating += existingReview.getRating();
                ratingCount++;
            }
        }

        double averageRating = ratingCount > 0 ? totalRating / ratingCount : 0.0;

        // Update venue with new average rating
        venue.setRatings(Math.round(averageRating * 100.0) / 100.0); // Round to 2 decimal places

        // Save the updated venue
        venueRepository.save(venue);
        System.out.println("Venue rating updated successfully. New average: " + venue.getRatings());
    }
}
