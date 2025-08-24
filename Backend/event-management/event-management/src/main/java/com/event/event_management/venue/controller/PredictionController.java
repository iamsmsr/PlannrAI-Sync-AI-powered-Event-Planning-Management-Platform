package com.event.event_management.venue.controller;

import com.event.event_management.venue.model.Weather;
import com.event.event_management.venue.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/prediction")
public class PredictionController {

    private final PredictionService predictionService;

    @Autowired
    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    // Endpoint for weather prediction
    @GetMapping("/weather/{city}/{date}")
    public Weather getWeatherByDate(@PathVariable String city, @PathVariable LocalDate date) {
        return predictionService.getWeatherForDate(city, date);
    }


    }
