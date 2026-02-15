import React, { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Activity, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';

// Lighter smoothing so fast reps are detected (0.5 = responsive, still reduces jitter)
const SMOOTH_ALPHA = 0.5;

const AITracker = ({ targetReps, onRepCount, onTargetReached, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [reps, setReps] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formFeedback, setFormFeedback] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const animationFrameRef = useRef(null);
    const poseRef = useRef(null);
    const lastRepTime = useRef(0);
    const smoothedAngleRef = useRef(90);

    const repsRef = useRef(0);
    const directionRef = useRef(0);

    useEffect(() => {
        repsRef.current = reps;
    }, [reps]);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    // Process pose results - MOVED BEFORE useEffect
    const onResults = (results) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // DIGITAL ZOOM OUT (0.5x) - Scale and center the video frame
        const zoomScale = 0.5;
        const scaledW = canvas.width * zoomScale;
        const scaledH = canvas.height * zoomScale;
        const offsetX = (canvas.width - scaledW) / 2;
        const offsetY = (canvas.height - scaledH) / 2;

        ctx.translate(offsetX + scaledW, offsetY);
        ctx.scale(-zoomScale, zoomScale);

        if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        ctx.restore();

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;

            // Map landmarks to the 0.5x scaled space for correct drawing & interaction
            const mirroredLandmarks = landmarks.map(lm => ({
                ...lm,
                x: (offsetX + (1 - lm.x) * scaledW) / canvas.width,
                y: (offsetY + lm.y * scaledH) / canvas.height
            }));

            drawConnections(ctx, mirroredLandmarks, canvas.width, canvas.height);

            // Get key points - ARMS AND SHOULDERS ARE ESSENTIAL
            const rightShoulder = mirroredLandmarks[12];
            const rightElbow = mirroredLandmarks[14];
            const rightWrist = mirroredLandmarks[16];
            const leftShoulder = mirroredLandmarks[11];
            const leftElbow = mirroredLandmarks[13];
            const leftWrist = mirroredLandmarks[15];

            // MINIMUM REQUIREMENT: Arms must be visible
            const visibilityThreshold = 0.4; // Slightly more lenient

            const armsVisible =
                rightShoulder?.visibility > visibilityThreshold &&
                rightElbow?.visibility > visibilityThreshold &&
                rightWrist?.visibility > visibilityThreshold &&
                leftShoulder?.visibility > visibilityThreshold &&
                leftElbow?.visibility > visibilityThreshold &&
                leftWrist?.visibility > visibilityThreshold;

            if (armsVisible) {
                const toPixel = (lm) => ({
                    x: lm.x * canvas.width,
                    y: lm.y * canvas.height
                });

                const rShoulder = toPixel(rightShoulder);
                const rElbow = toPixel(rightElbow);
                const rWrist = toPixel(rightWrist);
                const lShoulder = toPixel(leftShoulder);
                const lElbow = toPixel(leftElbow);
                const lWrist = toPixel(leftWrist);

                // Calculate arm angles
                const rightArmAngle = calculateAngle(rShoulder, rElbow, rWrist);
                const leftArmAngle = calculateAngle(lShoulder, lElbow, lWrist);
                const rawAvgAngle = (rightArmAngle + leftArmAngle) / 2;

                const prev = smoothedAngleRef.current;
                smoothedAngleRef.current = prev + SMOOTH_ALPHA * (rawAvgAngle - prev);
                const avgArmAngle = smoothedAngleRef.current;

                // Accuracy Improvements: Wider thresholds for fast reps
                const now = Date.now();
                const currentDirection = directionRef.current;
                const currentReps = repsRef.current;
                const repCooldownMs = 150; // Faster response
                const angleDown = 110;  // More lenient (was 100)
                const angleUp = 145;   // More lenient (was 150)

                let feedback = '';

                if (avgArmAngle < angleDown &&
                    currentDirection === 0 &&
                    now - lastRepTime.current > repCooldownMs) {

                    setDirection(1);
                    directionRef.current = 1;
                    feedback = '✓ Descending...';
                    setFormFeedback(feedback);
                }
                else if (avgArmAngle > angleUp &&
                    currentDirection === 1 &&
                    now - lastRepTime.current > repCooldownMs &&
                    currentReps < targetReps) {

                    setDirection(0);
                    directionRef.current = 0;
                    lastRepTime.current = now;

                    const newReps = currentReps + 1;
                    setReps(newReps);
                    repsRef.current = newReps;
                    onRepCount(newReps);

                    feedback = '✅ REP COUNTED!';
                    setFormFeedback(feedback);

                    if (newReps >= targetReps) {
                        setIsCompleted(true);
                        setFormFeedback('🎉 TARGET REACHED!');
                        onTargetReached();
                    }
                } else if (currentReps >= targetReps) {
                    feedback = '🎉 QUEST COMPLETED!';
                    setFormFeedback(feedback);
                } else if (currentDirection === 1) {
                    feedback = '↑ Push up!';
                    setFormFeedback(feedback);
                } else {
                    feedback = 'Arms in view – bend to start';
                    setFormFeedback(feedback);
                }

                drawProgressBar(ctx, canvas.width, canvas.height, avgArmAngle, true);
            } else {
                setFormFeedback('⚠️ Fit your full body in the center box');
            }
        }

        drawUI(ctx, canvas.width, canvas.height);
    };

    // Load MediaPipe Pose
    useEffect(() => {
        const loadMediaPipe = async () => {
            try {
                const script1 = document.createElement('script');
                script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
                script1.crossOrigin = 'anonymous';
                document.body.appendChild(script1);

                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js';
                script2.crossOrigin = 'anonymous';
                document.body.appendChild(script2);

                const script3 = document.createElement('script');
                script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
                script3.crossOrigin = 'anonymous';
                document.body.appendChild(script3);

                const script4 = document.createElement('script');
                script4.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
                script4.crossOrigin = 'anonymous';
                document.body.appendChild(script4);

                await new Promise((resolve) => {
                    script4.onload = resolve;
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                if (window.Pose) {
                    const pose = new window.Pose({
                        locateFile: (file) => {
                            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                        }
                    });

                    pose.setOptions({
                        modelComplexity: 1,
                        smoothLandmarks: true,
                        enableSegmentation: false,
                        smoothSegmentation: false,
                        minDetectionConfidence: 0.45,
                        minTrackingConfidence: 0.55
                    });

                    pose.onResults(onResults);
                    poseRef.current = pose;
                    setIsLoading(false);
                } else {
                    throw new Error('MediaPipe Pose not loaded');
                }
            } catch (err) {
                console.error('Error loading MediaPipe:', err);
                const msg = 'Failed to load AI tracker. Please refresh and try again.';
                setError(msg);
                toast.error(msg);
                setIsLoading(false);
            }
        };

        loadMediaPipe();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Start camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        if (canvasRef.current) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                        }
                    };
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                const msg = 'Video could not start. Please check camera permissions.';
                setError(msg);
                toast.error(msg);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Calculate angle between three points
    const calculateAngle = (a, b, c) => {
        const radians =
            Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180) {
            angle = 360 - angle;
        }
        return angle;
    };

    const drawConnections = (ctx, landmarks, width, height) => {
        const connections = [
            [11, 12], // shoulders
            [11, 13], [13, 15], // left arm
            [12, 14], [14, 16], // right arm
            [11, 23], [12, 24], // torso
            [23, 24], // hips
            [23, 25], [25, 27], // left leg
            [24, 26], [26, 28], // right leg
        ];

        ctx.strokeStyle = '#00D9FF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        connections.forEach(([start, end]) => {
            const startLm = landmarks[start];
            const endLm = landmarks[end];

            if (startLm && endLm && startLm.visibility > 0.4 && endLm.visibility > 0.4) {
                ctx.beginPath();
                ctx.moveTo(startLm.x * width, startLm.y * height);
                ctx.lineTo(endLm.x * width, endLm.y * height);
                ctx.stroke();
            }
        });

        landmarks.forEach((lm, i) => {
            if (lm.visibility > 0.4) {
                if ([11, 12, 13, 14, 15, 16].includes(i)) {
                    ctx.fillStyle = '#FF6B6B';
                    ctx.beginPath();
                    ctx.arc(lm.x * width, lm.y * height, 8, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                else if ([23, 24, 25, 26].includes(i)) {
                    ctx.fillStyle = '#6B9BFF';
                    ctx.beginPath();
                    ctx.arc(lm.x * width, lm.y * height, 6, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        });
    };

    const drawAngle = (ctx, point, angle) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(point.x - 40, point.y - 50, 80, 35);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(angle) + '°', point.x, point.y - 22);
    };

    const drawProgressBar = (ctx, width, height, angle, isPlank) => {
        const progress = Math.min(100, Math.max(0, ((160 - angle) / 70) * 100));

        const barX = 20;
        const barY = 100;
        const barWidth = 30;
        const barHeight = 300;

        ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = isPlank ? '#00D9FF' : '#FF6B6B';
        const fillHeight = (progress / 100) * barHeight;
        ctx.fillRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        const barXRight = width - 50;
        ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
        ctx.fillRect(barXRight, barY, barWidth, barHeight);
        ctx.fillStyle = isPlank ? '#00D9FF' : '#FF6B6B';
        ctx.fillRect(barXRight, barY + barHeight - fillHeight, barWidth, fillHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barXRight, barY, barWidth, barHeight);
    };

    const drawUI = (ctx, width, height) => {
        // Minimal canvas UI; main HUD is React overlay for better UX
        const currentReps = repsRef.current;
        const currentDirection = directionRef.current;
        const progress = Math.min(1, currentReps / targetReps);

        // Subtle top bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, 56);

        // Direction hint bottom strip
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, height - 52, width, 52);
        ctx.fillStyle = currentDirection === 1 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(250, 204, 21, 0.9)';
        ctx.font = '600 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentDirection === 1 ? '↓ Lower chest' : '↑ Push up', width / 2, height - 22);
    };

    // Use requestVideoFrameCallback when available for smoother sync with camera (WebRTC-style)
    useEffect(() => {
        if (!poseRef.current || !videoRef.current || isLoading) return;

        const video = videoRef.current;
        let cancelled = false;
        let vfcHandle = null;

        const processFrame = () => {
            if (cancelled) return;
            if (video && video.readyState >= 2) {
                poseRef.current?.send({ image: video }).then(() => {
                    if (!cancelled) animationFrameRef.current = requestAnimationFrame(processFrame);
                }).catch(() => {
                    if (!cancelled) animationFrameRef.current = requestAnimationFrame(processFrame);
                });
            } else {
                animationFrameRef.current = requestAnimationFrame(processFrame);
            }
        };

        if (typeof video.requestVideoFrameCallback === 'function') {
            const callback = () => {
                if (cancelled) return;
                poseRef.current?.send({ image: video }).then(() => {
                    if (!cancelled) vfcHandle = video.requestVideoFrameCallback(callback);
                }).catch(() => {
                    if (!cancelled) processFrame();
                });
            };
            vfcHandle = video.requestVideoFrameCallback(callback);
        } else {
            processFrame();
        }

        return () => {
            cancelled = true;
            if (typeof video.cancelVideoFrameCallback === 'function' && vfcHandle != null) {
                video.cancelVideoFrameCallback(vfcHandle);
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isLoading]);

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    if (error) {
        return (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
                <div className="text-center p-8">
                    <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-white font-bold mb-2">{error}</p>
                    <button
                        onClick={onClose}
                        className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isMaximized ? 'fixed inset-0 z-50' : 'relative w-full h-full'} bg-black overflow-hidden transition-all duration-300`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-white animate-pulse mx-auto mb-4" />
                        <p className="text-white font-bold text-lg">Loading AI Tracker...</p>
                        <p className="text-gray-400 text-sm mt-2">Initializing pose detection...</p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Top bar: LIVE + controls */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                    </span>
                    <span className="text-white/80 text-xs font-semibold">Push-ups</span>
                </div>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={toggleMaximize}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        title={isMaximized ? "Minimize" : "Maximize"}
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-all"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Circular progress + rep count */}
            <div className="absolute top-14 left-4 z-30 flex items-center gap-3">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-white/20"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="none"
                            d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                        />
                        <path
                            className="text-cyan-400 transition-all duration-300 ease-out"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={`${(reps / targetReps) * 97.4} 97.4`}
                            d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-white font-black text-lg sm:text-xl leading-none">{reps}</span>
                        <span className="text-white/60 text-[10px] font-bold">/ {targetReps}</span>
                    </div>
                </div>
                <div className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
                    <p className="text-white/90 text-[10px] font-bold uppercase tracking-wider">Target</p>
                    <p className="text-cyan-300 font-black text-sm">{targetReps} reps</p>
                </div>
            </div>

            {/* Form feedback - glass card */}
            {formFeedback && !isCompleted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90%] max-w-sm">
                    <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-4 shadow-2xl">
                        <p className="text-white font-semibold text-center text-sm sm:text-base">
                            {formFeedback}
                        </p>
                    </div>
                </div>
            )}

            {/* Success overlay */}
            {isCompleted && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-indigo-600/95 to-cyan-600/95 backdrop-blur-xl">
                    <div className="text-center p-8 sm:p-10 bg-white/95 backdrop-blur rounded-[2rem] shadow-2xl mx-4 max-w-sm animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                            Completed
                        </h2>
                        <p className="text-gray-600 font-semibold text-sm sm:text-base">
                            {targetReps} push-ups verified
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AITracker;