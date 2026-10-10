import { GoogleGenAI } from '@google/genai';
import { DiffVector } from '../types';

export class ArchitectAIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      if (process.env.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      }
    } catch (err) {
      console.warn('Architect AI initialization deferred: process.env.API_KEY may not be configured.');
    }
  }

  public async askChiefOfStaff(
    question: string,
    vectors: DiffVector[],
    sovereignScore: number,
    selectedVector?: DiffVector | null
  ): Promise<string> {
    const fallbackResponse = this.generateLocalAdvisory(question, vectors, sovereignScore, selectedVector);

    if (!process.env.API_KEY) {
      return fallbackResponse;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
      
      const exposedCount = vectors.filter(v => v.status === 'EXPOSED').length;
      const knoxedCount = vectors.filter(v => v.status === 'KNOXED').length;
      const nukedCount = vectors.filter(v => v.status === 'NUKED').length;

      const contextSummary = `
USER DIGITAL IDENTITY FEDERATED FOOTPRINT (DIFF) METRICS:
- Total Identity Vectors: 16
- Sovereign Score: ${sovereignScore}%
- Status: ${exposedCount} Exposed, ${knoxedCount} Knoxed, ${nukedCount} Nuked.
- Compliance Framework: 2026 ERCA / ECRA Privacy Standard (Agape Sovereign Enclave).
- Focused Vector: ${selectedVector ? `${selectedVector.name} (Status: ${selectedVector.status}, Risk: ${selectedVector.riskLevel})` : 'Entire 16-Vector Perimeter'}
`;

      const systemInstruction = `You are the "Architect AI" Chief of Staff, a hyper-competent, privacy-intelligence and digital sovereignty advisor for the Agape Sovereign Enclave 2026.
Your duty is to guide the user to achieve 100% digital sovereignty over their Digital Identity Federated Footprint (DIFF).
You think in terms of two decisive sovereign actions:
1. NUKED: Irreversible erasure, DSAR removal from data brokers, shredding plaintext files, and revoking legacy authorizations.
2. KNOXED: Cryptographic hardening, FIDO2 passkeys, hardware enclave protection (Apple Secure Enclave/Google Titan), and zero-access AES-GCM vaults.
Reference 2026 ERCA/ECRA privacy standards, Firefox Monitor, SayMine, Jumbo, and Optery design methodologies.
Be precise, commanding, articulate, and reassuring. Do not use generic filler words. Format answers cleanly with Markdown bullet points and explicit NUKE vs KNOX recommendations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [{ text: `${contextSummary}\n\nUser Question: ${question}` }]
        },
        config: {
          systemInstruction,
          temperature: 0.6,
        }
      });

      return response.text || fallbackResponse;
    } catch (error) {
      console.error('Error invoking Gemini Chief of Staff:', error);
      return fallbackResponse;
    }
  }

  private generateLocalAdvisory(
    question: string,
    vectors: DiffVector[],
    sovereignScore: number,
    selectedVector?: DiffVector | null
  ): string {
    const target = selectedVector || vectors.find(v => v.status === 'EXPOSED') || vectors[0];
    return `### 🛡️ Architect AI | Sovereign Intelligence Advisory
**Current Sovereign Rating:** ${sovereignScore}% (Target: 100% Sovereign Enclave)
**Context:** Evaluated under the **2026 ERCA / ECRA Digital Privacy Standards**.

#### 🎯 Strategic Analysis for: **${target.name}**
* **Current Posture:** \`${target.status}\` | **Exposure Risk:** \`${target.riskLevel}\`
* **Cryptographic Fingerprint (SHA-256):** \`${target.sha256Hash.substring(0, 16)}...\`

#### Recommended Action Plan:
1. **🔥 NUKED Vector Recommendation:**
   * ${target.nukedAction}.
   * Issue automated deletion requests under GDPR Article 17 and California CCPA/CPRA regulations.

2. **🛡️ KNOXED Hardening Protocol:**
   * ${target.knoxedAction}.
   * Bind credentials to hardware-backed WebAuthn passkeys across Apple Silicon / Titan M2 enclaves.

*Your identity perimeter remains zero-access encrypted. No plaintext data leaves your local runtime.*`;
  }
}

export const architectAI = new ArchitectAIService();
