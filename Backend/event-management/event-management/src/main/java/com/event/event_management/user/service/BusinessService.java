package com.event.event_management.user.service;

import com.event.event_management.user.model.Business;
import com.event.event_management.user.repository.BusinessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Service
public class BusinessService {

    @Autowired
    private BusinessRepository businessRepository;

    public Business saveInquiry(String name, String email, String companyName, String phone, String Role) {
        Business business = new Business();
        business.setName(name);
        business.setEmail(email);
        business.setCompanyName(companyName);
        business.setPhone(phone);
        business.setRole(Role);

        return businessRepository.save(business);
    }

    /**
     * Search for businesses by role and optional query
     * @param role The role to filter by
     * @param query Optional search query for name or company name
     * @return List of matching businesses
     */
    public List<Business> searchBusinesses(String role, String query) {
        if (query == null || query.trim().isEmpty()) {
            // If no query is provided, just filter by role
            return businessRepository.findByRole(role);
        }

        // Search in both name and company name fields
        List<Business> nameResults = businessRepository.findByRoleAndNameContainingIgnoreCase(role, query);
        List<Business> companyResults = businessRepository.findByRoleAndCompanyNameContainingIgnoreCase(role, query);

        // Combine results, removing duplicates
        Set<String> processedIds = new HashSet<>();
        List<Business> combined = new ArrayList<>();

        for (Business business : nameResults) {
            if (!processedIds.contains(business.getId())) {
                combined.add(business);
                processedIds.add(business.getId());
            }
        }

        for (Business business : companyResults) {
            if (!processedIds.contains(business.getId())) {
                combined.add(business);
                processedIds.add(business.getId());
            }
        }

        return combined;
    }

    /**
     * Find a business by its ID
     * @param id The business ID
     * @return Optional containing the business if found
     */
    public java.util.Optional<Business> findById(String id) {
        return businessRepository.findById(id);
    }
}