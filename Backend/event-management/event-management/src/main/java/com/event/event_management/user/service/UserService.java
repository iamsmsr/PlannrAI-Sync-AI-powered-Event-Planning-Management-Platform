package com.event.event_management.user.service;

import com.event.event_management.user.model.User;
import com.event.event_management.user.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User createUser(String name, String email, String password, String phone) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered");
        }

        // Create new user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password)); // Hash password
        user.setPhone(phone);

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }


    public User findById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    // Search users by name or email for chat functionality
    public List<User> searchUsersByNameOrEmail(String query, String excludeEmail) {
        List<User> allUsers = userRepository.findAll();
        
        return allUsers.stream()
            .filter(user -> !user.getEmail().equals(excludeEmail)) // Exclude current user
            .filter(user -> 
                user.getName().toLowerCase().contains(query.toLowerCase()) ||
                user.getEmail().toLowerCase().contains(query.toLowerCase())
            )
            .limit(10) // Limit results
            .collect(Collectors.toList());
    }


}