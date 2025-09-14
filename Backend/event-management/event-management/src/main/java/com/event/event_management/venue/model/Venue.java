package com.event.event_management.venue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Map;

@Document(collection = "venues")
public class Venue {
    
    @Id
    private String id;
    private String venueName;
    private String address;
    private String location;
    private List<Review> reviews;
    private Double ratings;
    private String details;
    private List<String> pictures;
    private Map<String, List<Integer>> currentBookings;
    private Map<String, List<Integer>> pastEvents;
    private Map<String, Object> tempEvent;
    private List<String> eventType;
    
    // Service provider lists for bookings
    private List<String> vendors;
    private List<String> cooks;
    private List<String> decorators;
    
    // Default constructor
    public Venue() {
    }
    
    // Constructor with parameters
    public Venue(String venueName, String address, String location, List<Review> reviews, 
                 Double ratings, String details, List<String> pictures, 
                 Map<String, List<Integer>> currentBookings, 
                 Map<String, List<Integer>> pastEvents, 
                 Map<String, Object> tempEvent,
                 List<String> eventType) {
        this.venueName = venueName;
        this.address = address;
        this.location = location;
        this.reviews = reviews;
        this.ratings = ratings;
        this.details = details;
        this.pictures = pictures;
        this.currentBookings = currentBookings;
        this.pastEvents = pastEvents;
        this.tempEvent = tempEvent;
        this.eventType = eventType;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getVenueName() {
        return venueName;
    }
    
    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public List<Review> getReviews() {
        return reviews;
    }
    
    public void setReviews(List<Review> reviews) {
        this.reviews = reviews;
    }
    
    public Double getRatings() {
        return ratings;
    }
    
    public void setRatings(Double ratings) {
        this.ratings = ratings;
    }
    
    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
    
    public List<String> getPictures() {
        return pictures;
    }
    
    public void setPictures(List<String> pictures) {
        this.pictures = pictures;
    }
    
    public Map<String, List<Integer>> getCurrentBookings() {
        return currentBookings;
    }
    
    public void setCurrentBookings(Map<String, List<Integer>> currentBookings) {
        this.currentBookings = currentBookings;
    }
    
    public Map<String, List<Integer>> getPastEvents() {
        return pastEvents;
    }
    
    public void setPastEvents(Map<String, List<Integer>> pastEvents) {
        this.pastEvents = pastEvents;
    }
    
    public Map<String, Object> getTempEvent() {
        return tempEvent;
    }
    
    public void setTempEvent(Map<String, Object> tempEvent) {
        this.tempEvent = tempEvent;
    }
    
    public List<String> getEventType() {
        return eventType;
    }
    
    public void setEventType(List<String> eventType) {
        this.eventType = eventType;
    }
    
    public List<String> getVendors() {
        return vendors;
    }
    
    public void setVendors(List<String> vendors) {
        this.vendors = vendors;
    }
    
    public List<String> getCooks() {
        return cooks;
    }
    
    public void setCooks(List<String> cooks) {
        this.cooks = cooks;
    }
    
    public List<String> getDecorators() {
        return decorators;
    }
    
    public void setDecorators(List<String> decorators) {
        this.decorators = decorators;
    }

    // Inner class for Review
    public static class Review {
        private String user;
        private Double rating;
        private String comment;
        
        public Review() {
        }
        
        public Review(String user, Double rating, String comment) {
            this.user = user;
            this.rating = rating;
            this.comment = comment;
        }
        
        public String getUser() {
            return user;
        }
        
        public void setUser(String user) {
            this.user = user;
        }
        
        public Double getRating() {
            return rating;
        }
        
        public void setRating(Double rating) {
            this.rating = rating;
        }
        
        public String getComment() {
            return comment;
        }
        
        public void setComment(String comment) {
            this.comment = comment;
        }
    }
}