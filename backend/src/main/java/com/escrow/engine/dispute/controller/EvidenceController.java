package com.escrow.engine.dispute.controller;

import com.escrow.engine.dispute.entity.Evidence;
import com.escrow.engine.dispute.service.EvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private final EvidenceService evidenceService;

    @PostMapping("/escrow/{escrowId}/upload")
    public ResponseEntity<Evidence> uploadEvidence(
            @PathVariable Long escrowId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("party") String party,
            @RequestParam(value = "context", required = false) String context) {

        Evidence evidence = evidenceService.uploadEvidence(escrowId, party, file, context);
        return ResponseEntity.ok(evidence);
    }

    @GetMapping("/escrow/{escrowId}")
    public ResponseEntity<List<Evidence>> getEvidence(@PathVariable Long escrowId) {
        return ResponseEntity.ok(evidenceService.getEvidenceForEscrow(escrowId));
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = evidenceService.getFilePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type from filename
            String contentType = "application/octet-stream";
            if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (filename.endsWith(".webp")) {
                contentType = "image/webp";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }
}