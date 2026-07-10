package com.escrow.engine.arbitration.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class VllmClient {

    @Value("${vllm.api.url}")
    private String url;

    @Value("${vllm.api.key:not-needed}")
    private String apiKey;

    @Value("${vllm.api.model}")
    private String model;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public VllmClient(ObjectMapper objectMapper) {
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
                    "temperature", 0.1,
                    "max_tokens", 800
            );

            String jsonRequest = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("vLLM API returned {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("vLLM API error (HTTP " + response.statusCode() + ")");
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            return rootNode.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("vLLM call failed", e);
            throw new RuntimeException("vLLM provider unavailable: " + e.getMessage(), e);
        }
    }
}