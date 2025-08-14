package com.event.event_management.user.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

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
}