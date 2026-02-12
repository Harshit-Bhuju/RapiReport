/**
 * ConsultationCallManager.jsx
 * 
 * Global call overlay — mirrors Family.jsx call UI exactly.
 * Uses the same Modal component with size="full" and hideHeader={true}.
 */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useConsultationStore } from "@/store/consultationStore";
import API from "@/Configs/ApiEndpoints";
import { useConsultationCall } from "@/hooks/useConsultationCall";
import {
    Video, VideoOff, Mic, MicOff, Phone, User,
    Maximize2, Minimize2, Users
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const ConsultationCallManager = () => {
    const { user, isAuthenticated } = useAuthStore();
    const { activeCall, setActiveCall } = useConsultationStore();
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isCallMinimized, setIsCallMinimized] = useState(false);

    const {
        callInfo,
        setCallInfo,
        isInCall,
        status,
        localVideoRef,
        remoteVideoRef,
        localStreamRef,
        remoteStreamRef,
        isCameraOn,
        setIsCameraOn,
        isMicOn,
        setIsMicOn,
        startCall,
        acceptCall,
        endCall,
        signalPollIntervalRef,
        startIncomingRingtone,
        stopIncomingRingtone,
        stopRingtones,
        incomingAudioRef,
        outgoingAudioRef,
    } = useConsultationCall();

    // Initialize audio elements on mount
    useEffect(() => {
        if (typeof Audio !== "undefined") {
            incomingAudioRef.current = new Audio("/sounds/family_incoming.mp3");
            outgoingAudioRef.current = new Audio("/sounds/family_outgoing.mp3");
            if (incomingAudioRef.current) incomingAudioRef.current.loop = true;
            if (outgoingAudioRef.current) outgoingAudioRef.current.loop = true;
        }
        return () => {
            if (incomingAudioRef.current) {
                incomingAudioRef.current.pause();
                incomingAudioRef.current = null;
            }
            if (outgoingAudioRef.current) {
                outgoingAudioRef.current.pause();
                outgoingAudioRef.current = null;
            }
        };
    }, []);

    // Re-attach streams when layout changes (mirrors Family)
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
    }, [isCallMinimized, isCallModalOpen, isInCall, isCameraOn, callInfo]);

    // Poll for incoming calls (mirrors Family incoming poll)
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const pollIncoming = async () => {
            try {
                const res = await axios.get(API.CONSULTATION_CALL_INCOMING, { withCredentials: true });
                if (res.data?.status !== "success") return;
                const calls = res.data.calls || [];

                // Check if current ringing call was cancelled
                // Skip if we already accepted (signalPollIntervalRef is active)
                if (
                    callInfo &&
                    !isInCall &&
                    !callInfo.isCaller &&
                    !signalPollIntervalRef.current
                ) {
                    const stillActive = calls.find(c => c.call_id === callInfo.callId);
                    if (!stillActive) {
                        toast("Call missed");
                        handleEndCall();
                        return;
                    }
                }

                if (!calls.length || callInfo) return;

                const call = calls[0];
                setCallInfo({
                    appointment: call,
                    roomId: call.room_id,
                    callId: call.call_id,
                    isCaller: false,
                });
                setIsCallModalOpen(true);
                setIsCallMinimized(false);

                startIncomingRingtone();
                const callerName = user.role === 'doctor' ? call.patient_name : call.doctor_name;
                toast.success(`Incoming call from ${callerName}`);
            } catch (err) {
                console.error("Poll incoming error", err);
            }
        };

        const interval = setInterval(pollIncoming, 3000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user, callInfo, isInCall]);

    // Handle "Initiate Call" from DoctorAppointments via Store
    useEffect(() => {
        if (activeCall && !callInfo && activeCall.status === 'initiate') {
            handleStartCall(activeCall.appointment);
            setActiveCall({ ...activeCall, status: 'calling' });
        }
    }, [activeCall, callInfo]);

    // ── Start call (doctor initiates) ──
    const handleStartCall = async (appointment) => {
        try {
            setIsCameraOn(true);
            setIsMicOn(true);
            await startCall(appointment);
            setIsCallModalOpen(true);
            setIsCallMinimized(false);
        } catch (err) {
            console.error("Start call error", err);
        }
    };

    // ── Accept incoming ──
    const handleAcceptIncoming = async () => {
        if (!callInfo?.callId || !callInfo?.roomId) return;
        stopRingtones();
        try {
            setIsCameraOn(true);
            setIsMicOn(true);
            await acceptCall(callInfo.appointment);
            setIsCallMinimized(false);
        } catch (err) {
            console.error("Accept call error", err);
        }
    };

    // ── Decline incoming ──
    const handleDeclineIncoming = async () => {
        if (!callInfo?.callId) {
            setIsCallModalOpen(false);
            setCallInfo(null);
            return;
        }
        stopRingtones();
        try {
            await axios.post(
                API.CONSULTATION_STATUS,
                { roomId: callInfo.roomId, action: "reject" },
                { withCredentials: true }
            );
        } catch (e) {
            console.error("Error declining call", e);
        } finally {
            setIsCallModalOpen(false);
            setCallInfo(null);
        }
    };

    // ── End call ──
    const handleEndCall = async () => {
        stopRingtones();
        await endCall(true);
        setIsCallModalOpen(false);
        setIsCallMinimized(false);
    };

    // ── Toggle controls ──
    const toggleCamera = () => {
        if (localStreamRef.current) {
            const enabled = !isCameraOn;
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = enabled);
            setIsCameraOn(enabled);
        }
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            const enabled = !isMicOn;
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = enabled);
            setIsMicOn(enabled);
        }
    };

    // ── Display helpers ──
    const getOtherPartyName = () => {
        if (!callInfo?.appointment) return "Unknown";
        if (user.role === 'doctor') return callInfo.appointment.patient_name || "Patient";

        const name = callInfo.appointment.doctor_name || "Doctor";
        if (name !== "Doctor" && !name.toLowerCase().startsWith("dr.") && !name.toLowerCase().startsWith("dr ")) {
            return `Dr. ${name}`;
        }
        return name;
    };

    const getOtherPartyAvatar = () => {
        if (!callInfo?.appointment) return null;
        if (user.role === 'doctor') return callInfo.appointment.patient_avatar || callInfo.appointment.patient_profile_pic;
        return callInfo.appointment.doctor_avatar || callInfo.appointment.doctor_profile_pic;
    };

    if (!callInfo) return null;

    return (
        <>
            {/* ═══════ Call Modal — mirrors Family.jsx exactly ═══════ */}
            <Modal
                isOpen={isCallModalOpen}
                onClose={() => handleEndCall()}
                title=""
                hideHeader={true}
                size="full"
            >
                <div
                    className="relative w-full bg-gray-900 overflow-hidden flex flex-col justify-center"
                    style={{ minHeight: "80vh", height: "100%" }}
                >
                    {/* Remote video full-screen background */}
                    <div className="absolute inset-0 z-0">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Profile/Status content (when NOT connected — Ringing/Calling) */}
                    {!isInCall && callInfo && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
                            {/* Avatar with ping animation */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20 filter blur-xl scale-150" />
                                <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-primary-400 to-purple-600 shadow-2xl relative z-10">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-900 bg-gray-800 flex items-center justify-center">
                                        {getOtherPartyAvatar() ? (
                                            <img
                                                src={getOtherPartyAvatar()}
                                                alt={getOtherPartyName()}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Users className="w-16 h-16 text-gray-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Name + Status */}
                            <div className="text-center space-y-2">
                                <h3 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
                                    {getOtherPartyName()}
                                </h3>
                                <p className="text-xl font-medium text-primary-200 animate-pulse">
                                    {callInfo.isCaller ? "Calling..." : "Incoming Video Call..."}
                                </p>
                            </div>

                            {/* Incoming Call Actions (patient side) */}
                            {!callInfo.isCaller && (
                                <div className="flex items-center gap-12 mt-12">
                                    <button
                                        onClick={handleDeclineIncoming}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-red-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300">
                                            <Phone className="w-8 h-8 rotate-[135deg]" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                            Decline
                                        </span>
                                    </button>

                                    <button
                                        onClick={handleAcceptIncoming}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300 animate-bounce">
                                            <Phone className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                            Accept
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Caller Actions (Cancel) */}
                            {callInfo.isCaller && (
                                <div className="mt-12">
                                    <button
                                        onClick={() => handleEndCall()}
                                        className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                                    >
                                        <Phone className="w-8 h-8 rotate-[135deg]" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Local Video Preview — always mounted so ref stays attached */}
                    {isInCall && (
                        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-24 sm:w-32 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 bg-black transition-all hover:scale-105 hover:border-primary-500/50">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{
                                    transform: "scaleX(-1)",
                                    display: isCameraOn ? "block" : "none",
                                }}
                            />
                            {!isCameraOn && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <VideoOff className="w-8 h-8 text-gray-500" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* In-Call Controls Bar */}
                    {isInCall && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="flex items-center gap-6 px-8 py-4 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                                {/* Mic */}
                                <button
                                    onClick={toggleMic}
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                                        isMicOn
                                            ? "bg-white/10 hover:bg-white/20 text-white"
                                            : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                                    )}
                                >
                                    {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                </button>

                                {/* Camera */}
                                <button
                                    onClick={toggleCamera}
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                                        isCameraOn
                                            ? "bg-white/10 hover:bg-white/20 text-white"
                                            : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                                    )}
                                >
                                    {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                                </button>

                                {/* End Call */}
                                <button
                                    onClick={() => handleEndCall()}
                                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-110 transition-all duration-200 ml-4"
                                >
                                    <Phone className="w-8 h-8 rotate-[135deg]" />
                                </button>

                                {/* Minimize */}
                                <button
                                    onClick={() => {
                                        setIsCallModalOpen(false);
                                        setIsCallMinimized(true);
                                    }}
                                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 ml-2"
                                    title="Minimize Call"
                                >
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ═══════ Minimized PIP overlay — mirrors Family.jsx exactly ═══════ */}
            {isInCall && isCallMinimized && callInfo && (
                <div className="fixed bottom-4 right-4 z-40 w-64 h-40 bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="relative flex-1">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isCameraOn ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-20 h-14 object-cover absolute bottom-2 right-2 rounded-lg border border-white/40"
                                style={{ transform: "scaleX(-1)" }}
                            />
                        ) : (
                            <div className="w-20 h-14 absolute bottom-2 right-2 rounded-lg border border-white/40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <VideoOff className="w-5 h-5 text-white/80" />
                            </div>
                        )}
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1">
                        <button
                            onClick={() => {
                                setIsCallMinimized(false);
                                setIsCallModalOpen(true);
                            }}
                            className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                            title="Expand"
                        >
                            <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => handleEndCall()}
                            className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            title="Hang up"
                        >
                            <Phone className="w-3 h-3 rotate-[135deg]" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConsultationCallManager;
