import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Send, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import API from "@/Configs/ApiEndpoints";
import { useAuthStore } from "@/store/authStore";

const DirectChat = ({ recipientId, recipientName, recipientAvatar, isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const pollInterval = useRef(null);

    // Hardcoded endpoint for now or added to API config
    const CHAT_ENDPOINT = `${API.BASE_URL}/api/consultants/consultation_chat.php`;

    const fetchMessages = async () => {
        if (!recipientId) return;
        try {
            const res = await axios.get(`${CHAT_ENDPOINT}?user_id=${recipientId}`, {
                withCredentials: true,
            });
            if (res.data.status === "success") {
                setMessages(res.data.messages);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    useEffect(() => {
        if (isOpen && recipientId) {
            fetchMessages();
            pollInterval.current = setInterval(fetchMessages, 3000); // Poll every 3s
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isOpen, recipientId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim() || !recipientId) return;
        const text = inputValue;
        setInputValue("");

        // Optimistic update
        const tempMsg = {
            id: "temp-" + Date.now(),
            sender_id: user.id,
            message: text,
            created_at: new Date().toISOString(),
            is_me: true
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await axios.post(CHAT_ENDPOINT, {
                recipient_id: recipientId,
                message: text
            }, { withCredentials: true });
            fetchMessages(); // Refresh to get real ID
        } catch (error) {
            console.error("Failed to send", error);
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
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 from-gray-50 to-white" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>Start conversation with {recipientName.split(" ")[0]}</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full",
                            msg.is_me ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm mb-1",
                                msg.is_me
                                    ? "bg-primary-600 text-white rounded-br-none"
                                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                            )}
                        >
                            <p>{msg.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary-100 outline-none"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default DirectChat;
