package com.event.event_management.user.service;

import com.event.event_management.user.model.Business;
import com.event.event_management.user.repository.BusinessRepository;
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
public class BusinessRatingService {

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public void updateBusinessRating(String bookingId, String serviceType, Double rating) {
        // Find the booking by ID in the bookings collection
        Query bookingQuery = new Query(Criteria.where("id").is(bookingId));
        Booking booking = mongoTemplate.findOne(bookingQuery, Booking.class, "bookings");
        
        if (booking == null) {
            throw new RuntimeException("Booking not found with ID: " + bookingId);
        }

        System.out.println("Found booking: " + booking.getVenueName() + " for venue: " + booking.getVenueId());
        
        // Get the list of business names for this service type from the booking
        List<String> businessNames = getBusinessNamesFromBooking(booking, serviceType);
        
        if (businessNames != null && !businessNames.isEmpty()) {
            // Update rating for each business of this type
            for (String businessName : businessNames) {
                updateBusinessRatingByName(businessName, serviceType, rating);
            }
        } else {
            System.out.println("No " + serviceType + "s found in booking " + bookingId);
        }
    }

    private List<String> getBusinessNamesFromBooking(Booking booking, String serviceType) {
        switch (serviceType.toLowerCase()) {
            case "vendor":
                return booking.getVendors();
            case "cook":
                return booking.getCooks();
            case "decorator":
                return booking.getDecorators();
            default:
                return null;
        }
    }

    private List<String> getBusinessNamesFromVenue(Venue venue, String serviceType) {
        switch (serviceType.toLowerCase()) {
            case "vendor":
                return venue.getVendors();
            case "cook":
                return venue.getCooks();
            case "decorator":
                return venue.getDecorators();
            default:
                return null;
        }
    }

    private void updateBusinessRatingByName(String businessName, String serviceType, Double newRating) {
        // Find business by company name or name
        List<Business> businesses = businessRepository.findByRoleAndCompanyNameContainingIgnoreCase(serviceType, businessName);
        
        if (businesses.isEmpty()) {
            businesses = businessRepository.findByRoleAndNameContainingIgnoreCase(serviceType, businessName);
        }

        for (Business business : businesses) {
            if (business.getCompanyName().equals(businessName) || business.getName().equals(businessName)) {
                // Calculate new average rating
                Double currentRating = business.getRating();
                if (currentRating == null) currentRating = 0.0;
                
                // Simple average calculation - in production, you might want to track number of ratings
                // For now, we'll do a weighted average where new rating has 30% weight
                Double updatedRating = (currentRating * 0.7) + (newRating * 0.3);
                
                business.setRating(updatedRating);
                businessRepository.save(business);
                break; // Only update the first exact match
            }
        }
    }
}
