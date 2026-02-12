import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiKey = rawApiKey ? rawApiKey.trim() : null;

if (!apiKey) {
  console.error("CRITICAL: VITE_GEMINI_API_KEY is missing or empty in .env!");
} else {
  console.log(
    "Gemini API: Key found (starts with: " + apiKey.substring(0, 5) + ")",
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
You are RapiReport AI, a specialized Health Intelligence Assistant for Nepal. 
Your goal is to help users understand their medical reports and provide general health guidance.

### KEY GUIDELINES:
1. **Scope**: Only answer health, wellness, and medical report related questions. 
2. **Medical Disclaimer**: Always include a disclaimer that you are an AI and not a substitute for professional medical advice.
3. **Tone**: Helpful, empathetic, and professional.
4. **Bilingual**: You must support both English and Nepali. If a user asks in Nepali, reply in Nepali. If in English, reply in English.
5. **Report Analysis**: If users mention specific values (like Hemoglobin, Sugar, etc.), explain them in simple terms (e.g., "High", "Normal", "Low") based on standard ranges, but advise consulting a doctor.
6. **Restrictions**: If the user asks about unrelated topics (politics, entertainment, code, etc.), politely decline and steer the conversation back to health.

### EXAMPLE DISCLAIMER (EN): "Note: This is an AI-generated health insight. Please consult a qualified doctor for medical diagnosis and treatment."
### EXAMPLE DISCLAIMER (NE): "द्रष्टव्य: यो AI द्वारा उत्पन्न स्वास्थ्य जानकारी हो। कृपया चिकित्सा निदान र उपचारको लागि योग्य डाक्टरसँग परामर्श गर्नुहोस्।"
`;

/**
 * Chat service for Gemini AI health consultation.
 */
const chatService = {
  /**
   * Send a message to the Gemini AI and get a response.
   * @param {string} message - The user's message.
   * @param {string} language - The current language ('en' or 'ne').
   * @returns {Promise<Object>} The AI response.
   */
  sendMessage: async (message, language = "en") => {
    try {
      console.log("RapiReport AI: Initializing model gemini-1.5-flash...");

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      // Direct generateContent is often more reliable than chat sessions for initial tests
      const result = await model.generateContent(message);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error("Empty response from Gemini AI.");
      }

      return {
        text: {
          en: responseText,
          ne: responseText,
        },
      };
    } catch (error) {
      console.error("Gemini AI Full Error Object:", error);

      let errorMessage = error.message || "Unknown AI connection error.";

      // Handle the specific 404 error with a detailed troubleshooting guide
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        errorMessage = `
AI Connection Error (404): The model 'gemini-1.5-flash' was not found. 

Possible fixes:
1. Ensure your API Key is from Google AI Studio (not Vertex AI).
2. Check if your region supports Gemini 1.5 Flash.
3. Refresh the page or restart your 'npm run dev' to ensure the .env is loaded correctly.
4. Verify your API Key has no IP restrictions.
        `.trim();
      }

      throw new Error(errorMessage);
    }
  },
};

export default chatService;
