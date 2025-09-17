package com.event.event_management.user.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

import java.util.List;
import java.util.ArrayList;

@Document(collection = "Business")
public class Business {
    @Id
    private String id;

    private String name;
    private String email;
    private String companyName;
    private String phone;
    private String role;
    private LocalDateTime createdAt = LocalDateTime.now();
    @org.springframework.data.mongodb.core.mapping.Field(value = "ratings")
    private Double rating = 0.0;

    // List of services offered by the business
    private List<BusinessServiceInfo> services = new ArrayList<>();

    // Getters and Setters
    public String getName() {
        return name;
    }

    public String getId() {
        return id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public String getRole() {
        return role;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public List<BusinessServiceInfo> getServices() {
        return services;
    }

    public void setServices(List<BusinessServiceInfo> services) {
        this.services = services;
    }

    public void addService(BusinessServiceInfo service) {
        if (this.services == null) this.services = new ArrayList<>();
        this.services.add(service);
    }

    // Inner class for business service info
    public static class BusinessServiceInfo {
        private String eventType;
        private String priceRange;
        private List<String> venueNames;

        public BusinessServiceInfo() {}

        public BusinessServiceInfo(String eventType, String priceRange, List<String> venueNames) {
            this.eventType = eventType;
            this.priceRange = priceRange;
            this.venueNames = venueNames;
        }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }

        public String getPriceRange() { return priceRange; }
        public void setPriceRange(String priceRange) { this.priceRange = priceRange; }

        public List<String> getVenueNames() { return venueNames; }
        public void setVenueNames(List<String> venueNames) { this.venueNames = venueNames; }
    }
}