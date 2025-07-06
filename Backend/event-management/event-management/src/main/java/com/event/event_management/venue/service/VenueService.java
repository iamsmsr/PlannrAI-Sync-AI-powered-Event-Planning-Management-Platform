package com.event.event_management.venue.service;

import com.event.event_management.venue.model.Venue;
import com.event.event_management.venue.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VenueService {
    
    @Autowired
    private VenueRepository venueRepository;
    
    public List<Venue> searchVenuesByLocation(String location) {
        
        List<Venue> venues = venueRepository.findByLocationIgnoreCase(location);
      
        

        
        return venues;
    }
    
    public List<Venue> getAllVenues() {
        System.out.println("Fetching all venues from database");
        List<Venue> allVenues = venueRepository.findAll();
        System.out.println("Total venues found: " + allVenues.size());
        return allVenues;
    }
}