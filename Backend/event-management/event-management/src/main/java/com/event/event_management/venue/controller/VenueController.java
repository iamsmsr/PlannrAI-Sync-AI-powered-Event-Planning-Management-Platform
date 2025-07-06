package com.event.event_management.venue.controller;

import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = "*")
public class VenueController {
    
    @Autowired
    private VenueService venueService;
    
    @GetMapping("/search")
    public ResponseEntity<List<Venue>> searchVenues(
            @RequestParam(name = "location", required = false, defaultValue = "Dhaka") String location,
            @RequestParam(name = "activity", required = false) String activity) {
        

        
        List<Venue> venues = venueService.searchVenuesByLocation(location);
        
        
        return ResponseEntity.ok(venues);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Venue>> getAllVenues() {
        System.out.println("=== GET ALL VENUES REQUEST ===");
        List<Venue> venues = venueService.getAllVenues();
        System.out.println("Returning " + venues.size() + " venues");
        return ResponseEntity.ok(venues);
    }
}