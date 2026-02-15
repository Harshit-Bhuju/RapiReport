import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Trash2,
  Loader2,
  Plus,
  MessageCircle,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirmStore } from "@/store/confirmStore";
import { motion, AnimatePresence } from "framer-motion";
import chatService from "@/lib/chatService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "chat_sessions_v3";
const CURRENT_CHAT_KEY = "chat_current_id_v3";

const WELCOME_MSG = {
  role: "bot",
  text: {
    en: "Namaste! I am RapiReport AI. How can I help you with your health today?",
    ne: "नमस्ते! म रापिरिपोर्ट एआई हुँ। तपाईंको स्वास्थ्यको बारेमा आज म कसरी सहयोग गर्न सक्छु?",
  },
  timestamp: new Date().toISOString(),
};

const getTitle = (messages, lang = "en") => {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const txt = firstUser.text?.[lang] || firstUser.text?.en || "";
  return txt.length > 45 ? `${txt.slice(0, 45)}...` : txt || "New chat";
};

const createSession = () => ({
  id: crypto.randomUUID?.() || `chat_${Date.now()}`,
  title: "New chat",
  messages: [WELCOME_MSG],
  createdAt: new Date().toISOString(),
});

const loadSessions = () => {
  try {
    const legacy = localStorage.getItem("chat_history_v2");
    if (legacy) {
      const messages = JSON.parse(legacy);
      const session = createSession();
      session.messages = messages;
      session.title = getTitle(messages);
      localStorage.removeItem("chat_history_v2");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([session]));
      localStorage.setItem(CURRENT_CHAT_KEY, session.id);
      return { sessions: [session], currentId: session.id };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_CHAT_KEY);
    if (!raw) return null;
    const sessions = JSON.parse(raw);
    const list = sessions?.length ? sessions : [createSession()];
    const active = savedCurrentId && list.find((s) => s.id === savedCurrentId);
    return {
      sessions: list,
      currentId: active ? active.id : list[0]?.id,
    };
  } catch {
    return null;
  }
};

const saveSessions = (sessions, currentId) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  if (currentId) localStorage.setItem(CURRENT_CHAT_KEY, currentId);
};

