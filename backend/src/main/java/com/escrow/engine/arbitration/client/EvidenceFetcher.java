package com.escrow.engine.arbitration.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Pattern;

@Slf4j
@Component
public class EvidenceFetcher {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Pattern to detect image URLs by extension
    private static final Pattern IMAGE_PATTERN = Pattern.compile(
            ".*\\.(jpg|jpeg|png|gif|webp|bmp)$", Pattern.CASE_INSENSITIVE);

    /**
     * Fetches content from a URL. Returns a structured result describing
     * what was found. The Evidence Analyst uses this instead of the raw URL.
     */
    public FetchedEvidence fetch(String url) {
        if (url == null || url.isBlank()) {
            return FetchedEvidence.empty();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            String contentType = response.headers()
                    .firstValue("Content-Type")
                    .orElse("");

            FetchedEvidence result = new FetchedEvidence();
            result.setOriginalUrl(url);
            result.setHttpStatus(response.statusCode());
            result.setContentType(contentType);

            if (response.statusCode() != 200) {
                result.setFetchStatus("FAILED_HTTP_" + response.statusCode());
                result.setContent("Could not fetch URL (HTTP " + response.statusCode() + ")");
                return result;
            }

            if (contentType.startsWith("image/")) {
                // Image — we can't parse it as text, but we mark it for VLM analysis
                result.setFetchStatus("IMAGE_NEEDS_VLM");
                result.setContent("[Image at " + url + " — requires vision model analysis]");
            } else if (contentType.startsWith("video/")) {
                result.setFetchStatus("VIDEO_NEEDS_EXTRACTION");
                result.setContent("[Video at " + url + " — requires frame extraction]");
            } else if (contentType.contains("application/pdf")) {
                // For hackathon, just note it's a PDF. Real impl would use a PDF parser.
                result.setFetchStatus("PDF_NEEDS_PARSING");
                result.setContent("[PDF document at " + url + " — "
                        + response.body().length() + " bytes]");
            } else {
                // HTML or plain text — extract text content
                String text = extractTextFromHtml(response.body());
                // Truncate to avoid blowing up the LLM context
                if (text.length() > 3000) {
                    text = text.substring(0, 3000) + "\n... [truncated]";
                }
                result.setFetchStatus("TEXT_FETCHED");
                result.setContent(text);
            }

            return result;

        } catch (Exception e) {
            log.warn("Failed to fetch evidence URL {}: {}", url, e.getMessage());
            FetchedEvidence result = new FetchedEvidence();
            result.setOriginalUrl(url);
            result.setFetchStatus("FETCH_ERROR");
            result.setContent("Could not fetch URL: " + e.getMessage());
            return result;
        }
    }

    /**
     * Very basic HTML-to-text extraction. Strips tags, collapses whitespace.
     * Good enough for hackathon — for production use Jsoup.
     */
    private String extractTextFromHtml(String html) {
        // Remove script and style blocks entirely
        String cleaned = html.replaceAll("(?is)<script.*?</script>", " ")
                .replaceAll("(?is)<style.*?</style>", " ");
        // Remove all tags
        cleaned = cleaned.replaceAll("(?s)<[^>]+>", " ");
        // Decode common entities
        cleaned = cleaned.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"");
        // Collapse whitespace
        cleaned = cleaned.replaceAll("\\s+", " ").trim();
        return cleaned;
    }

    public static class FetchedEvidence {
        private String originalUrl;
        private String fetchStatus;   // TEXT_FETCHED, IMAGE_NEEDS_VLM, FETCH_ERROR, etc.
        private String contentType;
        private int httpStatus;
        private String content;

        public static FetchedEvidence empty() {
            FetchedEvidence e = new FetchedEvidence();
            e.setFetchStatus("NO_URL");
            e.setContent("No evidence URL provided.");
            return e;
        }

        // getters and setters
        public String getOriginalUrl() { return originalUrl; }
        public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
        public String getFetchStatus() { return fetchStatus; }
        public void setFetchStatus(String fetchStatus) { this.fetchStatus = fetchStatus; }
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public int getHttpStatus() { return httpStatus; }
        public void setHttpStatus(int httpStatus) { this.httpStatus = httpStatus; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}