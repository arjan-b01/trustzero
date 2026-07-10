package com.escrow.engine.dispute.service;

import com.escrow.engine.arbitration.client.VisionAnalyzer;
import com.escrow.engine.common.exception.ResourceNotFoundException;
import com.escrow.engine.dispute.entity.Evidence;
import com.escrow.engine.dispute.repository.EvidenceRepository;
import com.escrow.engine.escrow.entity.EscrowTransaction;
import com.escrow.engine.escrow.repository.EscrowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final EscrowRepository escrowRepository;
    private final VisionAnalyzer visionAnalyzer;

    @Value("${evidence.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public Evidence uploadEvidence(Long escrowId, String party, MultipartFile file, String context) {
        // Verify escrow exists
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow not found"));

        // Validate party
        if (!"BUYER".equals(party) && !"SELLER".equals(party)) {
            throw new IllegalArgumentException("Party must be BUYER or SELLER");
        }

        // Validate file type
        String contentType = file.getContentType();
        boolean isImage = contentType != null && contentType.startsWith("image/");
        boolean isVideo = contentType != null && contentType.startsWith("video/");
        if (!isImage && !isVideo) {
            throw new IllegalArgumentException("Only image and video files are supported. Got: " + contentType);
        }

        try {
            // Create upload directory if it doesn't exist (use ABSOLUTE path)
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String storedFilename = UUID.randomUUID() + extension;

            // Save file — use InputStream approach (more reliable across OSes)
            Path filePath = uploadPath.resolve(storedFilename);
            try (java.io.InputStream in = file.getInputStream()) {
                Files.copy(in, filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            String fileUrl = "/api/evidence/files/" + storedFilename;

            // Analyze image with VLM
            String vlmAnalysis;
            String analysisStatus;
            if (isImage) {
                log.info("Analyzing evidence image with VLM for escrow {}", escrowId);
                byte[] imageBytes = file.getBytes();
                vlmAnalysis = visionAnalyzer.analyzeImage(imageBytes, contentType, context);
                analysisStatus = vlmAnalysis.startsWith("VISION_ANALYSIS_FAILED")
                        ? "FAILED" : "ANALYZED";
            } else {
                log.info("Skipping VLM analysis for video evidence in escrow {}", escrowId);
                vlmAnalysis = "Video file uploaded. VLM visual analysis is only supported for image formats.";
                analysisStatus = "ANALYZED";
            }

            // Save evidence record
            Evidence evidence = Evidence.builder()
                    .escrow(escrow)
                    .party(party)
                    .fileType(contentType)
                    .fileName(originalFilename != null ? originalFilename : storedFilename)
                    .fileUrl(fileUrl)
                    .vlmAnalysis(vlmAnalysis)
                    .analysisStatus(analysisStatus)
                    .description(context)
                    .build();

            Evidence saved = evidenceRepository.save(evidence);
            log.info("Evidence uploaded: id={}, escrow={}, party={}, status={}",
                    saved.getId(), escrowId, party, analysisStatus);

            return saved;

        } catch (IOException e) {
            log.error("Failed to store uploaded file", e);
            throw new RuntimeException("Failed to store uploaded file: " + e.getMessage(), e);
        }
    }

    public List<Evidence> getEvidenceForEscrow(Long escrowId) {
        return evidenceRepository.findByEscrowIdOrderByUploadedAtAsc(escrowId);
    }

    public List<Evidence> getEvidenceForParty(Long escrowId, String party) {
        return evidenceRepository.findByEscrowIdAndPartyOrderByUploadedAtAsc(escrowId, party);
    }

    public Path getFilePath(String filename) {
        return Paths.get(uploadDir).toAbsolutePath().resolve(filename).normalize();
    }
}