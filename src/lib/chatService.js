import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import API from "@/Configs/ApiEndpoints";

/**
 * RapiReport AI Chat Service
 * Tries backend first (chat.php); on failure falls back to client-side Gemini.
 */

const SYSTEM_PROMPT = `
You are RapiReport AI, a specialized Health Intelligence Assistant for Nepal. 
Your goal is to help users understand their medical reports and provide general health guidance.

### KEY GUIDELINES:
1. **Scope**: Only answer health, wellness, and medical report related questions. 
2. **Medical Disclaimer**: Always include a disclaimer that you are an AI and not a substitute for professional medical advice.
3. **Tone**: Helpful, empathetic, and professional.
4. **Bilingual**: Support both English and Nepali. Respond in the language used by the user.
5. **Report Analysis**: Explain medical values in simple terms based on standard ranges, but advise consulting a doctor.
6. **Side Effects**: When suggesting or explaining medicines, always include potential side effects.
7. **Restrictions**: Politely decline non-health related queries.

### DISCLAIMERS:
- EN: "Note: This is an AI-generated health insight. Please consult a qualified doctor for medical diagnosis and treatment."
- NE: "द्रष्टव्य: यो AI द्वारा उत्पन्न स्वास्थ्य जानकारी हो। कृपया चिकित्सा निदान र उपचारको लागि योग्य डाक्टरसँग परामर्श गर्नुहोस्।"
`;

const chatService = {
  /**
   * Send message: try backend first; on failure use client-side Gemini.
   */
  sendMessage: async (message, language = "en") => {
    try {
      const response = await axios.post(
        API.CHAT,
        { message, language },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
          timeout: 25000,
        },
      );
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    } catch (backendError) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const modelId = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
          const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction: SYSTEM_PROMPT,
          });
          const result = await model.generateContent(message);
          const text = result?.response?.text?.() || "";
          if (!text) throw new Error("Empty response");
          return { text: { en: text, ne: text } };
        } catch (e) {
          console.error("Chat fallback (Gemini) error:", e);
        }
      }
      throw backendError;
    }
  },
};

export default chatService;
