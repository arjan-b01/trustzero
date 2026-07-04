package com.escrow.engine.arbitration.client;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class FireworksClient {

    @Value("${fireworks.api.key}")
    private String apiKey;

    @Value("${fireworks.api.url}")
    private String url;

    @Value("${fireworks.api.model}")
    private String model;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public FireworksClient(ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    public String call(String systemPrompt, String userMessage) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userMessage)
                    ),
                    "temperature", 0.1
            );

            String jsonRequest = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
                    .timeout(Duration.ofSeconds(45))
                    .header("Accept", "application/json")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Fireworks API error: " + response.body());
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            return rootNode.path("choices").get(0).path("message").path("content").asText();

        }catch (Exception e) {
            System.out.println("API URL = " + url);
            e.printStackTrace();
            throw new RuntimeException("Failed to execute LLM request: " + e.getMessage(), e);
        }
    }
}