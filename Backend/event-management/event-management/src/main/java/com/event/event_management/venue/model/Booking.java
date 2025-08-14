package com.event.event_management.venue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

import java.util.ArrayList;

@Document(collection = "bookings")
public class Booking {
    
    @Id
    private String id;
    private String userId;
    private String venueId;
    private String venueName;
    private List<String> selectedDates;
    private String status; // PENDING, ACTIVE, COMPLETED, REJECTED, CANCELLED
    private Double totalAmount;
    private String bookingDate;
    private String approvedBy;
    private String approvedAt;
    private String notes;
    private String createdAt;
    private String updatedAt;

    // Additional service providers for the event
    private List<String> cooks = new ArrayList<>();       // List of cook business IDs
    private List<String> vendors = new ArrayList<>();     // List of vendor business IDs
    private List<String> decorators = new ArrayList<>();  // List of decorator business IDs
    
    // Default constructor
    public Booking() {
    }
    
    // Constructor for creating new booking
    public Booking(String userId, String venueId, String venueName, List<String> selectedDates, String bookingDate) {
        this.userId = userId;
        this.venueId = venueId;
        this.venueName = venueName;
        this.selectedDates = selectedDates;
        this.bookingDate = bookingDate;
        this.status = "PENDING";
        this.totalAmount = 500.0; // Default amount, you can calculate this based on venue pricing
        this.createdAt = LocalDateTime.now().toString();
        this.updatedAt = LocalDateTime.now().toString();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getVenueId() {
        return venueId;
    }
    
    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }
    
    public String getVenueName() {
        return venueName;
    }
    
    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }
    
    public List<String> getSelectedDates() {
        return selectedDates;
    }
    
    public void setSelectedDates(List<String> selectedDates) {
        this.selectedDates = selectedDates;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now().toString();
    }
    
    public Double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public String getBookingDate() {
        return bookingDate;
    }
    
    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }
    
    public String getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public String getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(String approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<String> getCooks() {
        return cooks;
    }

    public void setCooks(List<String> cooks) {
        this.cooks = cooks;
    }

    public List<String> getVendors() {
        return vendors;
    }

    public void setVendors(List<String> vendors) {
        this.vendors = vendors;
    }

    public List<String> getDecorators() {
        return decorators;
    }

    public void setDecorators(List<String> decorators) {
        this.decorators = decorators;
    }

    // Helper methods to add individual providers
    public void addCook(String cookId) {
        if (this.cooks == null) {
            this.cooks = new ArrayList<>();
        }
        // Clear any existing cooks first to ensure only one selection
        this.cooks.clear();
        // Add the new cook
        this.cooks.add(cookId);
    }

    public void addVendor(String vendorId) {
        if (this.vendors == null) {
            this.vendors = new ArrayList<>();
        }
        // Clear any existing vendors first to ensure only one selection
        this.vendors.clear();
        // Add the new vendor
        this.vendors.add(vendorId);
    }

    public void addDecorator(String decoratorId) {
        if (this.decorators == null) {
            this.decorators = new ArrayList<>();
        }
        // Clear any existing decorators first to ensure only one selection
        this.decorators.clear();
        // Add the new decorator
        this.decorators.add(decoratorId);
    }

    // Helper methods to remove individual providers
    public boolean removeCook(String cookId) {
        if (this.cooks == null || this.cooks.isEmpty()) {
            return false;
        }
        // Iterate manually to ensure we're removing the correct item
        for (int i = 0; i < this.cooks.size(); i++) {
            if (this.cooks.get(i).equals(cookId)) {
                this.cooks.remove(i);
                return true;
            }
        }
        return false;
    }

    public boolean removeVendor(String vendorId) {
        if (this.vendors == null || this.vendors.isEmpty()) {
            return false;
        }
        // Iterate manually to ensure we're removing the correct item
        for (int i = 0; i < this.vendors.size(); i++) {
            if (this.vendors.get(i).equals(vendorId)) {
                this.vendors.remove(i);
                return true;
            }
        }
        return false;
    }

    public boolean removeDecorator(String decoratorId) {
        if (this.decorators == null || this.decorators.isEmpty()) {
            return false;
        }
        // Iterate manually to ensure we're removing the correct item
        for (int i = 0; i < this.decorators.size(); i++) {
            if (this.decorators.get(i).equals(decoratorId)) {
                this.decorators.remove(i);
                return true;
            }
        }
        return false;
    }
}