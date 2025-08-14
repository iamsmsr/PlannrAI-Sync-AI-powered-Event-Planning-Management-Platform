package com.event.event_management.user.repository;

import com.event.event_management.user.model.Business;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface BusinessRepository extends MongoRepository<Business, String> {
    Optional<Business> findByEmail(String email);
    Optional<Business> findByCompanyName(String companyName);
    Optional<Business> findByPhone(String phone);
    List<Business> findByRole(String role);

    // Find businesses by role and name containing search query
    List<Business> findByRoleAndNameContainingIgnoreCase(String role, String query);

    // Find businesses by role and company name containing search query
    List<Business> findByRoleAndCompanyNameContainingIgnoreCase(String role, String query);
}