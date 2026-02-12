import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { Camera as CameraIcon, RotateCcw, X } from 'lucide-react';

const AITracker = ({ targetReps, onRepCount, onTargetReached, onClose }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraType, setCameraType] = useState('user'); // 'user' (front) or 'environment' (back)
    const [reps, setReps] = useState(0);
    const [feedback, setFeedback] = useState("Get Ready!");
    const [progress, setProgress] = useState(0);

    // Logic State
    const direction = useRef(0); // 0: down, 1: up
    const count = useRef(0);

    const calculateAngle = (a, b, c) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    };

    const onResults = useCallback((results) => {
        if (!canvasRef.current || !webcamRef.current?.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const ctx = canvasRef.current.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        // Draw landmarks if needed (simplified for performance)
        // We mainly need logic

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;

            // keypoints: 11(L.Shoulder), 13(L.Elbow), 15(L.Wrist)
            // keypoints: 12(R.Shoulder), 14(R.Elbow), 16(R.Wrist)

            const leftShoulder = landmarks[11];
            const leftElbow = landmarks[13];
            const leftWrist = landmarks[15];

            const rightShoulder = landmarks[12];
            const rightElbow = landmarks[14];
            const rightWrist = landmarks[16];

            // Confidence check
            if (leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5 && leftWrist.visibility > 0.5 &&
                rightShoulder.visibility > 0.5 && rightElbow.visibility > 0.5 && rightWrist.visibility > 0.5) {

                const angleL = calculateAngle(leftShoulder, leftElbow, leftWrist);
                const angleR = calculateAngle(rightShoulder, rightElbow, rightWrist);

                // Simple Average or Min logic
                // Using the same logic as Python: 
                // ~170 is up, ~90 is down

                // Interpolate progress (160 -> 0%, 70 -> 100%)
                const perL = Math.max(0, Math.min(100, (160 - angleL) / (160 - 70) * 100));
                const perR = Math.max(0, Math.min(100, (160 - angleR) / (160 - 70) * 100));

                // Use average for smoother UI
                const avgPer = (perL + perR) / 2;
                setProgress(avgPer);

                // State Machine
                // Down
                if (perL >= 90 || perR >= 90) { // Relaxed checking (if either arm is down)
                    if (direction.current === 0) {
                        direction.current = 1;
                        setFeedback("UP!");
                    }
                }

                // Up
                if (perL <= 20 && perR <= 20) {
                    if (direction.current === 1) {
                        direction.current = 0;
                        count.current += 1;
                        setReps(count.current);
                        onRepCount(count.current);
                        setFeedback("DOWN!");

                        if (count.current >= targetReps) {
                            onTargetReached();
                        }
                    }
                }

                // Drawing Overlay
                // Draw Skeleton Lines
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 4;

                const toX = (val) => val * videoWidth;
                const toY = (val) => val * videoHeight;

                ctx.beginPath();
                ctx.moveTo(toX(leftShoulder.x), toY(leftShoulder.y));
                ctx.lineTo(toX(leftElbow.x), toY(leftElbow.y));
                ctx.lineTo(toX(leftWrist.x), toY(leftWrist.y));
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(toX(rightShoulder.x), toY(rightShoulder.y));
                ctx.lineTo(toX(rightElbow.x), toY(rightElbow.y));
                ctx.lineTo(toX(rightWrist.x), toY(rightWrist.y));
                ctx.stroke();

            } else {
                setFeedback("Show Upper Body");
            }
        }
        ctx.restore();
    }, [targetReps, onRepCount, onTargetReached]);

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: 0, // 0 = Lite (Fastest/Smoothest), 1 = Full, 2 = Heavy
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        if (webcamRef.current && webcamRef.current.video) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await pose.send({ image: webcamRef.current.video });
                    }
                },
                // Let Camera Utils handle responsive sizes 
                // width: 640,
                // height: 480
            });
            camera.start();
        }
    }, [onResults]);

    const toggleCamera = () => {
        setCameraType(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden flex flex-col">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white font-bold animate-pulse">Starting Camera...</p>
                        <p className="text-xs text-gray-400 mt-2">Please allow camera access</p>
                    </div>
                </div>
            )}

            {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50 p-6 text-center">
                    <div>
                        <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-white font-bold text-lg">Camera Error</p>
                        <p className="text-gray-400 text-sm mt-2">{cameraError}</p>
                        <p className="text-gray-500 text-xs mt-4">Check permissions. Try using Chrome or Safari.</p>
                    </div>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={cameraType === 'user'}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    facingMode: cameraType
                    // Removed width/height to let browser decide native res (fixes black screen)
                }}
                onUserMedia={() => setIsLoading(false)}
                onUserMediaError={(e) => {
                    console.error("Camera Error:", e);
                    setIsLoading(false);
                    setCameraError("Camera failed to load.");
                }}
                className="absolute inset-0 w-full h-full object-cover z-0"
            />
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-cover z-10 ${cameraType === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* TOP BAR */}
            <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">REPS</p>
                    <p className="text-3xl font-black text-white leading-none">{reps} / {targetReps}</p>
                </div>

                <button
                    onClick={onClose}
                    className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-all">
                    <X size={20} />
                </button>
            </div>

            {/* BOTTOM BAR CONTROLS */}
            <div className="absolute bottom-6 left-6 right-6 z-40 flex flex-col items-center gap-4">

                {/* Feedback Text */}
                <div className="bg-black/60 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10">
                    <p className="text-xl font-black text-orange-400 uppercase tracking-widest drop-shadow-sm">{feedback}</p>
                </div>

                {/* Camera Controls */}
                <div className="flex gap-4">
                    <button
                        onClick={toggleCamera}
                        className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-xl shadow-indigo-500/40 transition-all active:scale-95 border-2 border-indigo-400/50">
                        <RotateCcw size={20} />
                        <span className="font-bold uppercase text-xs tracking-widest">Switch Camera</span>
                    </button>
                </div>
            </div>


            {/* Progress Bar Side */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-48 w-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="absolute bottom-0 w-full bg-green-500 transition-all duration-200"
                    style={{ height: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default AITracker;
