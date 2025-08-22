package com.event.event_management.venue.service;

import com.event.event_management.venue.model.Weather;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;

@Service
public class PredictionService {

    @Value("${weather.api.key}")
    private String apiKey;

    private final String FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={apiKey}&units=metric";

    public Weather getWeatherForDate(String city, LocalDate date) {
        RestTemplate restTemplate = new RestTemplate();
        String fullForecastJson = restTemplate.getForObject(FORECAST_API_URL, String.class, city, apiKey);

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(fullForecastJson);

            // Find the weather data for the requested date
            JsonNode listNode = root.get("list");
            for (JsonNode forecastNode : listNode) {
                String dtTxt = forecastNode.get("dt_txt").asText();
                LocalDate forecastDate = LocalDate.parse(dtTxt, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                if (forecastDate.isEqual(date)) {
                    // Create and populate the simplified Weather model
                    Weather weather = new Weather();
                    weather.setCity(root.get("city").get("name").asText());
                    weather.setTemperature(forecastNode.get("main").get("temp").asDouble());
                    return weather;
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error parsing weather data.", e);
        }

        // Handle the case where no forecast is found
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No forecast found for the requested date.");
    }
}