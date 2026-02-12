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
        <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center text-white">
                <div>
                    <h2 className="font-bold text-lg">{details.other_party.name}</h2>
                    <p className="text-xs text-gray-300 opacity-80">{status}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono text-sm">{details.appointment_time}</p>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative flex items-center justify-center">
                {/* Remote Video (Full Screen) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Local Video (PIP) */}
                <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                </div>

                {/* Join Prompt */}
                {!isInCall && (
                    <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-20">
                        <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center mb-6 animate-pulse">
                            {details.other_party.avatar ? (
                                <img src={details.other_party.avatar} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready for consultation?</h3>
                        <p className="text-gray-400 mb-8">with {details.other_party.name}</p>
                        <Button onClick={startCall} className="px-8 py-4 rounded-full text-lg shadow-xl shadow-primary-500/30">
                            Join Consultation Using WebRTC
                        </Button>
                    </div>
                )}
            </div>

            {/* Controls */}
            {isInCall && (
                <div className="p-6 bg-black/40 backdrop-blur-md flex justify-center gap-6">
                    <button onClick={toggleMic} className={`p-4 rounded-full transition-all ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}>
                        {micOn ? <Mic /> : <MicOff />}
                    </button>
                    <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg">
                        <PhoneOff className="w-6 h-6" />
                    </button>
                    <button onClick={toggleCamera} className={`p-4 rounded-full transition-all ${cameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}>
                        {cameraOn ? <Video /> : <VideoOff />}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConsultationRoom;