const ChatInterface = ({
  isFullPage = false,
  initialPrescription = null,
  initialSymptom = null,
  fromSymptoms = false,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState(() => {
    const loaded = loadSessions();
    return loaded?.sessions || [createSession()];
  });
  const [currentId, setCurrentId] = useState(() => {
    const loaded = loadSessions();
    return loaded?.currentId || loaded?.sessions?.[0]?.id || null;
  });
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef(null);
  const initialPrescriptionSent = useRef(false);
  const initialSymptomSent = useRef(false);

  const currentSession =
    sessions.find((s) => s.id === currentId) || sessions[0];
  const messages = currentSession?.messages || [WELCOME_MSG];

  const persistSessions = useCallback(
    (nextSessions, nextCurrentId) => {
      const id = nextCurrentId ?? nextSessions[0]?.id ?? currentId;
      setSessions(nextSessions);
      setCurrentId(id);
      saveSessions(nextSessions, id);
    },
    [currentId],
  );

  const handleSend = useCallback(
    (customText = null) => {
      const textToSend = customText || inputValue;
      if (!textToSend.trim() || isLoading) return;

      const userMsg = {
        role: "user",
        text: { en: textToSend, ne: textToSend },
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === currentId
            ? {
                ...s,
                messages: [...s.messages, userMsg],
                title: getTitle([...s.messages, userMsg], i18n.language),
              }
            : s,
        );
        saveSessions(next, currentId);
        return next;
      });
      setInputValue("");

      setIsLoading(true);
      chatService
        .sendMessage(textToSend, i18n.language)
        .then((response) => {
          const botMsg = {
            role: "bot",
            text: response.text,
            timestamp: new Date().toISOString(),
          };
          setSessions((prev) => {
            const next = prev.map((s) =>
              s.id === currentId
                ? { ...s, messages: [...s.messages, botMsg] }
                : s,
            );
            saveSessions(next, currentId);
            return next;
          });
        })
        .catch((error) => {
          console.error("Chat Error:", error);
          const errorMsg = {
            role: "bot",
            text: {
              en:
                t("chat.error") ||
                "I'm sorry, I'm having trouble connecting. Please try again later.",
              ne:
                t("chat.error_ne") ||
                "माफ गर्नुहोस्, जडान गर्न असमर्थ। पछि प्रयास गर्नुहोस्।",
            },
            timestamp: new Date().toISOString(),
          };
          setSessions((prev) => {
            const next = prev.map((s) =>
              s.id === currentId
                ? { ...s, messages: [...s.messages, errorMsg] }
                : s,
            );
            saveSessions(next, currentId);
            return next;
          });
        })
        .finally(() => setIsLoading(false));
    },
    [inputValue, isLoading, currentId, i18n.language, t],
  );

  useEffect(() => {
    if (initialPrescription && !initialPrescriptionSent.current) {
      initialPrescriptionSent.current = true;
      let autoPrompt = "";
      if (initialPrescription.meds?.length > 0) {
        const medNames = initialPrescription.meds.map((m) => m.name).join(", ");
        autoPrompt = `I have a scanned prescription with these medicines: ${medNames}. Please provide: 1. Common brand alternatives for each (available in Nepal). 2. Estimated market prices in NPR. 3. Brief explanation of how each medicine works. 4. Known side effects. Raw prescription: ${initialPrescription.rawText}`;
      } else if (initialPrescription.rawText) {
        autoPrompt = `I have a scanned prescription: "${initialPrescription.rawText}" Please analyze and provide: medicines and uses, brand alternatives in Nepal, potential side effects, general health advice.`;
      }
      if (autoPrompt) handleSend(autoPrompt);
    }
  }, [initialPrescription, handleSend]);

  useEffect(() => {
    if (initialSymptom && !initialSymptomSent.current && !initialPrescription) {
      initialSymptomSent.current = true;
      const part = [
        `I've just logged this symptom: "${initialSymptom.text}".`,
        `Severity: ${initialSymptom.severity || "mild"}.`,
        initialSymptom.vitalsNote
          ? `Vitals/notes: ${initialSymptom.vitalsNote}.`
          : "",
        "Please ask me a few follow-up questions to better understand my condition, and advise whether I should see a doctor. If you think it could be serious, say so clearly and recommend booking a consultation.",
      ]
        .filter(Boolean)
        .join(" ");
      handleSend(part);
    }
  }, [initialSymptom, initialPrescription, handleSend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const newChat = () => {
    const session = createSession();
    const next = [session, ...sessions];
    persistSessions(next, session.id);
    setInputValue("");
  };

  const selectChat = (id) => setCurrentId(id);

  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const deleteChat = (id, e) => {
    e?.stopPropagation();
    openConfirm({
      title: t("chat.deleteChat") || "Delete this chat?",
      message:
        t("confirm.clearChat") || "This chat will be permanently removed.",
      confirmLabel: t("confirm.delete") || "Delete",
      cancelLabel: t("confirm.cancel") || "Cancel",
      variant: "danger",
      onConfirm: () => {
        const next = sessions.filter((s) => s.id !== id);
        const nextList = next.length ? next : [createSession()];
        const nextCurrent = currentId === id ? nextList[0]?.id : currentId;
        persistSessions(nextList, nextCurrent);
      },
    });
  };

  const clearCurrentChat = () => {
    openConfirm({
      title: t("confirm.clearChat") || "Clear this chat?",
      message:
        t("chat.clearHistory") || "Are you sure you want to clear this chat?",
      confirmLabel: t("confirm.clearChat") || "Clear chat",
      cancelLabel: t("confirm.cancel") || "Cancel",
      variant: "warning",
      onConfirm: () => {
        const session = createSession();
        const next = sessions.map((s) =>
          s.id === currentId ? { ...session, id: currentId } : s,
        );
        persistSessions(next, currentId);
      },
    });
  };

  const sidebar = isFullPage && (
    <div className="w-72 shrink-0 border-r border-gray-100 bg-gradient-to-b from-gray-50/80 to-white flex flex-col">
      <button
        onClick={newChat}
        className="m-4 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/60 text-gray-600 hover:text-primary-600 font-bold text-base transition-all shadow-sm hover:shadow-md">
        <Plus className="w-6 h-6" />
        {t("chat.newChat")}
      </button>
      {fromSymptoms && (
        <div className="mx-4 mb-3 p-4 rounded-2xl bg-primary-50 border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5 text-primary-600" />
            <span className="font-black text-primary-900 text-sm">
              Consider seeing a doctor
            </span>
          </div>
          <p className="text-xs text-primary-700 font-medium mb-3">
            If the AI suggests your symptoms may need professional care, book a
            consultation.
          </p>
          <button
            type="button"
            onClick={() => navigate("/consultants")}
            className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors">
            Book a doctor
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <p className="px-4 py-3 text-xs font-bold uppercase text-gray-400 tracking-wider">
          {t("chat.chatHistory")}
        </p>
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => selectChat(s.id)}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 cursor-pointer transition-all",
              s.id === currentId
                ? "bg-primary-100 text-primary-700 shadow-sm"
                : "hover:bg-gray-100 text-gray-700",
            )}>
            <MessageCircle className="w-5 h-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-base font-semibold">
              {s.title}
            </span>
            <button
              onClick={(e) => deleteChat(s.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-error-100 text-gray-400 hover:text-error-500 transition-all"
              title={t("common.delete")}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const chatContent = (
    <div
      className={cn(
        "bg-white flex overflow-hidden transition-all duration-300 flex-1 min-w-0",
        !isFullPage && "h-full",
      )}>
      {sidebar}
      <div
        className={cn(
          "bg-white flex flex-col overflow-hidden flex-1 min-w-0",
          isFullPage ? "" : "",
        )}>
        {/* Header */}
        <div
          className={cn(
            "px-5 py-4 flex items-center justify-between shrink-0 border-b border-gray-50",
            isFullPage ? "bg-white" : "bg-primary-600 text-white",
          )}>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                isFullPage
                  ? "bg-primary-50 text-primary-600"
                  : "bg-white/20 text-white",
              )}>
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3
                className={cn(
                  "text-lg font-black",
                  !isFullPage && "text-white",
                )}>
                {t("chat.title")}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-success-400 animate-pulse" />
                <span
                  className={cn(
                    "text-xs font-bold uppercase opacity-90",
                    !isFullPage && "text-white",
                  )}>
                  {t("chat.online")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFullPage && (
              <button
                onClick={newChat}
                className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                title={t("chat.newChat")}>
                <Plus className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={clearCurrentChat}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                isFullPage
                  ? "text-gray-400 hover:bg-gray-50 hover:text-error-500"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
              title={t("chat.clearHistory")}>
              <Trash2 className="w-6 h-6" />
            </button>
            {!isFullPage && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-grow overflow-y-auto px-6 py-8 space-y-8 bg-gradient-to-b from-gray-50/40 to-white">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              key={idx}
              className={cn(
                "flex items-end gap-4",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}>
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                  msg.role === "user"
                    ? "bg-primary-100 text-primary-600"
                    : "bg-white border border-gray-100 text-gray-500",
                )}>
                {msg.role === "user" ? (
                  <User className="w-6 h-6" />
                ) : (
                  <Bot className="w-6 h-6" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] px-5 py-4 rounded-[1.5rem] text-[1.1rem] font-medium leading-relaxed shadow-lg markdown-content",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-none shadow-primary-100"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-gray-100",
                )}>
                {msg.role === "user" ? (
                  <span className="text-[1.1rem]">
                    {i18n.language === "ne" ? msg.text.ne : msg.text.en}
                  </span>
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
              className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6 text-gray-400" />
              </div>
              <div className="bg-white border border-gray-100 px-6 py-4 rounded-[1.5rem] rounded-bl-none flex items-center gap-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                <span className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("chat.thinking")}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-6 bg-white border-t border-gray-100">
          <div className="relative flex gap-4">
            <input
              type="text"
              placeholder={t("chat.placeholder")}
              className="flex-grow bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 text-lg font-medium focus:bg-white focus:border-primary-100 transition-all placeholder:text-gray-400 placeholder:font-bold outline-none"
              value={inputValue}
              disabled={isLoading}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-primary-200 shrink-0 active:scale-90",
                !inputValue.trim() || isLoading
                  ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700",
              )}>
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Send className="w-8 h-8" />
              )}
            </button>
          </div>
          <p className="mt-4 text-xs text-center text-gray-400 font-semibold tracking-wide">
            {t("chat.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );

  const fullPageLayout = (
    <div
      className={cn(
        "flex overflow-hidden",
        isFullPage
          ? "w-full h-full flex-1 min-h-0"
          : "w-[440px] h-[640px] rounded-3xl shadow-2xl border border-gray-100 mb-4",
      )}>
      {chatContent}
    </div>
  );

  if (isFullPage) return fullPageLayout;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[440px] h-[640px] rounded-3xl shadow-2xl border border-gray-100 overflow-hidden bg-white">
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 duration-300",
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
