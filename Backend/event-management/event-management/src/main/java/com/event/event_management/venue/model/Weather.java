package com.event.event_management.venue.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Weather {

    private String city;
    private double temperature;

    @JsonProperty("main")
    private WeatherMain main;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WeatherMain {
        private double temp;
    }
}