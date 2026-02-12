import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import API from "@/Configs/ApiEndpoints";
import Button from "@/components/ui/Button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, Loader2 } from "lucide-react";
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

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="h-screen bg-gray-950 flex flex-col relative overflow-hidden font-sans">
            {/* Header / Info Overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 p-8 bg-gradient-to-b from-black/70 via-black/30 to-transparent flex justify-between items-start text-white">
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
                        {details.other_party.avatar ? (
                            <img src={details.other_party.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User className="w-6 h-6 text-white/50" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">{details.other_party.name}</h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isInCall ? 'bg-success-500 animate-pulse' : 'bg-warning-500'}`}></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{status}</p>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Appointment Time</p>
                    <p className="font-black text-lg bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10">{details.appointment_time}</p>
                </div>
            </div>

            {/* Main Video Stage */}
            <div className="flex-1 relative bg-gray-900 overflow-hidden">
                {/* Remote Video (Main) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Status Overlay (When no remote stream yet) */}
                {isInCall && !remoteVideoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm z-10 text-center px-6">
                        <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mb-6 border border-primary-500/30">
                            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Establishing Secure Connection</h3>
                        <p className="text-gray-400 font-medium max-w-xs uppercase text-[10px] tracking-widest">Waiting for {details.other_party.name} to establish a peer-to-peer connection...</p>
                    </div>
                )}

                {/* Local Video - PIP */}
                <div className="absolute bottom-32 right-6 w-36 md:w-48 aspect-[3/4] bg-gray-800 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl z-20 transition-all duration-500 group">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                        You
                    </div>
                </div>

                {/* Join Interface (The high-trust medical portal) */}
                {!isInCall && (
                    <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-40 p-8 text-center">
                        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
                            <div className="relative mb-10 mx-auto w-32 h-32">
                                <div className="absolute inset-0 bg-primary-600 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-32 h-32 rounded-[3rem] bg-white shadow-2xl overflow-hidden border-4 border-white flex items-center justify-center">
                                    {details.other_party.avatar ? (
                                        <img src={details.other_party.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-200" />
                                    )}
                                </div>
                                <div className="absolute -bottom-2 right-0 bg-success-500 w-8 h-8 rounded-full border-4 border-gray-950 flex items-center justify-center shadow-lg">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Ready for Consultation?</h3>
                            <p className="text-gray-400 font-bold mb-10 tracking-wide uppercase text-xs">
                                with <span className="text-white">{details.other_party.name}</span>
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-10 text-left max-w-xs mx-auto">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm">
                                    <Video className="w-5 h-5 text-primary-500 mb-2" />
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Camera</p>
                                    <p className="text-sm font-bold text-white">Encrypted</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm">
                                    <Mic className="w-5 h-5 text-success-500 mb-2" />
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Audio</p>
                                    <p className="text-sm font-bold text-white">Private</p>
                                </div>
                            </div>

                            <Button
                                onClick={startCall}
                                className="w-full py-5 rounded-[2rem] text-lg font-black uppercase tracking-widest bg-primary-600 text-white shadow-2xl shadow-primary-600/20 hover:bg-primary-500 hover:scale-105 active:scale-95 transition-all duration-300 gap-3"
                            >
                                <Video className="w-6 h-6" /> Join Call Room
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            {isInCall && (
                <div className="p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-6 z-30">
                    <button
                        onClick={toggleMic}
                        className={`p-5 rounded-[2rem] transition-all border-2 flex items-center justify-center group ${micOn
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                            }`}
                        title={micOn ? "Mute Mic" : "Unmute Mic"}
                    >
                        {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={endCall}
                        className="p-6 rounded-[2.5rem] bg-red-600 hover:bg-red-500 text-white shadow-2xl shadow-red-600/30 hover:scale-110 active:scale-90 transition-all group"
                        title="End Consultation"
                    >
                        <PhoneOff className="w-8 h-8" />
                    </button>

                    <button
                        onClick={toggleCamera}
                        className={`p-5 rounded-[2rem] transition-all border-2 flex items-center justify-center group ${cameraOn
                                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                            }`}
                        title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                    >
                        {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConsultationRoom;
