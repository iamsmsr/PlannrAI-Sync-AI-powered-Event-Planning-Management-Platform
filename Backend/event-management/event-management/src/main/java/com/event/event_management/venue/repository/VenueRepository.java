package com.event.event_management.venue.repository;

import com.event.event_management.venue.model.Venue;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VenueRepository extends MongoRepository<Venue, String> {
    
    List<Venue> findByLocation(String location);
    List<Venue> findByLocationIgnoreCase(String location);
    List<Venue> findByEventTypeContainingIgnoreCase(String eventType);
    List<Venue> findByLocationIgnoreCaseAndEventTypeContainingIgnoreCase(String location, String eventType);
}