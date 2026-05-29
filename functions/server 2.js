// ============================================================
// ARCHITECT AI — CLOUD RUN SERVER WRAPPER
// Converts Firebase Cloud Functions to HTTP server for Cloud Run
// ============================================================

const express = require("express");
const cors = require("cors");

// Import the functions from index.js
const functions = require("./index.js");

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "architect-ai-functions" });
});

// DIFF Scan endpoint - accepts callable function data
app.post("/api/diff/scan", async (req, res) => {
  try {
    const result = await functions.initiateDIFFScan(req.body, {
      auth: req.body.auth || { uid: "test-user", token: { email: "test@example.com" } }
    });
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Report generation endpoint
app.post("/api/report/generate", async (req, res) => {
  try {
    const result = await functions.generateDIFFReport(req.body, {
      auth: req.body.auth || { uid: "test-user", token: { email: "test@example.com" } }
    });
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check function (GET)
app.get("/api/health", async (req, res) => {
  try {
    const result = functions.healthCheck(req, res);
    if (result && typeof result.then === "function") {
      await result;
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup trigger (POST with auth)
app.post("/api/cleanup", async (req, res) => {
  try {
    // Verify auth token if needed
    const result = functions.cleanupOldReports(req, res);
    if (result && typeof result.then === "function") {
      await result;
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Architect AI Functions server running on port ${PORT}`);
});
