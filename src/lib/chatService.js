import api from "./api";

/**
 * Chat service for AI health consultation.
 */
const chatService = {
  /**
   * Send a message to the AI and get a response.
   * @param {string} message - The user's message.
   * @param {string} language - The current language ('en' or 'ne').
   * @returns {Promise<Object>} The AI response.
   */
  sendMessage: async (message, language = "en") => {
    try {
      // In a real implementation, this would call the backend API
      // The vite proxy is set up to rewrite /api to /v1
      // and target http://localhost/api

      const response = await api.post("/chat", {
        message,
        language,
      });

      return {
        text: {
          en:
            response.data?.reply?.en ||
            response.data?.reply ||
            "I am processing your request.",
          ne:
            response.data?.reply?.ne ||
            response.data?.reply ||
            "म तपाईंको अनुरोध प्रक्रिया गर्दैछु।",
        },
      };
    } catch (error) {
      console.error("Chat Service Error:", error);

      // Fallback/Simulation for development if backend is not ready
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(chatService.getMockResponse(message, language));
        }, 1500);
      });
    }
  },

  /**
   * Mock response generator for development.
   */
  getMockResponse: (message, language) => {
    const lowerMsg = message.toLowerCase();

    if (
      lowerMsg.includes("hello") ||
      lowerMsg.includes("namaste") ||
      lowerMsg.includes("hi")
    ) {
      return {
        text: {
          en: "Hello! I am your AI Health Consultant. How can I assist you with your health reports or questions today?",
          ne: "नमस्ते! म तपाईंको एआई स्वास्थ्य परामर्शदाता हुँ। आज म तपाईंलाई तपाईंको स्वास्थ्य रिपोर्ट वा प्रश्नहरूमा कसरी मद्दत गर्न सक्छु?",
        },
      };
    }

    if (lowerMsg.includes("sugar") || lowerMsg.includes("diabetes")) {
      return {
        text: {
          en: "Based on general health guidelines, if your blood sugar is high, you should monitor your carbohydrate intake and ensure regular exercise. Have you checked your latest reports?",
          ne: "सामान्य स्वास्थ्य दिशानिर्देशहरूका अनुसार, यदि तपाईंको ब्लड सुगर उच्च छ भने, तपाईंले कार्बोहाइड्रेटको मात्रा कम गर्नुपर्छ र नियमित व्यायाम गर्नुपर्छ। के तपाईंले आफ्नो पछिल्लो रिपोर्टहरू जाँच गर्नुभयो?",
        },
      };
    }

    if (lowerMsg.includes("pain") || lowerMsg.includes("headache")) {
      return {
        text: {
          en: "Persistent pain should always be evaluated by a professional. In the meantime, ensure you are well-hydrated and resting. When did the pain start?",
          ne: "लगातार दुखाइलाई सधैं विशेषज्ञले मूल्याङ्कन गर्नुपर्छ। यस बीचमा, पर्याप्त पानी पिउनुहोस् र आराम गर्नुहोस्। दुखाइ कहिले सुरु भयो?",
        },
      };
    }

    // Default response
    return {
      text: {
        en: "I've noted your question. To give you the best advice, could you provide more details or refer to a specific test from your reports?",
        ne: "मैले तपाईंको प्रश्न नोट गरें। तपाईंलाई राम्रो सल्लाह दिनको लागि, के तपाईं थप विवरण दिन सक्नुहुन्छ वा आफ्नो रिपोर्टको कुनै विशेष परीक्षण उल्लेख गर्न सक्नुहुन्छ?",
      },
    };
  },
};

export default chatService;
