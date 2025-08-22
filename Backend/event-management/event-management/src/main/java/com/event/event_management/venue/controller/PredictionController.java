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
@RequestMapping("/api/weather")
public class PredictionController {

    private final PredictionService weatherService;

    @Autowired
    public PredictionController(PredictionService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/{city}/{date}")
    public Weather getWeatherByDate(@PathVariable String city, @PathVariable LocalDate date) {
        return weatherService.getWeatherForDate(city, date);
    }
}