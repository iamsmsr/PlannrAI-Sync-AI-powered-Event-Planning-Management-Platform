package com.event.event_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.bson.Document;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class EventManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventManagementApplication.class, args);
	}

	@Bean
	public CommandLineRunner printVenues(MongoTemplate mongoTemplate) {
		return args -> {
			try {
				MongoCollection<Document> venues = mongoTemplate.getDb().getCollection("venues");
				System.out.println("Venues in the database:");
				try (MongoCursor<Document> cursor = venues.find().iterator()) {
					while (cursor.hasNext()) {
						Document doc = cursor.next();
						String name = doc.getString("venueName");
						String location = doc.getString("location");
						System.out.println("Venue: " + name + ", Location: " + location);
					}
				}
			} catch (Exception e) {
				System.err.println("Failed to fetch venues: " + e.getMessage());
			}
		};
	}
}


//package com.event.event_management;
//
//import org.springframework.boot.SpringApplication;
//import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.data.mongodb.core.MongoTemplate;
//import org.bson.Document;
//import com.mongodb.client.MongoCollection;
//import com.mongodb.client.MongoCursor;
//
//@SpringBootApplication
//public class EventManagementApplication {
//
//	public static void main(String[] args) {
//		SpringApplication.run(EventManagementApplication.class, args);
//	}
//
//	@Bean
//	public CommandLineRunner printVenues(MongoTemplate mongoTemplate) {
//		return args -> {
//			try {
//				MongoCollection<Document> venues = mongoTemplate.getDb().getCollection("venues");
//				System.out.println("Venues in the database:");
//				try (MongoCursor<Document> cursor = venues.find().iterator()) {
//					while (cursor.hasNext()) {
//						Document doc = cursor.next();
//						String name = doc.getString("venueName");
//						String location = doc.getString("location");
//						System.out.println("Venue: " + name + ", Location: " + location);
//					}
//				}
//			} catch (Exception e) {
//				System.err.println("Failed to fetch venues: " + e.getMessage());
//			}
//		};
//	}
//}