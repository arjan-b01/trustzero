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
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class VisionAnalyzer {

    @Value("${fireworks.api.key}")
    private String apiKey;

    @Value("${fireworks.api.url}")
    private String url;

    @Value("${fireworks.api.vision-model}")
    private String visionModel;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public VisionAnalyzer(ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Analyzes an image using the Fireworks vision model.
     * Returns a structured description of what the image shows.
     */
    public String analyzeImage(byte[] imageBytes, String contentType, String context) {
        try {
            // Convert image to base64 data URI
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            String dataUri = "data:" + contentType + ";base64," + base64;

            // Build the multimodal request
            // The content is an array: [image_url, text_prompt]
            Map<String, Object> requestBody = Map.of(
                    "model", visionModel,
                    "messages", List.of(
                            Map.of("role", "user", "content", List.of(
                                    Map.of("type", "image_url",
                                            "image_url", Map.of("url", dataUri)),
                                    Map.of("type", "text", "text", buildPrompt(context))
                            ))
                    ),
                    "temperature", 0.1,
                    "max_tokens", 500
            );

            String jsonRequest = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(45))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Vision API returned {}: {}", response.statusCode(), response.body());
                return "VISION_ANALYSIS_FAILED: HTTP " + response.statusCode();
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            String analysis = rootNode.path("choices").get(0)
                    .path("message").path("content").asText();

            log.info("Vision analysis complete ({} chars)", analysis.length());
            return analysis;

        } catch (Exception e) {
            log.error("Vision analysis failed", e);
            return "VISION_ANALYSIS_FAILED: " + e.getMessage();
        }
    }

    private String buildPrompt(String context) {
        return """
            You are analyzing evidence for an escrow dispute resolution system.

            Context about the dispute:
            %s

            Analyze this image and describe:
            1. What the image shows (be specific and factual)
            2. Whether it appears to be proof of delivery, product condition,
               communication, payment, or something else
            3. Any visible dates, tracking numbers, or identifying information
            4. Whether the image appears authentic or potentially manipulated

            Be objective. Do not make legal judgments — just describe what you see.
            """.formatted(context != null ? context : "No additional context provided.");
    }
}