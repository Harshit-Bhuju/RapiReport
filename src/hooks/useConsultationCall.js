/**
 * useConsultationCall.js
 * 
 * This hook mirrors the Family.jsx WebRTC implementation EXACTLY.
 * Key principals from the Family pattern:
 *  1. Caller creates peer+offer, then polls for answer signal → isInCall=true on answer
 *  2. Callee creates peer on accept, polls for offer signal → isInCall=true on offer processing
 *  3. Neither side sets isInCall=true prematurely
 *  4. Streams are re-attached on layout changes
 *  5. "end" signals are handled even when pcRef is null
 */
import { useState, useRef, useCallback } from "react";
import axios from "axios";
import API from "@/Configs/ApiEndpoints";
import { toast } from "react-hot-toast";

export const useConsultationCall = () => {
    const [callInfo, setCallInfo] = useState(null); // { appointment, roomId, callId, isCaller }
    const [isInCall, setIsInCall] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [status, setStatus] = useState("Idle");

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const signalPollIntervalRef = useRef(null);
    const lastSignalIdRef = useRef(0);
    const iceCandidateBufferRef = useRef([]);
    const isCallConnectedRef = useRef(false);

    const incomingAudioRef = useRef(null);
    const outgoingAudioRef = useRef(null);

    // ────────── Ringtone helpers (mirrors Family) ──────────
    const startIncomingRingtone = () => {
        if (incomingAudioRef.current) {
            incomingAudioRef.current.play().catch(() => { });
        }
    };

    const stopIncomingRingtone = () => {
        if (incomingAudioRef.current) {
            incomingAudioRef.current.pause();
            incomingAudioRef.current.currentTime = 0;
        }
    };

    const startOutgoingRingtone = () => {
        if (outgoingAudioRef.current) {
            outgoingAudioRef.current.play().catch(() => { });
        }
    };

    const stopOutgoingRingtone = () => {
        if (outgoingAudioRef.current) {
            outgoingAudioRef.current.pause();
            outgoingAudioRef.current.currentTime = 0;
        }
    };

    const stopRingtones = () => {
        stopIncomingRingtone();
        stopOutgoingRingtone();
    };

    // ────────── Cleanup (mirrors Family exactly) ──────────
    const cleanupMediaAndPeer = useCallback(() => {
        if (signalPollIntervalRef.current) {
            clearInterval(signalPollIntervalRef.current);
            signalPollIntervalRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.onicecandidate = null;
            pcRef.current.ontrack = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        iceCandidateBufferRef.current = [];
        isCallConnectedRef.current = false;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((t) => t.stop());
            remoteStreamRef.current = null;
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, []);

    // ────────── End call (mirrors Family exactly) ──────────
    const endCall = useCallback(async (sendStatus = true) => {
        const current = callInfo;
        stopRingtones();
        cleanupMediaAndPeer();
        setIsInCall(false);
        setCallInfo(null);
        setStatus("Idle");

        if (sendStatus && current?.callId) {
            try {
                // Update call status in DB
                await axios.post(
                    API.CONSULTATION_STATUS,
                    { roomId: current.roomId, action: "end" },
                    { withCredentials: true }
                );
                // Send "end" signal to other party (mirrors Family)
                const toUserId = current.isCaller
                    ? current.appointment.patient_user_id
                    : current.appointment.doctor_user_id;
                if (toUserId && current.roomId) {
                    await axios.post(
                        API.CONSULTATION_SIGNAL,
                        {
                            roomId: current.roomId,
                            toUserId: toUserId,
                            type: "end",
                            payload: {},
                        },
                        { withCredentials: true }
                    );
                }
            } catch (err) {
                console.error("Failed to end call", err);
            }
        }
    }, [callInfo, cleanupMediaAndPeer]);

    // ────────── Create Peer Connection (mirrors Family exactly) ──────────
    const createPeerConnection = async (toUserId, roomId) => {
        iceCandidateBufferRef.current = [];
        isCallConnectedRef.current = false;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });

        pc.onicecandidate = async (event) => {
            if (event.candidate && toUserId) {
                try {
                    await axios.post(
                        API.CONSULTATION_SIGNAL,
                        { roomId, toUserId, type: "candidate", payload: event.candidate },
                        { withCredentials: true }
                    );
                } catch (err) {
                    console.error("Failed to send ICE candidate", err);
                }
            }
        };

        // Detect peer disconnect — only AFTER connection was once established (mirrors Family)
        pc.onconnectionstatechange = () => {
            console.log("PC state:", pc.connectionState);
            if (pc.connectionState === "connected") {
                isCallConnectedRef.current = true;
            }
            if (
                isCallConnectedRef.current &&
                (pc.connectionState === "disconnected" ||
                    pc.connectionState === "failed" ||
                    pc.connectionState === "closed")
            ) {
                toast("Call ended");
                endCall(false);
            }
        };

        pc.ontrack = (event) => {
            if (!remoteStreamRef.current) {
                remoteStreamRef.current = new MediaStream();
            }
            event.streams[0].getTracks().forEach((track) => {
                remoteStreamRef.current.addTrack(track);
            });
            // Always re-attach to video element (mirrors Family)
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localStreamRef.current = stream;

            // Set initial states: video ON, mic ON (mirrors Family)
            stream.getVideoTracks().forEach((track) => (track.enabled = true));
            stream.getAudioTracks().forEach((track) => (track.enabled = true));

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
        } catch (err) {
            toast.error("Camera/Mic permission denied");
            console.error("Failed to get user media", err);
            throw err;
        }

        pcRef.current = pc;
        return pc;
    };

    // ────────── Flush buffered ICE candidates (mirrors Family exactly) ──────────
    const flushIceCandidates = async () => {
        if (!pcRef.current || !pcRef.current.remoteDescription) return;
        const buffered = [...iceCandidateBufferRef.current];
        iceCandidateBufferRef.current = [];
        for (const c of buffered) {
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            } catch (err) {
                console.error("Error adding buffered ICE candidate", err);
            }
        }
    };

    // ────────── Signal Polling (mirrors Family exactly) ──────────
    const startSignalPolling = (roomId, toUserId, isCaller) => {
        if (signalPollIntervalRef.current) return;

        signalPollIntervalRef.current = setInterval(async () => {
            try {
                const res = await axios.get(API.CONSULTATION_SIGNAL, {
                    params: { roomId, sinceId: lastSignalIdRef.current },
                    withCredentials: true,
                });
                if (res.data?.status !== "success") return;

                const signals = res.data.signals || [];
                if (!signals.length) return;

                for (const s of signals) {
                    lastSignalIdRef.current = Math.max(lastSignalIdRef.current, s.id || 0);

                    // Always handle "end" signal, even if pcRef is already null (mirrors Family)
                    if (s.type === "end") {
                        toast("Call ended");
                        await endCall(false);
                        return;
                    }

                    if (!pcRef.current) continue;

                    if (s.type === "offer" && !isCaller) {
                        // Callee: set remote description, create & send answer (mirrors Family)
                        const desc = new RTCSessionDescription(s.payload);
                        await pcRef.current.setRemoteDescription(desc);
                        await flushIceCandidates();
                        const answer = await pcRef.current.createAnswer();
                        await pcRef.current.setLocalDescription(answer);
                        await axios.post(
                            API.CONSULTATION_SIGNAL,
                            { roomId, toUserId, type: "answer", payload: answer },
                            { withCredentials: true }
                        );
                        // Callee is now in the call (mirrors Family)
                        setIsInCall(true);
                        setStatus("Connected");
                    } else if (s.type === "answer" && isCaller) {
                        // Caller: set remote description from callee's answer (mirrors Family)
                        if (!pcRef.current.remoteDescription) {
                            const desc = new RTCSessionDescription(s.payload);
                            await pcRef.current.setRemoteDescription(desc);
                            await flushIceCandidates();
                        }
                        // Caller transitions to "in call" when answer received (mirrors Family)
                        stopOutgoingRingtone();
                        setIsInCall(true);
                        setStatus("Connected");
                    } else if (s.type === "candidate") {
                        // Buffer candidates if remote description not set yet (mirrors Family)
                        if (!pcRef.current.remoteDescription) {
                            iceCandidateBufferRef.current.push(s.payload);
                        } else {
                            try {
                                await pcRef.current.addIceCandidate(new RTCIceCandidate(s.payload));
                            } catch (err) {
                                console.error("Error adding ICE candidate", err);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to poll call signals", err);
            }
        }, 1500);
    };

    // ────────── Start Call — Doctor Only (mirrors Family handleCall) ──────────
    const startCall = async (appointment) => {
        if (callInfo || isInCall) {
            toast.error("Already in a call");
            return;
        }

        try {
            setIsCameraOn(true);
            setIsMicOn(true);

            // Call the dedicated start endpoint (mirrors FAMILY_CALL_START)
            const res = await axios.post(
                API.CONSULTATION_CALL_START,
                { appointment_id: appointment.id },
                { withCredentials: true }
            );

            if (res.data?.status !== "success" || !res.data.call) {
                toast.error(res.data?.message || "Could not start call");
                return;
            }

            const { room_id: roomId, id: callId, callee_user_id: calleeUserId } = res.data.call;

            setCallInfo({
                appointment,
                roomId,
                callId,
                isCaller: true,
            });
            setStatus("Calling...");

            lastSignalIdRef.current = 0;

            const toUserId = appointment.patient_user_id;
            const pc = await createPeerConnection(toUserId, roomId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await axios.post(
                API.CONSULTATION_SIGNAL,
                { roomId, toUserId, type: "offer", payload: offer },
                { withCredentials: true }
            );

            startSignalPolling(roomId, toUserId, true);
            startOutgoingRingtone();
            // NOTE: Do NOT setIsInCall(true) here. (mirrors Family)
            // Caller stays in "Calling..." state until answer signal is received.
        } catch (err) {
            console.error("Error starting call", err);
            toast.error("Could not start call");
            setCallInfo(null);
            setStatus("Idle");
        }
    };

    // ────────── Accept Call — Patient Only (mirrors Family handleAcceptIncoming) ──────────
    const acceptCall = async (incomingCallData) => {
        if (isInCall) return;

        try {
            setIsCameraOn(true);
            setIsMicOn(true);

            const roomId = incomingCallData.room_id;
            const callId = incomingCallData.call_id;
            const toUserId = incomingCallData.doctor_user_id;

            setCallInfo({
                appointment: incomingCallData,
                roomId,
                callId,
                isCaller: false,
            });
            setStatus("Connecting...");

            lastSignalIdRef.current = 0;

            // Tell server we accepted
            await axios.post(
                API.CONSULTATION_STATUS,
                { roomId, action: "accept" },
                { withCredentials: true }
            );

            await createPeerConnection(toUserId, roomId);
            // Start polling — the offer signal will trigger setIsInCall(true) (mirrors Family)
            startSignalPolling(roomId, toUserId, false);
            // Do NOT set isInCall here — wait until we receive and process the offer (mirrors Family)
            stopIncomingRingtone();
        } catch (err) {
            console.error("Error accepting call", err);
            toast.error("Could not connect call");
            setCallInfo(null);
            setStatus("Idle");
        }
    };

    return {
        callInfo,
        setCallInfo,
        isInCall,
        setIsInCall,
        status,
        setStatus,
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
        startSignalPolling,
        startIncomingRingtone,
        stopIncomingRingtone,
        stopOutgoingRingtone,
        stopRingtones,
        signalPollIntervalRef,
        incomingAudioRef,
        outgoingAudioRef,
    };
};
