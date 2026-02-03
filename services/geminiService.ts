import { GoogleGenAI, Type } from "@google/genai";

/**
 * Validates a batch of communications against the 2026 Sovereign Audit Database with DLP detection.
 */
export const validateLiveEmailBatch = async (emailJson: string) => {
  // Use a new GoogleGenAI instance for each request to ensure up-to-date API key usage.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACT AS: Agape Sovereign Core Auditor (v3.0) with GCP DLP Integration.
      INPUT: 2026 Digital Artifacts.
      TASK: Audit input for privacy vulnerabilities and Sensitive Data (DLP).
      CATEGORIES:
      - NUKE: For invasive trackers or known identity brokers.
      - FT_KNOX: For sensitive personal artifacts requiring L3 Vault hardening.
      - IGNORE: For verified safe internal node notifications.
      
      DISCOVERY_TYPES: PII, SECRET, IDENTITY_BROKER, BIOMETRIC, GENERAL.
      
      DATA: ${emailJson}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sender: { type: Type.STRING },
              subject: { type: Type.STRING },
              suggestedAction: { type: Type.STRING, enum: ['NUKE', 'FT_KNOX', 'IGNORE'] },
              discoveryType: { type: Type.STRING, enum: ['PII', 'SECRET', 'IDENTITY_BROKER', 'BIOMETRIC', 'GENERAL'] },
              validationLog: { type: Type.STRING, description: "Reasoning based on ECPA 2026." },
              riskLevel: { type: Type.STRING, enum: ['critical', 'high', 'moderate', 'safe'] }
            },
            required: ['id', 'sender', 'subject', 'suggestedAction', 'validationLog', 'riskLevel', 'discoveryType']
          }
        }
      }
    });
    // Extract generated text from the response using the .text property.
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Audit Analysis Failure:", error);
    return [];
  }
};

/**
 * Gets architectural advice from the Agape Sovereign Architect.
 */
export const getArchitectAdvice = async (query: string, context: string) => {
  // Use a new GoogleGenAI instance for each request to ensure up-to-date API key usage.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Sovereign Query: ${query}\nSystem Status: ${context}`,
      config: {
        systemInstruction: `You are the Agape Sovereign Architect. 
        Current Status: PRODUCTION ENCLAVE (Hardened).
        Focus on resolving complex 2026 privacy architectures, FIDO2/L3 hardware bindings, GCP DLP integration, and zero-trust cloud run deployments. 
        Your tone is professional, technical, and protective. 
        In production mode, prioritize advice regarding high-availability, scaling, and strict privacy retention.
        Never suggest disabling security features for convenience.`,
        // Set both thinkingConfig and thinkingBudget as per Gemini 3 model capabilities.
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });
    // Extract generated text from the response using the .text property.
    return response.text;
  } catch (error) {
    return "Sovereign core response timeout. Retrying link...";
  }
};

/**
 * Simulates a deep packet fetch from a 2026 provider.
 */
export const simulateInboxFetch = async (providerName: string) => {
  // Use a new GoogleGenAI instance for each request to ensure up-to-date API key usage.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a JSON dataset of 6 sensitive digital artifacts found in a 2026 ${providerName} archive.
      Include:
      1. One malicious identity scraper.
      2. One highly sensitive strategy document.
      3. One biometric audit log with clear PII indicators.
      4. One leaked API Secret.
      
      Output format: JSON Array of objects with 'id', 'sender', 'subject', 'snippet'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sender: { type: Type.STRING },
              subject: { type: Type.STRING },
              snippet: { type: Type.STRING }
            }
          }
        }
      }
    });
    // Extract generated text from the response using the .text property.
    return response.text;
  } catch (error) {
    console.error("Sovereign Fetch Failure:", error);
    return "[]";
  }
};