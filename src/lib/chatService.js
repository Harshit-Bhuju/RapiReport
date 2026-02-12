import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * RapiReport AI Chat Service
 * Handles health-related consultations using Google Gemini AI.
 */

const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiKey = rawApiKey ? rawApiKey.trim() : null;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
You are RapiReport AI, a specialized Health Intelligence Assistant for Nepal. 
Your goal is to help users understand their medical reports and provide general health guidance.

### KEY GUIDELINES:
1. **Scope**: Only answer health, wellness, and medical report related questions. 
2. **Medical Disclaimer**: Always include a disclaimer that you are an AI and not a substitute for professional medical advice.
3. **Tone**: Helpful, empathetic, and professional.
4. **Bilingual**: Support both English and Nepali. Respond in the language used by the user.
5. **Report Analysis**: Explain medical values in simple terms based on standard ranges, but advise consulting a doctor.
6. **Restrictions**: Politely decline non-health related queries.

### DISCLAIMERS:
- EN: "Note: This is an AI-generated health insight. Please consult a qualified doctor for medical diagnosis and treatment."
- NE: "द्रष्टव्य: यो AI द्वारा उत्पन्न स्वास्थ्य जानकारी हो। कृपया चिकित्सा निदान र उपचारको लागि योग्य डाक्टरसँग परामर्श गर्नुहोस्।"
`;

const chatService = {
  /**
   * Send a message to the Gemini AI and get a response.
   * @param {string} message - The user's message.
   * @param {string} language - The current language ('en' or 'ne').
   * @returns {Promise<Object>} The AI response.
   */
  sendMessage: async (message, language = "en") => {
    try {
      // Use a current model: gemini-2.5-flash (stable) or set VITE_GEMINI_MODEL in .env to override
      const modelId = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Received empty response from AI.");

      return {
        text: {
          en: text,
          ne: text,
        },
      };
    } catch (error) {
      console.error("Gemini AI Chat Error:", error);
      throw error;
    }
  },
};

export default chatService;
