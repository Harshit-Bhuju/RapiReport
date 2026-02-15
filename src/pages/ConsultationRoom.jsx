import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import API from "@/Configs/ApiEndpoints";
import Button from "@/components/ui/Button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const ConsultationRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [status, setStatus] = useState("Initializing...");

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const signalPollInterval = useRef(null);
    const lastSignalId = useRef(0);
    const iceCandidateBuffer = useRef([]);

    useEffect(() => {
        fetchDetails();
        return () => {
            endCall(false); // Cleanup on unmount
        };
    }, [roomId]);

    const fetchDetails = async () => {
        try {
            const res = await axios.get(`${API.GET_CONSULTATION_DETAILS}?room_id=${roomId}`, { withCredentials: true });
            if (res.data.status === "success") {
                setDetails(res.data.details);
                setLoading(false);
                setStatus("Ready to join");
            } else {
                toast.error(res.data.message);
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Fetch details error", error);
            toast.error("Failed to load consultation details");
            navigate("/dashboard");
        }
    };

    const startCall = async () => {
        setStatus("Connecting...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // Toggle initial state
            stream.getVideoTracks().forEach(t => t.enabled = cameraOn);
            stream.getAudioTracks().forEach(t => t.enabled = micOn);

            setIsInCall(true);

            // Inform server we started/joined
            // If doctor, we might 'start' the call formally. For now just join.
            if (details.is_doctor) {
                await axios.post(API.CONSULTATION_STATUS,
                    { roomId, action: 'start' },
                    { withCredentials: true }
                );
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            });

            pc.onicecandidate = async (event) => {
                if (event.candidate && details?.other_party?.id) {
                    await sendSignal('candidate', event.candidate);
                }
            };

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            pcRef.current = pc;

            // Start polling for signals
            startPolling();

            // Create offer immediately to start negotiation
            // In a perfect world we'd wait for 'ready' signal but let's just offer repeatedly or relies on glare handling (simple offer/answer here)
            // Simplified: If I am doctor, I offer. If I am patient, I answer.
            if (details.is_doctor) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendSignal('offer', offer);
                setStatus("Calling...");
            } else {
                setStatus("Waiting for doctor...");
            }

        } catch (err) {
            console.error(err);
            toast.error("Could not access camera/mic");
            setStatus("Media Error");
        }
    };

    const sendSignal = async (type, payload) => {
        if (!details?.other_party?.id) return;
        try {
            await axios.post(API.CONSULTATION_SIGNAL, {
                roomId,
                toUserId: details.other_party.id,
                type,
                payload
            }, { withCredentials: true });
        } catch (e) {
            console.error("Signal error", e);
        }
    };

    const startPolling = () => {
        if (signalPollInterval.current) clearInterval(signalPollInterval.current);
        signalPollInterval.current = setInterval(async () => {
            try {
                const res = await axios.get(API.CONSULTATION_SIGNAL, {
                    params: { roomId, sinceId: lastSignalId.current },
                    withCredentials: true
                });

                if (res.data.status === "success" && res.data.signals.length > 0) {
                    for (const s of res.data.signals) {
                        lastSignalId.current = Math.max(lastSignalId.current, s.id);
                        if (s.type === 'offer' && !details.is_doctor) {
                            // I am patient, received offer
                            await handleOffer(s.payload);
                        } else if (s.type === 'answer' && details.is_doctor) {
                            // I am doctor, received answer
                            await handleAnswer(s.payload);
                        } else if (s.type === 'candidate') {
                            await handleCandidate(s.payload);
                        }
                    }
                }
            } catch (e) {
                console.error("Poll error", e);
            }
        }, 2000);
    };

    const handleOffer = async (offer) => {
        if (!pcRef.current) return;
        setStatus("Connected");
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        await sendSignal('answer', answer);
        // Process buffered candidates
        iceCandidateBuffer.current.forEach(c => pcRef.current.addIceCandidate(new RTCIceCandidate(c)));
        iceCandidateBuffer.current = [];
    };

    const handleAnswer = async (answer) => {
        if (!pcRef.current) return;
        setStatus("Connected");
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        // Process buffered candidates
        iceCandidateBuffer.current.forEach(c => pcRef.current.addIceCandidate(new RTCIceCandidate(c)));
        iceCandidateBuffer.current = [];
    };

    const handleCandidate = async (candidate) => {
        const ice = new RTCIceCandidate(candidate);
        if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(ice);
        } else {
            iceCandidateBuffer.current.push(candidate);
        }
    };

    const endCall = (confirm = true) => {
        if (confirm && !window.confirm("End consultation?")) return;

        if (signalPollInterval.current) clearInterval(signalPollInterval.current);
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (pcRef.current) pcRef.current.close();

        setIsInCall(false);
        navigate("/dashboard");
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !cameraOn);
            setCameraOn(!cameraOn);
        }
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !micOn);
            setMicOn(!micOn);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    const otherParty = details?.other_party || {};
    const otherName = otherParty.name || "Doctor";

    return (
        <div className="h-screen bg-gray-950 flex flex-col relative overflow-hidden font-sans">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex justify-between items-start text-white">
                <div className="flex gap-3 sm:gap-4 items-center">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {otherParty.avatar ? (
                            <img src={otherParty.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User className="w-6 h-6 text-white/50" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black tracking-tight">{otherName}</h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isInCall ? "bg-success-500 animate-pulse" : "bg-warning-500"}`} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{status}</p>
                        </div>
                    </div>
                </div>
                {details.appointment_time && (
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Appointment</p>
                        <p className="font-black text-sm md:text-lg bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">{details.appointment_time}</p>
                    </div>
                )}
            </div>

            {/* Main Video Stage */}
            <div className="flex-1 relative bg-gray-900 overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

                {/* Connecting overlay (when no remote stream yet) */}
                {isInCall && !remoteVideoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 backdrop-blur-sm z-10 text-center px-6">
                        <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary-500/30">
                            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Establishing Secure Connection</h3>
                        <p className="text-gray-400 font-medium max-w-xs text-sm">Waiting for {otherName} to connect…</p>
                        <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <ShieldCheck className="w-4 h-4 text-success-500" />
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">End-to-end encrypted</span>
                        </div>
                    </div>
                )}

                {/* Local Video PIP */}
                {isInCall && (
                    <div className="absolute bottom-28 right-4 sm:right-6 w-28 h-36 sm:w-36 sm:h-44 md:w-44 md:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 bg-black">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: "scaleX(-1)" }}
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white/90 bg-black/50 uppercase tracking-wider">You</div>
                    </div>
                )}

                {/* Join Screen */}
                {!isInCall && (
                    <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-40 p-6 sm:p-8 text-center">
                        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
                            <div className="relative mb-8 mx-auto w-28 h-28 sm:w-32 sm:h-32">
                                <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20" style={{ animationDuration: "2s" }} />
                                <div className="relative w-full h-full rounded-[2rem] bg-white/5 shadow-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center">
                                    {otherParty.avatar ? (
                                        <img src={otherParty.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 right-0 bg-success-500 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-gray-950 flex items-center justify-center shadow-lg">
                                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                </div>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Ready for Consultation?</h3>
                            <p className="text-gray-400 font-semibold mb-8 text-sm">
                                with <span className="text-white">{otherName}</span>
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 max-w-xs mx-auto">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                    <Video className="w-5 h-5 text-primary-500 mb-2" />
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Camera</p>
                                    <p className="text-sm font-bold text-white">Encrypted</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                    <Mic className="w-5 h-5 text-success-500 mb-2" />
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Audio</p>
                                    <p className="text-sm font-bold text-white">Private</p>
                                </div>
                            </div>

                            <Button
                                onClick={startCall}
                                className="w-full py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-wider bg-primary-600 text-white shadow-2xl shadow-primary-600/25 hover:bg-primary-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-3"
                            >
                                <Video className="w-5 h-5 sm:w-6 sm:h-6" /> Join Call Room
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            {isInCall && (
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-4 sm:gap-6 z-30">
                    <button
                        onClick={toggleMic}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                            micOn
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                        }`}
                        title={micOn ? "Mute" : "Unmute"}
                    >
                        {micOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>

                    <button
                        onClick={() => endCall()}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all"
                        title="End Consultation"
                    >
                        <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                            cameraOn
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                        }`}
                        title={cameraOn ? "Turn off camera" : "Turn on camera"}
                    >
                        {cameraOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConsultationRoom;
