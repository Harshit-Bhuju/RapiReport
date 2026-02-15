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
import { Phone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import WebRTCCallUI from "@/components/ui/WebRTCCallUI";
import { toast } from "react-hot-toast";

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

    // Map callInfo to WebRTCCallUI format (consultation uses appointment, family uses member)
    const uiCallInfo = {
        ...callInfo,
        member: callInfo.member || {
            username: getOtherPartyName(),
            profile_picture: getOtherPartyAvatar(),
        },
        appointment: callInfo.appointment,
    };

    return (
        <>
            <Modal
                isOpen={isCallModalOpen}
                onClose={() => handleEndCall()}
                title=""
                hideHeader={true}
                size="full"
            >
                <WebRTCCallUI
                    localVideoRef={localVideoRef}
                    remoteVideoRef={remoteVideoRef}
                    localStreamRef={localStreamRef}
                    remoteStreamRef={remoteStreamRef}
                    isInCall={isInCall}
                    isCameraOn={isCameraOn}
                    isMicOn={isMicOn}
                    callInfo={uiCallInfo}
                    status={status}
                    mode="consultation"
                    onAccept={handleAcceptIncoming}
                    onDecline={handleDeclineIncoming}
                    onEnd={handleEndCall}
                    onToggleCamera={toggleCamera}
                    onToggleMic={toggleMic}
                    onMinimize={() => {
                        setIsCallModalOpen(false);
                        setIsCallMinimized(true);
                    }}
                    showConnectionStatus={true}
                />
            </Modal>

            {isInCall && isCallMinimized && callInfo && (
                <WebRTCCallUI
                    localVideoRef={localVideoRef}
                    remoteVideoRef={remoteVideoRef}
                    localStreamRef={localStreamRef}
                    remoteStreamRef={remoteStreamRef}
                    isInCall={isInCall}
                    isCameraOn={isCameraOn}
                    isMicOn={isMicOn}
                    callInfo={uiCallInfo}
                    mode="consultation"
                    isMinimized={true}
                    onEnd={handleEndCall}
                    onExpand={() => {
                        setIsCallMinimized(false);
                        setIsCallModalOpen(true);
                    }}
                />
            )}
        </>
    );
};

export default ConsultationCallManager;
