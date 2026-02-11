import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ChatInterface = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: {
        en: "Namaste! I am RapiReport AI. How can I help you with your health today?",
        ne: "नमस्ते! म रापिरिपोर्ट एआई हुँ। तपाईंको स्वास्थ्यको बारेमा आज म कसरी सहयोग गर्न सक्छु?",
      },
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = { role: "user", text: { en: inputValue, ne: inputValue } };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const botMsg = {
        role: "bot",
        text: {
          en: "I've noted your question. As your AI health assistant, I recommend consulting your reports for specific details or asking me about lifestyle tips!",
          ne: "मैले तपाईंको प्रश्न नोट गरें। तपाईंको एआई सहयोगीको रूपमा, म विशेष विवरणहरूको लागि आफ्नो रिपोर्टहरू हेर्न वा मलाई जीवनशैलीका सुझावहरूको बारेमा सोध्न सिफारिस गर्दछु।",
        },
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-primary-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black">RapiReport AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase opacity-80">
                      Online Health Support
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-end gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === "user"
                        ? "bg-primary-100 text-primary-600"
                        : "bg-white border border-gray-100 text-gray-400 shadow-sm",
                    )}>
                    {msg.role === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "bg-primary-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none",
                    )}>
                    {i18n.language === "ne" ? msg.text.ne : msg.text.en}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-grow bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-100"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                <Send className="w-5 h-5" />
              </button>
            </div>
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
