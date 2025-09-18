package com.event.event_management.user.controller;

import com.event.event_management.user.model.Business;
import com.event.event_management.user.service.BusinessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;
import java.net.URL;
import java.net.HttpURLConnection;

@RestController
@RequestMapping("/api/business")
@CrossOrigin(origins = "*")

public class BusinessController {

    private static final Logger logger = LoggerFactory.getLogger(BusinessController.class);

    @Autowired
    private BusinessService businessService;

    /**
     * Add a service to a business
     */
    @PostMapping("/service")
    public ResponseEntity<?> addServiceToBusiness(@RequestBody ServiceRequest request) {
        try {
            Business updated = businessService.addServiceToBusiness(
                request.getBusinessId(),
                request.getEventType(),
                request.getPriceRange(),
                request.getVenueNames()
            );
            // // Fire-and-forget: schedule a single asynchronous POST to the AI server and do not block
            // logger.info("⏱ Scheduling vector store update for businessId={}", request.getBusinessId());
            // CompletableFuture.runAsync(() -> {
            //     logger.info("🏃 Vector update async started for businessId={}", request.getBusinessId());
            //     HttpURLConnection conn = null;
            //     try {
            //         URL url = new URL("https://plannrai-sync-chatbot.onrender.com/update-vector-store");
            //         conn = (HttpURLConnection) url.openConnection();
            //         conn.setRequestMethod("POST");
            //         conn.setConnectTimeout(3000);
            //         conn.setReadTimeout(5000);
            //         conn.setDoOutput(true);
            //         conn.connect();

            //         int status = conn.getResponseCode();
            //         logger.info("Triggered vector update (fire-and-forget) status={}", status);
            //     } catch (Exception ex) {
            //         // Swallow errors so the main flow is never affected
            //         logger.error("Failed to trigger vector update (ignored): {}", ex.getMessage());
            //     } finally {
            //         if (conn != null) conn.disconnect();
            //     }
            // });

            // Trigger is currently commented out in the source; record that it was NOT scheduled
            logger.info("Vector update trigger is disabled in BusinessController; no async call scheduled for businessId={}", request.getBusinessId());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Service added successfully");
            response.put("business", updated);
            response.put("vectorUpdateScheduled", false);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }

    // DTO for service request
    public static class ServiceRequest {
        private String businessId;
        private String eventType;
        private String priceRange;
        private List<String> venueNames;
        public String getBusinessId() { return businessId; }
        public void setBusinessId(String businessId) { this.businessId = businessId; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getPriceRange() { return priceRange; }
        public void setPriceRange(String priceRange) { this.priceRange = priceRange; }
        public List<String> getVenueNames() { return venueNames; }
        public void setVenueNames(List<String> venueNames) { this.venueNames = venueNames; }

    }

    /**
     * Search for businesses by role with optional query parameter
     * Example: /api/business/search?role=cook&q=italian
     */
    // (submitInquiry removed)
    @GetMapping("/search")
    public ResponseEntity<?> searchBusinesses(
            @RequestParam("role") String role,
            @RequestParam(value = "q", required = false) String query) {
        try {
            List<Business> businesses = businessService.searchBusinesses(role, query);

            // Convert to DTO for response
            List<Map<String, Object>> businessList = businesses.stream()
                .map(business -> {
                    Map<String, Object> businessInfo = new HashMap<>();
                    businessInfo.put("id", business.getId());
                    businessInfo.put("name", business.getName());
                    businessInfo.put("email", business.getEmail());
                    businessInfo.put("companyName", business.getCompanyName());
                    businessInfo.put("phone", business.getPhone());
                    businessInfo.put("role", business.getRole());
                    return businessInfo;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(businessList);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error searching businesses: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get business by ID
     */
    @GetMapping("/{businessId}")
    public ResponseEntity<?> getBusinessById(@PathVariable String businessId) {
        try {
                return businessService.findById(businessId)
                    .map(business -> {
                        Map<String, Object> businessInfo = new HashMap<>();
                        businessInfo.put("id", business.getId());
                        businessInfo.put("name", business.getName());
                        businessInfo.put("email", business.getEmail());
                        businessInfo.put("companyName", business.getCompanyName());
                        businessInfo.put("phone", business.getPhone());
                        businessInfo.put("role", business.getRole());
                        businessInfo.put("rating", business.getRating());
                        businessInfo.put("services", business.getServices());
                        return ResponseEntity.ok(businessInfo);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching business: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get all businesses with a specific role
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<?> getBusinessesByRole(@PathVariable String role) {
        try {
            List<Business> businesses = businessService.searchBusinesses(role, null);

            List<Map<String, Object>> businessList = businesses.stream()
                .map(business -> {
                    Map<String, Object> businessInfo = new HashMap<>();
                    businessInfo.put("id", business.getId());
                    businessInfo.put("name", business.getName());
                    businessInfo.put("email", business.getEmail());
                    businessInfo.put("companyName", business.getCompanyName());
                    businessInfo.put("phone", business.getPhone());
                    businessInfo.put("role", business.getRole());
                    return businessInfo;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(businessList);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching businesses by role: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
