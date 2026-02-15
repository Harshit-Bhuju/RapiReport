import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageSquare, Send, X, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import API from "@/Configs/ApiEndpoints";
import { useAuthStore } from "@/store/authStore";

const DirectChat = ({
  recipientId,
  recipientName,
  recipientAvatar,
  appointmentId,
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const pollInterval = useRef(null);

  const CHAT_ENDPOINT = API.CONSULTATION_CHAT;
  const currentUserId = user?.id;

  const fetchMessages = async (isInitial = false) => {
    if (!recipientId && !appointmentId) return;
    try {
      if (isInitial) setLoading(true);
      const params = appointmentId
        ? { appointment_id: appointmentId }
        : { user_id: recipientId };
      const res = await axios.get(CHAT_ENDPOINT, {
        params,
        withCredentials: true,
      });
      if (res.data.status === "success") {
        setMessages(res.data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
      if (isInitial) toast.error("Failed to load messages.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (recipientId || appointmentId)) {
      fetchMessages(true);
      pollInterval.current = setInterval(() => fetchMessages(false), 3000);
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [isOpen, recipientId, appointmentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || (!recipientId && !appointmentId) || sending)
      return;
    const text = inputValue;
    setInputValue("");

    const tempMsg = {
      id: "temp-" + Date.now(),
      sender_id: currentUserId,
      message: text,
      created_at: new Date().toISOString(),
      is_me: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setSending(true);

    const payload = { message: text };
    if (appointmentId && recipientId) {
      payload.appointment_id = appointmentId;
      payload.recipient_id = recipientId;
    } else if (recipientId) {
      payload.recipient_id = recipientId;
    } else {
      setSending(false);
      return;
    }

    try {
      await axios.post(CHAT_ENDPOINT, payload, { withCredentials: true });
      fetchMessages(false);
    } catch (error) {
      console.error("Failed to send", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInputValue(text);
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-[400px] h-[600px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/30 shadow-inner">
                {recipientAvatar ? (
                  <img
                    src={recipientAvatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-black text-base tracking-tight">
                  {recipientName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                    Clinical Consultation
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all relative z-10 active:scale-95">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-gray-50/50 to-white scrollbar-hide"
            ref={scrollRef}>
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Initializing Secure Chat...
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-500 opacity-40" />
                </div>
                <h4 className="text-gray-900 font-black text-lg mb-1">
                  Say Hello!
                </h4>
                <p className="text-gray-500 text-sm font-medium">
                  Start your secure conversation with{" "}
                  {recipientName?.split(" ")[0] || "the doctor"}.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const time = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: idx === messages.length - 1 ? 0 : 0,
                    }}
                    key={msg.id}
                    className={cn(
                      "flex w-full mt-2",
                      msg.is_me ? "justify-end" : "justify-start",
                    )}>
                    <div
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.is_me ? "items-end" : "items-start",
                      )}>
                      <div
                        className={cn(
                          "px-5 py-3.5 rounded-2xl text-[1.05rem] font-medium leading-relaxed shadow-sm",
                          msg.is_me
                            ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-none shadow-primary-100"
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-gray-100",
                        )}>
                        <p>{msg.message}</p>
                      </div>
                      {time && (
                        <span className="text-[10px] font-black text-gray-400 mt-1.5 uppercase tracking-wider">
                          {time}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="p-5 bg-white border-t border-gray-50">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  className="w-full bg-gray-50 border-transparent border-2 focus:border-primary-100 focus:bg-white rounded-2xl px-5 py-3.5 text-base font-medium transition-all outline-none disabled:opacity-70 placeholder:text-gray-400 placeholder:font-bold"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                {sending ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Send className="w-7 h-7" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
              <Sparkles className="w-3 h-3" />
              Secure End-to-End
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DirectChat;
