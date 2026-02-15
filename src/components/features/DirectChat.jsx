import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageSquare, Send, X, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import API from "@/Configs/ApiEndpoints";
import { useAuthStore } from "@/store/authStore";

const DirectChat = ({ recipientId, recipientName, recipientAvatar, appointmentId, isOpen, onClose }) => {
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
            const params = appointmentId ? { appointment_id: appointmentId } : { user_id: recipientId };
            const res = await axios.get(CHAT_ENDPOINT, {
                params,
                withCredentials: true
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
        if (!inputValue.trim() || (!recipientId && !appointmentId) || sending) return;
        const text = inputValue;
        setInputValue("");

        const tempMsg = {
            id: "temp-" + Date.now(),
            sender_id: currentUserId,
            message: text,
            created_at: new Date().toISOString(),
            is_me: true
        };
        setMessages(prev => [...prev, tempMsg]);
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
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            setInputValue(text);
            toast.error("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-4 bg-primary-600 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                        {recipientAvatar ? (
                            <img src={recipientAvatar} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{recipientName}</h3>
                        <span className="flex items-center gap-1.5 text-[10px] opacity-80">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            Consultation chat
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 from-gray-50 to-white" ref={scrollRef}>
                {loading && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>Start conversation with {recipientName?.split(" ")[0] || "doctor"}</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const time = msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                            : "";
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    msg.is_me ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn("flex flex-col max-w-[80%]", msg.is_me ? "items-end" : "items-start")}>
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-sm",
                                            msg.is_me
                                                ? "bg-primary-600 text-white rounded-br-none"
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                        )}
                                    >
                                        <p>{msg.message}</p>
                                    </div>
                                    {time && (
                                        <span className="text-[10px] text-gray-400 mt-0.5">{time}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary-100 outline-none disabled:opacity-70"
                    placeholder="Type a message..."
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
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default DirectChat;
