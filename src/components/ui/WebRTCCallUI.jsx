/**
 * WebRTCCallUI.jsx
 * 
 * Shared, polished WebRTC call interface for Family and Doctor/Patient consultation.
 * Optimized for both mobile and desktop with beautiful layout and animations.
 * Re-attaches video streams when switching between full and minimized to prevent black screen.
 */
import React, { useLayoutEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  Minimize2,
  Maximize2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const WebRTCCallUI = ({
  // Refs
  localVideoRef,
  remoteVideoRef,
  localStreamRef,
  remoteStreamRef,
  // State
  isInCall,
  isCameraOn,
  isMicOn,
  callInfo,
  status = "",
  mode = "family", // "family" | "consultation"
  // Actions
  onAccept,
  onDecline,
  onEnd,
  onToggleCamera,
  onToggleMic,
  onMinimize,
  onExpand,
  isMinimized = false,
  // Optional
  showConnectionStatus = true,
  className = "",
}) => {
  const { t } = useTranslation();

  // Re-attach streams when mounting or switching layout (fixes black screen on maximize)
  useLayoutEffect(() => {
    if (!localVideoRef || !remoteVideoRef) return;
    if (localStreamRef?.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteStreamRef?.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [isMinimized, isInCall, localVideoRef, remoteVideoRef, localStreamRef, remoteStreamRef]);

  const otherPartyName = callInfo?.member?.username || callInfo?.member?.email
    || callInfo?.appointment?.patient_name || callInfo?.appointment?.doctor_name
    || t("common.calling");
  const otherPartyAvatar = callInfo?.member?.profile_picture
    || callInfo?.appointment?.patient_avatar || callInfo?.appointment?.patient_profile_pic
    || callInfo?.appointment?.doctor_avatar || callInfo?.appointment?.doctor_profile_pic;
  const isCaller = callInfo?.isCaller ?? true;

  // ─── Minimized PIP Overlay ───────────────────────────────────────────────────
  if (isInCall && isMinimized) {
    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 z-[60] rounded-2xl overflow-hidden",
          "shadow-2xl shadow-black/40 ring-2 ring-white/10 ring-offset-2 ring-offset-gray-950",
          "animate-fade-in",
          className
        )}
        style={{ width: "min(20rem, 90vw)", aspectRatio: "16/10" }}
      >
        <div className="relative w-full h-full bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-lg border-2 border-white/40 shadow-lg"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="absolute bottom-2 right-2 w-16 h-12 sm:w-20 sm:h-14 rounded-lg border-2 border-white/40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <VideoOff className="w-5 h-5 text-white/80" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={onExpand}
              className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 hover:scale-110 transition-all"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onEnd}
              className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-500 hover:scale-110 transition-all shadow-lg shadow-red-500/30"
              title={t("family.hangup")}
            >
              <Phone className="w-4 h-4 rotate-[135deg]" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white/90 uppercase tracking-wider">
            {t("common.live")}
          </div>
        </div>
      </div>
    );
  }

  // ─── Full Call Modal Content ──────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "relative w-full bg-gray-950 overflow-hidden flex flex-col justify-center",
        "min-h-[80vh] sm:min-h-[85vh] md:min-h-[90vh] h-full",
        className
      )}
    >
      {/* Remote video — full-screen background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Ringing / Calling screen (before connected) */}
      {!isInCall && callInfo && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-6 animate-fade-in">
          {/* Avatar with glow */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary-500/30 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-2xl shadow-primary-500/25">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-900/80 bg-gray-800 flex items-center justify-center">
                {otherPartyAvatar ? (
                  <img
                    src={otherPartyAvatar}
                    alt={otherPartyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-14 h-14 sm:w-16 sm:h-16 text-gray-500" />
                )}
              </div>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight text-center drop-shadow-lg">
            {otherPartyName}
          </h3>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-primary-200 mt-2 animate-pulse">
            {isCaller ? t("common.calling") : t("common.incomingVideoCall")}
          </p>
          {mode === "consultation" && (
            <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-4 h-4 text-success-500" />
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                {t("common.secureConsultation")}
              </span>
            </div>
          )}

          {/* Incoming: Accept / Decline */}
          {!isCaller && (
            <div className="flex items-center gap-10 sm:gap-14 mt-12">
              <button
                onClick={onDecline}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-xl shadow-red-500/30 group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300">
                  <Phone className="w-7 h-7 sm:w-8 sm:h-8 rotate-[135deg]" />
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                  {t("common.decline")}
                </span>
              </button>
              <button
                onClick={onAccept}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300 animate-pulse">
                  <Phone className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                  {t("common.accept")}
                </span>
              </button>
            </div>
          )}

          {/* Caller: Cancel */}
          {isCaller && (
            <button
              onClick={onEnd}
              className="mt-12 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/20 backdrop-blur-md border-2 border-red-500/50 text-red-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-400 transition-all duration-300"
            >
              <Phone className="w-7 h-7 sm:w-8 sm:h-8 rotate-[135deg]" />
            </button>
          )}
        </div>
      )}

      {/* In-call: Local video PIP */}
      {isInCall && (
        <div
          className={cn(
            "absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-2xl overflow-hidden",
            "shadow-2xl shadow-black/40 border-2 border-white/20 bg-black",
            "w-24 h-32 sm:w-28 sm:h-36 md:w-40 md:h-52",
            "transition-all duration-300 hover:scale-[1.02] hover:border-primary-500/50"
          )}
        >
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
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 bg-black/50 uppercase tracking-wider">
            {t("common.you")}
          </div>
        </div>
      )}

      {/* In-call: Controls bar */}
      {isInCall && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div className="flex items-center justify-center gap-4 sm:gap-6 px-6 sm:px-8 py-4 rounded-[2rem] bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl">
            <button
              onClick={onToggleMic}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200",
                isMicOn
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
              )}
              title={isMicOn ? t("common.mute") : t("common.unmute")}
            >
              {isMicOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              onClick={onToggleCamera}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200",
                isCameraOn
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
              )}
              title={isCameraOn ? t("common.turnOffCamera") : t("common.turnOnCamera")}
            >
              {isCameraOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              onClick={onEnd}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-110 active:scale-95 transition-all duration-200"
              title={t("family.hangup")}
            >
              <Phone className="w-7 h-7 sm:w-8 sm:h-8 rotate-[135deg]" />
            </button>

            <button
              onClick={onMinimize}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200"
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          {showConnectionStatus && status && (
            <p className="text-center text-xs font-bold text-white/60 mt-2 uppercase tracking-wider">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WebRTCCallUI;
