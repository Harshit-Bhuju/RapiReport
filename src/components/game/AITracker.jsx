import React, { useRef, useEffect, useState } from 'react';
import { X, Activity, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';

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
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        ctx.restore();

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;

            const mirroredLandmarks = landmarks.map(lm => ({
                ...lm,
                x: 1 - lm.x
            }));

            drawConnections(ctx, mirroredLandmarks, canvas.width, canvas.height);

            // Get key points - ARMS AND SHOULDERS ARE ESSENTIAL
            const rightShoulder = mirroredLandmarks[12];
            const rightElbow = mirroredLandmarks[14];
            const rightWrist = mirroredLandmarks[16];
            const leftShoulder = mirroredLandmarks[11];
            const leftElbow = mirroredLandmarks[13];
            const leftWrist = mirroredLandmarks[15];

            // HIPS AND KNEES ARE OPTIONAL (for body angle check)
            const rightHip = mirroredLandmarks[24];
            const leftHip = mirroredLandmarks[23];
            const rightKnee = mirroredLandmarks[26];
            const leftKnee = mirroredLandmarks[25];

            // MINIMUM REQUIREMENT: Arms must be visible
            const visibilityThreshold = 0.5;

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

                // Calculate arm angles (ESSENTIAL)
                const rightArmAngle = calculateAngle(rShoulder, rElbow, rWrist);
                const leftArmAngle = calculateAngle(lShoulder, lElbow, lWrist);
                const avgArmAngle = (rightArmAngle + leftArmAngle) / 2;

                // Calculate body angle ONLY if hips are visible (OPTIONAL)
                let avgBodyAngle = 170;
                let isPlank = true; // Default to good form
                let canCheckBodyAngle = false;

                const hipsVisible =
                    rightHip?.visibility > visibilityThreshold &&
                    leftHip?.visibility > visibilityThreshold;

                if (hipsVisible) {
                    canCheckBodyAngle = true;
                    const rHip = toPixel(rightHip);
                    const lHip = toPixel(leftHip);

                    if (rightKnee?.visibility > visibilityThreshold && leftKnee?.visibility > visibilityThreshold) {
                        const rKnee = toPixel(rightKnee);
                        const lKnee = toPixel(leftKnee);
                        const rightBodyAngle = calculateAngle(rShoulder, rHip, rKnee);
                        const leftBodyAngle = calculateAngle(lShoulder, lHip, lKnee);
                        avgBodyAngle = (rightBodyAngle + leftBodyAngle) / 2;

                        // Draw body angle indicator
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillRect(rHip.x - 40, rHip.y - 50, 80, 35);
                        ctx.fillStyle = (avgBodyAngle > 140 && avgBodyAngle < 210) ? '#00FF00' : '#FF0000';
                        ctx.font = 'bold 18px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(Math.round(avgBodyAngle) + '°', rHip.x, rHip.y - 22);

                        console.log('Body angle:', avgBodyAngle);
                    } else {
                        const shoulderMid = { x: (rShoulder.x + lShoulder.x) / 2, y: (rShoulder.y + lShoulder.y) / 2 };
                        const hipMid = { x: (rHip.x + lHip.x) / 2, y: (rHip.y + lHip.y) / 2 };

                        const torsoAngle = Math.abs(Math.atan2(hipMid.y - shoulderMid.y, hipMid.x - shoulderMid.x) * 180 / Math.PI);
                        avgBodyAngle = 180 - torsoAngle;
                        console.log('Torso-based body angle:', avgBodyAngle);
                    }

                    // More lenient body angle check - only warn if REALLY bad form
                    isPlank = avgBodyAngle > 140 && avgBodyAngle < 210;
                }

                const avgShoulderY = (rShoulder.y + lShoulder.y) / 2;

                if (!window.initialShoulderY) {
                    window.initialShoulderY = avgShoulderY;
                }

                const verticalMovement = Math.abs(avgShoulderY - window.initialShoulderY);
                const hasVerticalMovement = verticalMovement > 30;

                drawAngle(ctx, rElbow, rightArmAngle);
                drawAngle(ctx, lElbow, leftArmAngle);

                // PUSHUP DETECTION
                const now = Date.now();
                const currentDirection = directionRef.current;
                const currentReps = repsRef.current;

                let feedback = '';

                // Only show body angle warning if it's REALLY bad (< 130 or > 220) AND during active motion
                if (canCheckBodyAngle && !isPlank && currentDirection === 1 && avgBodyAngle < 130) {
                    feedback = '⚠️ Keep body straighter!';
                    setFormFeedback(feedback);
                } else {
                    if (avgArmAngle < 90 &&
                        currentDirection === 0 &&
                        now - lastRepTime.current > 600) {

                        console.log('DOWN detected! Angle:', avgArmAngle);
                        setDirection(1);
                        directionRef.current = 1;
                        feedback = '✓ Going down...';
                        setFormFeedback(feedback);
                    }
                    else if (avgArmAngle > 160 &&
                        currentDirection === 1 &&
                        now - lastRepTime.current > 600 &&
                        currentReps < targetReps) { // Don't count beyond target

                        console.log('UP detected! Counting rep. Angle:', avgArmAngle);
                        setDirection(0);
                        directionRef.current = 0;
                        lastRepTime.current = now;

                        const newReps = currentReps + 1;
                        console.log('Rep counted! New reps:', newReps);
                        setReps(newReps);
                        repsRef.current = newReps;
                        onRepCount(newReps);

                        feedback = '✅ REP COUNTED!';
                        setFormFeedback(feedback);

                        window.initialShoulderY = avgShoulderY;

                        if (newReps >= targetReps) {
                            setIsCompleted(true);
                            setFormFeedback('🎉 TARGET REACHED!');
                            // Give user time to see the success state
                            setTimeout(() => {
                                onTargetReached();
                            }, 2000);
                        }
                    } else if (currentReps >= targetReps) {
                        feedback = '🎉 QUEST COMPLETED! Closing...';
                        setFormFeedback(feedback);
                    } else if (currentDirection === 1) {
                        feedback = '↑ Push up!';
                        setFormFeedback(feedback);
                    } else {
                        feedback = '✓ Ready - Bend arms to start';
                        setFormFeedback(feedback);
                    }
                }

                drawProgressBar(ctx, canvas.width, canvas.height, avgArmAngle, isPlank);
            } else {
                setFormFeedback('⚠️ Show your arms and shoulders clearly');
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
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });

                    pose.onResults(onResults);
                    poseRef.current = pose;
                    setIsLoading(false);
                } else {
                    throw new Error('MediaPipe Pose not loaded');
                }
            } catch (err) {
                console.error('Error loading MediaPipe:', err);
                setError('Failed to load AI tracker. Please refresh and try again.');
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
                setError('Cannot access camera. Please grant permission.');
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
        const currentReps = repsRef.current;
        const currentDirection = directionRef.current;

        ctx.fillStyle = 'rgba(40, 40, 40, 0.95)';
        ctx.fillRect(0, 0, width, 70);
        ctx.fillRect(0, height - 80, width, 80);

        ctx.fillStyle = '#00D9FF';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentReps, width / 2 - 60, height - 25);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('REPS', width / 2 + 60, height - 25);

        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Target: ${targetReps}`, 20, 45);

        ctx.textAlign = 'right';
        ctx.fillStyle = currentDirection === 1 ? '#00FF00' : '#FFD700';
        ctx.fillText(currentDirection === 1 ? '↓ DOWN' : '↑ UP', width - 20, 45);
    };

    useEffect(() => {
        if (!poseRef.current || !videoRef.current || isLoading) return;

        const sendFrame = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                await poseRef.current.send({ image: videoRef.current });
            }
            animationFrameRef.current = requestAnimationFrame(sendFrame);
        };

        sendFrame();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
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

            {/* Control buttons */}
            <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button
                    onClick={toggleMaximize}
                    className="p-3 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 transition-all shadow-lg"
                    title={isMaximized ? "Minimize" : "Maximize"}
                >
                    {isMaximized ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </button>
                <button
                    onClick={onClose}
                    className="p-3 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all shadow-lg"
                    title="Close"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Rep counter */}
            <div className="absolute top-4 left-4 z-30 bg-black/90 px-5 py-3 rounded-xl border-2 border-cyan-400">
                <p className="text-white font-black text-lg sm:text-xl md:text-2xl">
                    {reps} / {targetReps}
                </p>
                <p className="text-cyan-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Pushups</p>
            </div>

            {/* Form Feedback - RESPONSIVE */}
            {formFeedback && !isCompleted && (
                <div className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-30 bg-black/90 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-cyan-400 max-w-[90%] sm:max-w-md">
                    <p className="text-white font-bold text-sm sm:text-base md:text-lg text-center whitespace-nowrap overflow-hidden text-ellipsis">
                        {formFeedback}
                    </p>
                </div>
            )}

            {/* Success Overlay */}
            {isCompleted && (
                <div className="absolute inset-0 z-40 bg-indigo-600/90 backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in duration-500">
                    <div className="text-center p-8 bg-white rounded-[3rem] shadow-2xl transform animate-bounce">
                        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">Completed!</h2>
                        <p className="text-gray-600 font-bold">Target of {targetReps} reps reached!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AITracker;