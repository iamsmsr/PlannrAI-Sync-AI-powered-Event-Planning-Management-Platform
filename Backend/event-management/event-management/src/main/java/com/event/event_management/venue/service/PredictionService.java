package com.event.event_management.venue.service;

import com.event.event_management.venue.model.Weather;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PredictionService {

    @Value("${weather.api.key}")
    private String weatherApiKey;

    @Value("${osrm.api.baseurl}")
    private String osrmApiBaseUrl;

    private final String FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={apiKey}&units=metric";

    private final RestTemplate restTemplate;
    private final WebClient webClient;

    @Autowired
    public PredictionService(RestTemplate restTemplate, WebClient.Builder webClientBuilder) {
        this.restTemplate = restTemplate;
        this.webClient = webClientBuilder.baseUrl(osrmApiBaseUrl).build();
    }

    // Existing weather prediction method
    public Weather getWeatherForDate(String city, LocalDate date) {
        String fullForecastJson = restTemplate.getForObject(FORECAST_API_URL, String.class, city, weatherApiKey);

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(fullForecastJson);

            JsonNode listNode = root.get("list");
            for (JsonNode forecastNode : listNode) {
                String dtTxt = forecastNode.get("dt_txt").asText();
                LocalDate forecastDate = LocalDate.parse(dtTxt, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                if (forecastDate.isEqual(date)) {
                    Weather weather = new Weather();
                    weather.setCity(root.get("city").get("name").asText());
                    weather.setTemperature(forecastNode.get("main").get("temp").asDouble());
                    return weather;
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error parsing weather data.", e);
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No forecast found for the requested date.");
    }
}