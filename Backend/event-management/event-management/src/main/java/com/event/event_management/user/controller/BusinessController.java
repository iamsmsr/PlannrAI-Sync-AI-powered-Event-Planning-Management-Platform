package com.event.event_management.user.controller;

import com.event.event_management.user.model.Business;
import com.event.event_management.user.service.BusinessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/business")
@CrossOrigin(origins = "*")

public class BusinessController {

    @Autowired
    private BusinessService businessService;

    /**
     * Search for businesses by role with optional query parameter
     * Example: /api/business/search?role=cook&q=italian
     */
    @PostMapping("/inquiry")
    public ResponseEntity<?> submitInquiry(@RequestBody Business inquiryDTO) {
        try {
            Business inquiry = businessService.saveInquiry(
                    inquiryDTO.getName(),
                    inquiryDTO.getEmail(),
                    inquiryDTO.getCompanyName(),
                    inquiryDTO.getPhone(),
                    inquiryDTO.getRole()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", " submitted successfully");
            response.put("inquiry", Map.of(
                    "id", inquiry.getId(),
                    "companyName", inquiry.getCompanyName(),
                    "email", inquiry.getEmail(),
                    "phone", inquiry.getPhone(),
                    "role",  inquiry.getRole()

            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error submitting inquiry: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
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
