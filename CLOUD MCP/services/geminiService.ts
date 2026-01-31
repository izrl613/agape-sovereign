
import { GoogleGenAI } from "@google/genai";

// Always use { apiKey: process.env.API_KEY } as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getExpertAdvice = async (query: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Cloud Architect and Zero Trust Expert. 
      The user is setting up an MCP server on Google Cloud Run with Cloudflare Zero Trust.
      Current context: ${context}
      
      User Question: ${query}`,
      config: {
        systemInstruction: "Provide concise, actionable advice for technical setup. If there's an error, explain the likely cause and fix. Always maintain a tone of absolute privacy and sovereignty.",
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    // Property access is correct; .text is a getter
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I encountered an error while processing your request.";
  }
};

export const generateBrandingImage = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, high-tech, minimalist logo or conceptual artwork for a cloud AI service called: ${prompt}. Cinematic lighting, 4k, digital art style.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Iterate through parts to find inlineData as recommended for nano banana models
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
