import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import chatService from "@/lib/chatService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatInterface = ({ isFullPage = false, initialPrescription = null }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "bot",
            text: {
              en: "Namaste! I am RapiReport AI. How can I help you with your health today?",
              ne: "नमस्ते! म रापिरिपोर्ट एआई हुँ। तपाईंको स्वास्थ्यको बारेमा आज म कसरी सहयोग गर्न सक्छु?",
            },
            timestamp: new Date().toISOString(),
          },
        ];
  });
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef(null);

  // Fetch chat history from backend on mount
  useEffect(() => {
    const fetchHistoryAndCheckInitial = async () => {
      try {
        const history = await chatService.getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        }

        // If we have an initial prescription, trigger the AI analysis
        if (initialPrescription) {
          let autoPrompt = "";

          if (initialPrescription.meds?.length > 0) {
            const medNames = initialPrescription.meds
              .map((m) => m.name)
              .join(", ");
            autoPrompt = `I have a scanned prescription with these medicines: ${medNames}. 
            Please provide:
            1. Common brand alternatives for each (available in Nepal).
            2. Estimated market prices in NPR for these brands.
            3. A brief explanation of how each medicine works (mechanism of action).
            
            Raw prescription context: ${initialPrescription.rawText}`;
          } else if (initialPrescription.rawText) {
            autoPrompt = `I have a scanned prescription text:
            
            "${initialPrescription.rawText}"
            
            Please analyze this text and provide:
            1. Any identified medicines and their uses.
            2. Common brand alternatives in Nepal if applicable.
            3. General health advice based on this prescription text.`;
          }

          if (autoPrompt) {
            handleSend(autoPrompt);
          }
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistoryAndCheckInitial();
  }, [initialPrescription]);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      role: "user",
      text: { en: textToSend, ne: textToSend },
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(textToSend, i18n.language);
      const botMsg = {
        role: "bot",
        text: response.text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = {
        role: "bot",
        text: {
          en:
            t("chat.error") ||
            "I'm sorry, I'm having trouble connecting right now. Please try again later.",
          ne:
            t("chat.error_ne") ||
            "माफ गर्नुहोस्, म अहिले जडान गर्न असमर्थ छु। कृपया पछि फेरि प्रयास गर्नुहोस्।",
        },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm(t("chat.clearHistory"))) {
      const initialMsg = [
        {
          role: "bot",
          text: {
            en: "Namaste! I am RapiReport AI. How can I help you with your health today?",
            ne: "नमस्ते! म रापिरिपोर्ट एआई हुँ। तपाईंको स्वास्थ्यको बारेमा आज म कसरी सहयोग गर्न सक्छु?",
          },
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(initialMsg);
      localStorage.removeItem("chat_history");
    }
  };

  const chatContent = (
    <div
      className={cn(
        "bg-white flex flex-col overflow-hidden transition-all duration-300",
        isFullPage
          ? "w-full h-full"
          : "w-[400px] h-[600px] rounded-3xl shadow-2xl border border-gray-100 mb-4",
      )}>
      {/* Header */}
      <div
        className={cn(
          "p-6 flex items-center justify-between shrink-0 border-b border-gray-50",
          isFullPage ? "bg-white" : "bg-primary-600 text-white",
        )}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isFullPage
                ? "bg-primary-50 text-primary-600"
                : "bg-white/20 text-white",
            )}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className={cn("font-black", !isFullPage && "text-white")}>
              {t("chat.title")}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase opacity-80",
                  !isFullPage && "text-white",
                )}>
                {t("chat.online")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFullPage
                ? "text-gray-400 hover:bg-gray-50 hover:text-error-500"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
            title="Clear History">
            <Trash2 className="w-5 h-5" />
          </button>
          {!isFullPage && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            key={idx}
            className={cn(
              "flex items-end gap-3",
              msg.role === "user" ? "flex-row-reverse" : "flex-row",
            )}>
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                msg.role === "user"
                  ? "bg-primary-100 text-primary-600"
                  : "bg-white border border-gray-100 text-gray-400",
              )}>
              {msg.role === "user" ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm markdown-content",
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-none",
              )}>
              {msg.role === "user" ? (
                i18n.language === "ne" ? (
                  msg.text.ne
                ) : (
                  msg.text.en
                )
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {i18n.language === "ne" ? msg.text.ne : msg.text.en}
                </ReactMarkdown>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {t("chat.thinking")}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-50">
        <div className="relative flex gap-3">
          <input
            type="text"
            placeholder={t("chat.placeholder")}
            className="flex-grow bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-400"
            value={inputValue}
            disabled={isLoading}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
              !inputValue.trim() || isLoading
                ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200",
            )}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-gray-400 font-bold uppercase tracking-wider">
          {t("chat.disclaimer")}
        </p>
      </div>
    </div>
  );

  if (isFullPage) return chatContent;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}>
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 duration-300",
          isOpen ? "bg-error-500" : "bg-primary-600",
        )}>
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning-400 rounded-full border-2 border-primary-600 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-primary-900" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatInterface;
