import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { jsPDF } from "jspdf";
import * as crypto from "crypto";
import { logger } from "firebase-functions/v2";

// Define the secret that holds the build manifest or the hash itself
const buildManifestSecret = defineSecret("BUILD_MANIFEST_SECRET");
const projectIdParam = defineString("PROJECT_ID", { default: "agape-sovereign" });
const versionNumberParam = defineString("VERSION_NUMBER", { default: "1.0.0" });

/**
 * Cloud Function to generate Privacy Policy or Terms of Service PDFs
 * with an embedded, verifiable SHA256 Identity Hash.
 */
export const generatePolicyDocument = onRequest(
  {
    secrets: [buildManifestSecret],
    cors: true,
  },
  async (req, res) => {
    try {
      const docType = req.query.type as string;
      
      if (!docType || !["privacy", "terms"].includes(docType)) {
        res.status(400).send("Invalid document type. Must be 'privacy' or 'terms'.");
        return;
      }

      // Retrieve the secret manifest from Secret Manager
      const buildManifest = buildManifestSecret.value();
      const projectId = projectIdParam.value();
      const versionNumber = versionNumberParam.value();

      // Compute the deterministic SHA256 ID Hash
      const dataToHash = `${projectId}:${versionNumber}:${buildManifest}`;
      const sha256Id = crypto.createHash("sha256").update(dataToHash).digest("hex");

      // Initialize jsPDF
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      const title = docType === "privacy" ? "Privacy Policy" : "Terms of Service";
      doc.text(`AGAPE SOVEREIGN: ${title}`, 20, 20);
      
      // Body Content
      doc.setFontSize(12);
      doc.text("This document is dynamically generated and cryptographically verifiable.", 20, 40);
      doc.text("All rights reserved.", 20, 50);
      // Add actual policy content here in a real implementation
      
      // Footer with SHA256 ID
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("DATA PROVENANCE SECURE IDENTITY ANCHOR", 20, pageHeight - 20);
      doc.text(`SHA256: ${sha256Id}`, 20, pageHeight - 15);

      // Convert to PDF Buffer
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      // Set response headers for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Agape_Sovereign_${title.replace(/\s+/g, "_")}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      
      logger.info(`Generated ${docType} document with SHA256 ID: ${sha256Id}`);
      
      // Send the PDF
      res.status(200).send(pdfBuffer);
    } catch (error) {
      logger.error("Error generating policy document", { error });
      res.status(500).send("Internal Server Error generating document.");
    }
  }
);
