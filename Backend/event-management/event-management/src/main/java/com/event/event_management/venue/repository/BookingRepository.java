package com.event.event_management.venue.repository;

import com.event.event_management.venue.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    
    List<Booking> findByUserId(String userId);
    List<Booking> findByVenueId(String venueId);
    List<Booking> findByStatus(String status);
    List<Booking> findByUserIdAndStatus(String userId, String status);
}