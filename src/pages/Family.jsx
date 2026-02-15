import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plus,
  MessageSquare,
  Phone,
  Trash2,
  Mail,
  UserPlus,
  Loader2,
  Minimize2,
  Maximize2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Heart,
  FileText,
  Thermometer,
  ShieldAlert,
  Calendar,
  Droplets,
  X,
  Brain,
  BrainCircuit,
  Sparkles,
  Send,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { FamilyMemberCard } from "@/components/ui/FamilyMemberCard";
import WebRTCCallUI from "@/components/ui/WebRTCCallUI";
import { toast } from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";
import { useConfirmStore } from "@/store/confirmStore";
import { cn } from "@/lib/utils";

const Family = () => {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [memberHealthData, setMemberHealthData] = useState({}); // { memberId: healthData }
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [healthModalMember, setHealthModalMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callInfo, setCallInfo] = useState(null); // { member, roomId, callId, isCaller }
  const [isInCall, setIsInCall] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatCurrentUserId, setChatCurrentUserId] = useState(null);
  const chatScrollRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyAnalysis, setHistoryAnalysis] = useState(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const signalPollIntervalRef = useRef(null);
  const lastSignalIdRef = useRef(0);
  const incomingPollIntervalRef = useRef(null);
  const chatPollIntervalRef = useRef(null);
  const incomingAudioRef = useRef(null);
  const outgoingAudioRef = useRef(null);
  const iceCandidateBufferRef = useRef([]); // Buffer ICE candidates until remote desc is set
  const isCallConnectedRef = useRef(false); // Track if connection was ever established

  // Setup ringtone audio + cleanup media/peer on unmount
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
      cleanupMediaAndPeer();
      cleanupChatPolling();
    };
  }, []);

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

  // Re-attach streams when layout (modal vs overlay) changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [isCallModalOpen, isCallMinimized, isInCall, isCameraOn]);

  const stopOutgoingRingtone = () => {
    if (outgoingAudioRef.current) {
      outgoingAudioRef.current.pause();
      outgoingAudioRef.current.currentTime = 0;
    }
  };

  const fetchMembers = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await axios.get(API.FAMILY_LIST, { withCredentials: true });
      if (res.data?.status === "success") {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch family members", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Poll for incoming ringing calls for the current user (as callee)
  useEffect(() => {
    if (incomingPollIntervalRef.current) return;

    const pollIncoming = async () => {
      try {
        const res = await axios.get(API.FAMILY_CALL_INCOMING, {
          withCredentials: true,
        });
        if (res.data?.status !== "success") return;
        const calls = res.data.calls || [];

        // Check if the current ringing call was cancelled by the caller
        // BUT skip this check if we've already accepted (signal polling is active)
        // because the backend changes status from 'ringing' to 'active' after accept,
        // so the call won't appear in the 'ringing' list anymore.
        if (
          callInfo &&
          !isInCall &&
          !callInfo.isCaller &&
          !signalPollIntervalRef.current
        ) {
          const currentCallStillActive = calls.find(
            (c) => c.id === callInfo.callId,
          );
          if (!currentCallStillActive) {
            toast(t("family.callMissed") || "Call ended");
            endCall(false);
            return;
          }
        }

        if (!calls.length || callInfo) return;

        const call = calls[0];
        const member = {
          member_id: call.caller_user_id,
          username: call.caller_name,
          email: call.caller_email,
          profile_picture: call.caller_profile_picture,
        };

        setCallInfo({
          member,
          roomId: call.room_id,
          callId: call.id,
          isCaller: false,
        });
        setIsCallModalOpen(true);
        startIncomingRingtone();
        toast.success(
          t("family.incomingCall", {
            name: member.username || member.email,
          }),
        );
      } catch (err) {
        // Silent fail – polling is best-effort
        console.error("Failed to poll incoming family calls", err);
      }
    };

    incomingPollIntervalRef.current = setInterval(pollIncoming, 5000);

    return () => {
      if (incomingPollIntervalRef.current) {
        clearInterval(incomingPollIntervalRef.current);
        incomingPollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callInfo]);

  const cleanupMediaAndPeer = () => {
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

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const cleanupChatPolling = () => {
    if (chatPollIntervalRef.current) {
      clearInterval(chatPollIntervalRef.current);
      chatPollIntervalRef.current = null;
    }
  };

  const endCall = async (sendStatus = true) => {
    const current = callInfo;
    stopIncomingRingtone();
    stopOutgoingRingtone();
    cleanupMediaAndPeer();
    setIsInCall(false);
    setIsCallMinimized(false);
    setIsCallModalOpen(false);
    setCallInfo(null);

    if (sendStatus && current?.callId) {
      try {
        await axios.post(
          API.FAMILY_CALL_STATUS,
          { callId: current.callId, action: "end" },
          { withCredentials: true },
        );
        if (current.member?.member_id && current.roomId) {
          await axios.post(
            API.FAMILY_CALL_SIGNAL,
            {
              roomId: current.roomId,
              toUserId: current.member.member_id,
              type: "end",
              payload: {},
            },
            { withCredentials: true },
          );
        }
      } catch (err) {
        console.error("Failed to end call", err);
      }
    }
  };

  const createPeerConnection = async (member, roomId, isCaller) => {
    // Reset ICE buffer and connected flag
    iceCandidateBufferRef.current = [];
    isCallConnectedRef.current = false;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = async (event) => {
      if (event.candidate && member?.member_id) {
        try {
          await axios.post(
            API.FAMILY_CALL_SIGNAL,
            {
              roomId,
              toUserId: member.member_id,
              type: "candidate",
              payload: event.candidate,
            },
            { withCredentials: true },
          );
        } catch (err) {
          console.error("Failed to send ICE candidate", err);
        }
      }
    };

    // Detect peer disconnect — only AFTER connection was once established
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
        toast(t("family.callEnded") || "Call ended");
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
      // Always re-attach to video element
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;

      // Set initial states: video ON, mic ON
      stream.getVideoTracks().forEach((track) => (track.enabled = true));
      stream.getAudioTracks().forEach((track) => (track.enabled = true));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch (err) {
      toast.error(
        t("family.callPermissionError") || "Camera/Mic permission denied",
      );
      console.error("Failed to get user media", err);
      throw err;
    }

    pcRef.current = pc;
    return pc;
  };

  // Flush any buffered ICE candidates after remote description is set
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

  const startSignalPolling = (roomId, member, isCaller) => {
    if (signalPollIntervalRef.current) return;

    signalPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await axios.get(API.FAMILY_CALL_SIGNAL, {
          params: {
            roomId,
            sinceId: lastSignalIdRef.current,
          },
          withCredentials: true,
        });
        if (res.data?.status !== "success") return;

        const signals = res.data.signals || [];
        if (!signals.length) return;

        for (const s of signals) {
          lastSignalIdRef.current = Math.max(
            lastSignalIdRef.current,
            s.id || 0,
          );

          // Always handle "end" signal, even if pcRef is already null
          if (s.type === "end") {
            toast(t("family.callEnded") || "Call ended");
            await endCall(false);
            return;
          }

          if (!pcRef.current) continue;

          if (s.type === "offer" && !isCaller) {
            // Callee: set remote description, create & send answer
            const desc = new RTCSessionDescription(s.payload);
            await pcRef.current.setRemoteDescription(desc);
            // Flush any ICE candidates that arrived before the offer
            await flushIceCandidates();
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            await axios.post(
              API.FAMILY_CALL_SIGNAL,
              {
                roomId,
                toUserId: member.member_id,
                type: "answer",
                payload: answer,
              },
              { withCredentials: true },
            );
            // Callee is now in the call
            setIsInCall(true);
          } else if (s.type === "answer" && isCaller) {
            // Caller: set remote description from callee's answer
            if (!pcRef.current.remoteDescription) {
              const desc = new RTCSessionDescription(s.payload);
              await pcRef.current.setRemoteDescription(desc);
              await flushIceCandidates();
            }
            // Caller transitions to "in call" when answer received
            stopOutgoingRingtone();
            setIsInCall(true);
          } else if (s.type === "candidate") {
            // Buffer candidates if remote description not set yet
            if (!pcRef.current.remoteDescription) {
              iceCandidateBufferRef.current.push(s.payload);
            } else {
              try {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(s.payload),
                );
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        API.FAMILY_ADD,
        { email: newMemberEmail, relation: newMemberRelation },
        { withCredentials: true },
      );
      if (res.data?.status === "success") {
        toast.success(t("family.addSuccess", { email: res.data.member?.username || newMemberEmail }));
        setNewMemberEmail("");
        setNewMemberRelation("");
        setIsAddModalOpen(false);
        fetchMembers();
      } else {
        toast.error(res.data?.message || t("family.addError"));
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || t("family.addError");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirm = useConfirmStore((s) => s.openConfirm);

  const handleRemoveMember = (linkId) => {
    openConfirm({
      title: t("confirm.remove") || "Remove member",
      message:
        t("confirm.removeMember") ||
        t("family.confirmRemove") ||
        "Are you sure you want to remove this family member?",
      confirmLabel: t("confirm.remove") || "Remove",
      cancelLabel: t("confirm.cancel") || "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await axios.post(
            API.FAMILY_REMOVE,
            { id: linkId },
            { withCredentials: true },
          );
          if (res.data?.status === "success") {
            toast.success(t("family.removeSuccess") || "Member removed.");
            setMembers((prev) => prev.filter((m) => m.link_id !== linkId));
          } else {
            toast.error(res.data?.message || t("family.removeError") || "Remove failed.");
          }
        } catch (err) {
          toast.error(t("family.removeError") || "Error removing member.");
        }
      },
    });
  };

  const handleChat = (member) => {
    setActiveMember(member);
    setIsChatModalOpen(true);
    setChatMessages([]);
    setChatInput("");
    setChatCurrentUserId(null);
  };

  const fetchChatMessages = useCallback(
    async (linkId, isInitial = false) => {
      if (!linkId) return;
      try {
        if (isInitial) setChatLoading(true);
        const res = await axios.get(API.FAMILY_CHAT, {
          params: { link_id: linkId },
          withCredentials: true,
        });
        if (res.data?.status === "success") {
          setChatMessages(res.data.messages || []);
          setChatCurrentUserId(res.data.current_user_id || null);
        }
      } catch (err) {
        console.error("Failed to load family chat", err);
        if (isInitial)
          toast.error(t("family.chatLoadFailed") || "Failed to load messages.");
      } finally {
        if (isInitial) setChatLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!isChatModalOpen || !activeMember?.link_id) {
      cleanupChatPolling();
      return;
    }

    // Initial load with loading state
    fetchChatMessages(activeMember.link_id, true);

    // Poll every 3s (silent refresh, no loading spinner)
    if (!chatPollIntervalRef.current) {
      chatPollIntervalRef.current = setInterval(() => {
        fetchChatMessages(activeMember.link_id, false);
      }, 3000);
    }

    return () => {
      cleanupChatPolling();
    };
  }, [isChatModalOpen, activeMember?.link_id, fetchChatMessages]);

  useEffect(() => {
    if (chatScrollRef.current && chatMessages.length) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || !activeMember?.link_id || chatSending) return;
    setChatSending(true);
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      from_user_id: chatCurrentUserId ?? 0,
      message: text,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setChatInput("");
    try {
      await axios.post(
        API.FAMILY_CHAT,
        { link_id: activeMember.link_id, message: text },
        { withCredentials: true },
      );
      // Refresh to get real message from server
      fetchChatMessages(activeMember.link_id, false);
    } catch (err) {
      console.error("Failed to send chat message", err);
      setChatMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setChatInput(text);
      toast.error(t("family.chatSendFailed"));
    } finally {
      setChatSending(false);
    }
  };

  const handleCall = async (member) => {
    // Prevent duplicate calls
    if (callInfo || isInCall) {
      toast.error(t("family.alreadyInCall"));
      return;
    }

    try {
      // Reset toggle states for new call
      setIsCameraOn(true);
      setIsMicOn(true);

      const res = await axios.post(
        API.FAMILY_CALL_START,
        { member_user_id: member.member_id },
        { withCredentials: true },
      );

      if (res.data?.status !== "success" || !res.data.call) {
        toast.error(
          res.data?.message ||
          t("family.callFailed", { name: member.username }),
        );
        return;
      }

      const { room_id: roomId, id: callId } = res.data.call;

      setCallInfo({
        member,
        roomId,
        callId,
        isCaller: true,
      });
      setIsCallModalOpen(true);
      setIsCallMinimized(false);

      lastSignalIdRef.current = 0;

      const pc = await createPeerConnection(member, roomId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await axios.post(
        API.FAMILY_CALL_SIGNAL,
        {
          roomId,
          toUserId: member.member_id,
          type: "offer",
          payload: offer,
        },
        { withCredentials: true },
      );

      startSignalPolling(roomId, member, true);
      startOutgoingRingtone();
      // NOTE: Do NOT setIsInCall(true) here.
      // Caller stays in "Calling..." state until answer signal is received.
      toast.success(
        t("family.calling", { name: member.username || member.email }),
      );
    } catch (err) {
      console.error("Error starting call", err);
      const msg =
        err.response?.data?.message ||
        t("family.callFailed", { name: member.username || member.email });
      toast.error(msg);
    }
  };

  const handleAcceptIncoming = async () => {
    if (!callInfo?.callId || !callInfo?.member || !callInfo?.roomId) return;
    const { callId, member, roomId } = callInfo;
    try {
      // Reset toggle states for incoming call
      setIsCameraOn(true);
      setIsMicOn(true);

      await axios.post(
        API.FAMILY_CALL_STATUS,
        { callId, action: "accept" },
        { withCredentials: true },
      );

      lastSignalIdRef.current = 0;
      await createPeerConnection(member, roomId, false);
      // Start polling — the offer signal will trigger setIsInCall(true)
      startSignalPolling(roomId, member, false);
      // Do NOT set isInCall here — wait until we receive and process the offer
      setIsCallMinimized(false);
      stopIncomingRingtone();
    } catch (err) {
      console.error("Error accepting call", err);
      toast.error(t("family.callFailed", { name: callInfo.member?.username }));
      await endCall();
    }
  };

  const handleDeclineIncoming = async () => {
    if (!callInfo?.callId) {
      setIsCallModalOpen(false);
      setCallInfo(null);
      return;
    }
    try {
      await axios.post(
        API.FAMILY_CALL_STATUS,
        { callId: callInfo.callId, action: "end" },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Error declining call", err);
    } finally {
      setIsCallModalOpen(false);
      setCallInfo(null);
    }
  };

  const handleAcceptInvite = async (linkId) => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        API.FAMILY_ACTION,
        { link_id: linkId, action: "accept" },
        { withCredentials: true },
      );
      if (res.data?.status === "success") {
        toast.success(t("family.acceptSuccess"));
        fetchMembers();
      } else {
        toast.error(res.data?.message || t("family.acceptError"));
      }
    } catch (err) {
      toast.error(t("family.acceptFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectInvite = (linkId) => {
    openConfirm({
      title: t("confirm.decline") || t("family.confirmRejectTitle") || "Decline invitation",
      message:
        t("confirm.declineInvite") ||
        t("family.confirmReject") ||
        "Are you sure you want to decline this invitation?",
      confirmLabel: t("confirm.decline") || "Decline",
      cancelLabel: t("confirm.cancel") || "Cancel",
      variant: "warning",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const res = await axios.post(
            API.FAMILY_ACTION,
            { link_id: linkId, action: "reject" },
            { withCredentials: true },
          );
          if (res.data?.status === "success") {
            toast.success(t("family.rejectSuccess") || "Invitation declined");
            fetchMembers();
          } else {
            toast.error(res.data?.message || t("family.rejectError") || "Failed to decline invitation");
          }
        } catch (err) {
          toast.error(t("family.rejectError") || "Error declining invitation");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn((prev) => !prev);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn((prev) => !prev);
    }
  };

  // Fetch health for one or all accepted members (always fresh, no cache skip)
  const fetchMemberHealth = useCallback(
    async (memberId = null) => {
      const acceptedMembers = members.filter((m) => m.status === "accepted");
      const toFetch = memberId
        ? acceptedMembers.filter((m) => m.member_id === memberId)
        : acceptedMembers;
      for (const m of toFetch) {
        try {
          const res = await axios.get(API.FAMILY_MEMBER_HEALTH, {
            params: { member_id: m.member_id },
            withCredentials: true,
          });
          if (res.data?.status === "success") {
            setMemberHealthData((prev) => ({
              ...prev,
              [m.member_id]: res.data.data,
            }));
          } else {
            const errMsg = res.data?.message || "Unknown API error";
            setMemberHealthData((prev) => ({
              ...prev,
              [m.member_id]: {
                profile: null,
                symptoms: [],
                reports: [],
                prescriptions: [],
                error: true,
                errorMessage: errMsg,
              },
            }));
          }
        } catch (err) {
          const errMsg = err?.response?.data?.message || err?.message || "Network error";
          console.error("Failed to fetch family member health", m.member_id, err?.response?.data || err?.message);
          setMemberHealthData((prev) => ({
            ...prev,
            [m.member_id]: {
              profile: null,
              symptoms: [],
              reports: [],
              prescriptions: [],
              error: true,
              errorMessage: errMsg,
            },
          }));
        }
      }
    },
    [members],
  );

  // Initial load + refetch when members change
  useEffect(() => {
    if (members.length > 0) fetchMemberHealth();
  }, [members, fetchMemberHealth]);

  // When health modal opens, fetch fresh data and poll every 10s for updates
  const healthModalPollRef = useRef(null);
  useEffect(() => {
    if (!isHealthModalOpen || !healthModalMember?.id) return;
    fetchMemberHealth(healthModalMember.id);
    healthModalPollRef.current = setInterval(() => {
      fetchMemberHealth(healthModalMember.id);
    }, 10000);
    return () => {
      if (healthModalPollRef.current) {
        clearInterval(healthModalPollRef.current);
        healthModalPollRef.current = null;
      }
    };
  }, [isHealthModalOpen, healthModalMember?.id, fetchMemberHealth]);

  const handleViewHealth = async (cardMember) => {
    const fullMember = members.find((m) => m.member_id === cardMember.id);
    setHealthModalMember({
      ...cardMember,
      health: memberHealthData[cardMember.id] || null,
      raw: fullMember,
    });
    setHistoryAnalysis(null);
    setIsHealthModalOpen(true);
    // Force fetch immediately so modal always gets fresh data
    await fetchMemberHealth(cardMember.id);
  };

  // Keep health modal in sync when memberHealthData refreshes
  useEffect(() => {
    if (
      isHealthModalOpen &&
      healthModalMember?.id &&
      memberHealthData[healthModalMember.id]
    ) {
      setHealthModalMember((prev) =>
        prev
          ? {
            ...prev,
            health: memberHealthData[prev.id],
          }
          : prev,
      );
    }
  }, [isHealthModalOpen, healthModalMember?.id, memberHealthData]);

  const handleAnalyzeHistory = async (memberId) => {
    setIsAnalyzing(true);
    setHistoryAnalysis(null);
    try {
      const res = await axios.post(
        API.AI_ANALYZE_HISTORY,
        { member_id: memberId },
        { withCredentials: true },
      );
      if (res.data?.status === "success") {
        setHistoryAnalysis(res.data.analysis);
      } else {
        toast.error(res.data?.message || t("family.aiError"));
      }
    } catch (err) {
      console.error("Analysis failed", err);
      toast.error(t("family.aiConnectError") || "Failed to connect to AI service");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshHealthModal = async () => {
    if (!healthModalMember?.id || isRefreshingHealth) return;
    setIsRefreshingHealth(true);
    try {
      await fetchMemberHealth(healthModalMember.id);
      toast.success("Health data refreshed");
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  // Map API data to FamilyMemberCard expected format
  const mapToCard = (m) => {
    const card = {
      id: m.member_id,
      name: m.username || m.email,
      relation: m.relation || "Family",
      alerts:
        m.status === "pending"
          ? [m.is_recipient ? t("family.statusPendingReceived") : t("family.statusPendingSent")]
          : [],
      avatar: m.profile_picture || null,
      health: memberHealthData[m.member_id] || null,
      status: m.status,
      isRecipient: !!m.is_recipient,
      link_id: m.link_id,
    };
    return card;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-600" />
            {t("family.title")}
          </h1>
          <p className="text-gray-500 font-bold mt-1 text-sm">
            {t("family.subtitle")}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          {t("family.addMember")}
        </Button>
      </div>

      {/* Members Grid */}
      {isFetching ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.link_id}
              member={mapToCard(member)}
              onViewHealth={
                member.status === "accepted" ? handleViewHealth : undefined
              }
              actions={
                member.status === "pending" && member.is_recipient ? (
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleAcceptInvite(member.link_id)}>
                      {t("common.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-100 text-red-600 hover:bg-red-50"
                      onClick={() => handleRejectInvite(member.link_id)}>
                      {t("common.decline")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 bg-white border-gray-100 hover:border-primary-200 transition-colors rounded-xl"
                      size="sm"
                      disabled={member.status !== "accepted"}
                      onClick={() => handleChat(member)}>
                      <MessageSquare className="w-4 h-4 mr-2 text-primary-600" />
                      {t("family.chat")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-white border-gray-100 hover:border-success-200 transition-colors rounded-xl"
                      size="sm"
                      disabled={member.status !== "accepted"}
                      onClick={() => handleCall(member)}>
                      <Phone className="w-4 h-4 mr-2 text-success-600" />
                      {t("family.call")}
                    </Button>
                    <button
                      onClick={() => handleRemoveMember(member.link_id)}
                      className="p-2 text-gray-400 hover:text-error-600 transition-colors rounded-xl hover:bg-error-50"
                      title={t("family.removeMember")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )
              }
            />
          ))}

          {/* Add New Placeholder */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 hover:border-primary-300 hover:bg-primary-50 transition-all group h-full min-h-[250px]">
            <div className="w-14 h-14 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors shadow-sm group-hover:shadow-md">
              <UserPlus className="w-7 h-7 group-hover:text-primary-600" />
            </div>
            <span className="font-black text-gray-900 group-hover:text-primary-700">
              {t("family.addMemberEmpty")}
            </span>
            <p className="text-xs font-bold mt-1 opacity-60">
              {t("family.inviteViaEmail")}
            </p>
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("family.addMemberEmpty")}>
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-sm text-gray-500">
            {t("family.modalDescription")}
          </p>
          <Input
            label={t("family.emailLabel")}
            placeholder={t("family.emailPlaceholder")}
            type="email"
            required
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1">
              {t("family.relation")}
            </label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
              value={newMemberRelation}
              required
              onChange={(e) => setNewMemberRelation(e.target.value)}>
              <option value="" disabled>
                {t("family.selectRelation")}
              </option>
              <option value="Father">{t("family.relations.father")}</option>
              <option value="Mother">{t("family.relations.mother")}</option>
              <option value="Brother">{t("family.relations.brother")}</option>
              <option value="Sister">{t("family.relations.sister")}</option>
              <option value="Grandfather">{t("family.relations.grandfather")}</option>
              <option value="Grandmother">{t("family.relations.grandmother")}</option>
              <option value="Son">{t("family.relations.son")}</option>
              <option value="Daughter">{t("family.relations.daughter")}</option>
              <option value="Other">{t("family.relations.other")}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t("family.sendInvitation")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal (direct family chat, not AI) */}
      {/* Chat Modal (direct family chat, not AI) */}
      <Modal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        title={
          activeMember
            ? t("family.chatWith", {
              name: activeMember.username || activeMember.email,
            })
            : t("family.chat")
        }
        size="full">
        <div className="flex flex-col h-[75vh] max-h-[700px] overflow-hidden">
          <div
            ref={chatScrollRef}
            className="flex-1 border border-gray-100 rounded-[2rem] p-5 mb-4 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-50/50 to-white scrollbar-hide">
            {chatLoading && !chatMessages.length ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  {t("common.loading")}
                </p>
              </div>
            ) : chatMessages.length ? (
              <div className="space-y-6">
                {chatMessages.map((m, idx) => {
                  const isMe =
                    chatCurrentUserId != null &&
                    m.from_user_id === chatCurrentUserId;
                  const time = m.created_at
                    ? new Date(m.created_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "";
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={cn(
                            "px-5 py-3.5 rounded-2xl text-[1.05rem] font-medium leading-relaxed shadow-sm",
                            isMe
                              ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-none"
                              : "bg-white border border-gray-100 text-gray-800 rounded-bl-none",
                          )}>
                          {m.message}
                        </div>
                        {time && (
                          <span className="text-[10px] font-black text-gray-400 mt-1.5 uppercase tracking-wider">
                            {time}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-500 opacity-30" />
                </div>
                <h4 className="text-gray-900 font-black text-lg mb-1">
                  Start Conversation
                </h4>
                <p className="text-gray-500 text-sm font-medium">
                  {t("family.chatEmpty") ||
                    "No messages yet. Send a message to start the conversation."}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 p-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder={
                  t("family.chatPlaceholder") || "Type your message..."
                }
                className="w-full text-base px-5 py-3.5 rounded-2xl border-2 border-transparent bg-gray-50 focus:bg-white focus:border-primary-100 outline-none transition-all placeholder:text-gray-400 placeholder:font-bold"
                disabled={chatSending}
              />
            </div>
            <Button
              className="w-16 h-16 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 shrink-0 flex items-center justify-center transition-all active:scale-90"
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim() || chatSending}
              loading={chatSending}>
              {!chatSending && <Send className="w-7 h-7" />}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Call Modal — shared WebRTC UI */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => endCall()}
        title=""
        hideHeader={true}
        size="full">
        <WebRTCCallUI
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
          isInCall={isInCall}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          callInfo={callInfo}
          mode="family"
          onAccept={handleAcceptIncoming}
          onDecline={handleDeclineIncoming}
          onEnd={() => endCall()}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onMinimize={() => {
            setIsCallModalOpen(false);
            setIsCallMinimized(true);
          }}
          showConnectionStatus={false}
        />
      </Modal>

      {/* Minimized PIP overlay */}
      {isInCall && isCallMinimized && callInfo && (
        <WebRTCCallUI
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          localStreamRef={localStreamRef}
          remoteStreamRef={remoteStreamRef}
          isInCall={isInCall}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          callInfo={callInfo}
          mode="family"
          isMinimized={true}
          onEnd={() => endCall()}
          onExpand={() => {
            setIsCallMinimized(false);
            setIsCallModalOpen(true);
          }}
        />
      )}
      {/* Health Details Modal */}
      <Modal
        isOpen={isHealthModalOpen}
        onClose={() => {
          setIsHealthModalOpen(false);
          setHealthModalMember(null);
        }}
        title={
          healthModalMember
            ? t("family.healthDetails", {
              name: healthModalMember.name,
            }) || `${healthModalMember.name}'s Health`
            : t("family.viewHealthDetails")
        }
        size="lg">
        {healthModalMember && !healthModalMember.health && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-3" />
            <p className="text-sm font-bold">Loading health history...</p>
          </div>
        )}
        {healthModalMember && healthModalMember.health?.error && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500 px-4">
            <p className="text-sm font-bold">Failed to load health data.</p>
            {healthModalMember.health?.errorMessage && (
              <p className="text-xs text-gray-600 mt-2 text-center max-w-md">{healthModalMember.health.errorMessage}</p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={handleRefreshHealthModal}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
        {healthModalMember && healthModalMember.health && !healthModalMember.health.error && (
          <div className="space-y-6">
            {/* Auto-refresh notice */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-2 rounded-xl">
              <RefreshCw className="w-3 h-3" />
              Auto-refreshes every 10s • Symptoms, prescriptions & family history update live
            </div>

            {/* Header / Profile Summary — full description */}
            <div className="flex items-center gap-4 bg-primary-50 p-4 rounded-2xl border border-primary-100">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-primary-500 shadow-sm shrink-0">
                {healthModalMember.avatar ||
                  healthModalMember.health.profile?.profilePic ? (
                  <img
                    src={
                      healthModalMember.avatar ||
                      healthModalMember.health.profile.profilePic
                    }
                    alt={healthModalMember.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  {healthModalMember.name}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {healthModalMember.relation}
                </p>
                {healthModalMember.health.profile?.email && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    {healthModalMember.health.profile.email}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {healthModalMember.health.profile?.age && (
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100">
                      {healthModalMember.health.profile.age}{" "}
                      {t("consultantsPage.years")}
                    </span>
                  )}
                  {healthModalMember.health.profile?.dob && (
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100">
                      <Calendar className="w-3 h-3 inline mr-0.5" />
                      DOB:{" "}
                      {new Date(
                        healthModalMember.health.profile.dob,
                      ).toLocaleDateString()}
                    </span>
                  )}
                  {healthModalMember.health.profile?.gender && (
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100 capitalize">
                      {healthModalMember.health.profile.gender}
                    </span>
                  )}
                  {healthModalMember.health.profile?.bloodGroup && (
                    <div className="flex items-center gap-1 text-xs font-bold text-error-600 bg-error-50 px-2 py-1 rounded-lg border border-error-100">
                      <Droplets className="w-3 h-3" />
                      {healthModalMember.health.profile.bloodGroup}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-black">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  {t("family.healthIntelligence")}
                </div>
                {!historyAnalysis && !isAnalyzing && (
                  <Button
                    size="sm"
                    onClick={() => handleAnalyzeHistory(healthModalMember.id)}
                    className="h-8 text-[10px] gap-1.5 bg-gradient-to-r from-indigo-600 to-primary-600 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    {t("family.aiAnalyzeAction")}
                  </Button>
                )}
              </div>

              {(historyAnalysis || isAnalyzing) && (
                <div className="border border-indigo-50 bg-indigo-50/30 rounded-2xl overflow-hidden ring-1 ring-indigo-50">
                  <div className="bg-gradient-to-r from-indigo-600/10 to-primary-600/10 p-3 flex items-center gap-2 border-b border-indigo-50">
                    <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                      {t("family.aiClinicalInsight")}
                    </span>
                  </div>
                  <div className="p-4">
                    {isAnalyzing ? (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                        <p className="text-xs font-bold text-gray-900">
                          {t("family.aiAnalyzing")}
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-xs prose-indigo max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {historyAnalysis}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Medical Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conditions */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-black">
                  <Heart className="w-4 h-4 text-primary-500" />
                  {t("family.conditions")}
                </div>
                {healthModalMember.health.profile?.conditions ? (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {healthModalMember.health.profile.conditions}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {t("family.noneListed")}
                  </p>
                )}
              </div>

              {/* Allergies */}
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-black">
                  <ShieldAlert className="w-4 h-4 text-warning-500" />
                  {t("family.allergies")}
                </div>
                {healthModalMember.health.profile?.allergies ? (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {healthModalMember.health.profile.allergies}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {t("family.noneListed")}
                  </p>
                )}
              </div>
            </div>

            {/* Parental History (Full width) */}
            {healthModalMember.health.profile?.parentalHistory &&
              (healthModalMember.health.profile.parentalHistory.length > 0 ||
                healthModalMember.health.profile.customParentalHistory) && (
                <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-gray-900 font-black">
                    <Users className="w-4 h-4 text-purple-500" />
                    {t("family.parentalHistory")}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {healthModalMember.health.profile.parentalHistory.map(
                      (h, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                          {h}
                        </span>
                      ),
                    )}
                  </div>
                  {healthModalMember.health.profile.customParentalHistory && (
                    <p className="text-xs text-gray-500 mt-2 border-t border-gray-50 pt-2">
                      <span className="font-bold">{t("family.other")}:</span>{" "}
                      {healthModalMember.health.profile.customParentalHistory}
                    </p>
                  )}
                </div>
              )}

            {/* Recent Symptoms */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2 text-gray-900 font-black">
                  <Thermometer className="w-4 h-4 text-error-500" />
                  {t("family.recentSymptoms")}
                </div>
                <span className="text-xs font-bold text-gray-400">
                  Last {healthModalMember.health.symptoms?.length || 0} entries
                </span>
              </div>

              {healthModalMember.health.symptoms &&
                healthModalMember.health.symptoms.length > 0 ? (
                <div className="space-y-3">
                  {healthModalMember.health.symptoms.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border border-gray-100 p-3 rounded-xl flex items-start justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {s.text}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] uppercase font-black px-1.5 py-0.5 rounded border",
                              s.severity === "severe"
                                ? "bg-error-50 text-error-600 border-error-100"
                                : s.severity === "moderate"
                                  ? "bg-warning-50 text-warning-600 border-warning-100"
                                  : "bg-success-50 text-success-600 border-success-100",
                            )}>
                            {t(`common.severities.${s.severity}`)}
                          </span>
                          {s.vitals && s.vitals.temp && (
                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              {s.vitals.temp}°C
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Thermometer className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    {t("family.noSymptoms")}
                  </p>
                </div>
              )}
            </div>

            {/* Recent Reports */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2 text-gray-900 font-black">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {t("family.recentReports")}
                </div>
                <span className="text-xs font-bold text-gray-400">
                  Last {healthModalMember.health.reports?.length || 0} entries
                </span>
              </div>

              {healthModalMember.health.reports &&
                healthModalMember.health.reports.length > 0 ? (
                <div className="space-y-3">
                  {healthModalMember.health.reports.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:border-primary-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">
                            {r.lab}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wide">
                            {r.type}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString()}
                        </span>
                      </div>

                      {/* AI Summary Preview if available */}
                      {r.summary && (
                        <div className="bg-primary-50/50 p-2 rounded-lg border border-primary-100/50 mb-2">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {r.summary}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            r.status === "Critical"
                              ? "bg-error-100 text-error-700"
                              : r.status === "Abnormal"
                                ? "bg-warning-100 text-warning-700"
                                : "bg-success-100 text-success-700",
                          )}>
                          {r.status || "Normal"}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          {r.testCount} tests
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    {t("family.noReports")}
                  </p>
                </div>
              )}
            </div>

            {/* Past Prescriptions */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2 text-gray-900 font-black">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  {t("family.prescriptions") || "Past Prescriptions"}
                </div>
                <span className="text-xs font-bold text-gray-400">
                  Last {healthModalMember.health.prescriptions?.length || 0}{" "}
                  entries
                </span>
              </div>

              {healthModalMember.health.prescriptions &&
                healthModalMember.health.prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {healthModalMember.health.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                      <div className="flex gap-3 justify-between items-start mb-2">
                        {rx.imagePath && (
                          <a
                            href={API.PRESCRIPTION_IMAGE(rx.imagePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                            <img
                              src={API.PRESCRIPTION_IMAGE(rx.imagePath)}
                              alt="Prescription"
                              className="w-full h-full object-cover"
                              crossOrigin="use-credentials"
                            />
                          </a>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">
                            {rx.meds?.map((m) => m.name).join(", ") ||
                              "No meds listed"}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-2">
                            {rx.note || rx.rawText || "No additional notes"}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rx.meds?.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {m.name} {m.dose && `(${m.dose})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <ShieldAlert className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    {t("family.noPrescriptions") || "No prescriptions found"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Family;
