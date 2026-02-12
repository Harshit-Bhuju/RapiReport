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
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { FamilyMemberCard } from "@/components/ui/FamilyMemberCard";
import { toast } from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Family = () => {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [members, setMembers] = useState([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callInfo, setCallInfo] = useState(null); // { member, roomId, callId, isCaller }
  const [isInCall, setIsInCall] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatCurrentUserId, setChatCurrentUserId] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);

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

  // Setup simple ringtone audio (you need to place the mp3 files in /public/sounds)
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

  const startIncomingRingtone = () => {
    try {
      incomingAudioRef.current && incomingAudioRef.current.play();
    } catch {
      // ignore autoplay errors
    }
  };

  const stopIncomingRingtone = () => {
    if (incomingAudioRef.current) {
      incomingAudioRef.current.pause();
      incomingAudioRef.current.currentTime = 0;
    }
  };

  const startOutgoingRingtone = () => {
    try {
      outgoingAudioRef.current && outgoingAudioRef.current.play();
    } catch {
      // ignore autoplay errors
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
  }, [isCallModalOpen, isCallMinimized]);

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
      pcRef.current.close();
      pcRef.current = null;
    }

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
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
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

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
      }
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;

      // Set initial states: video OFF, mic ON
      stream.getVideoTracks().forEach(track => track.enabled = false);
      stream.getAudioTracks().forEach(track => track.enabled = true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch (err) {
      toast.error(t("family.callPermissionError"));
      console.error("Failed to get user media", err);
      throw err;
    }

    pcRef.current = pc;
    return pc;
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
          if (!pcRef.current) continue;

          if (s.type === "offer" && !isCaller) {
            const desc = new RTCSessionDescription(s.payload);
            await pcRef.current.setRemoteDescription(desc);
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
          } else if (s.type === "answer" && isCaller) {
            if (!pcRef.current.remoteDescription) {
              const desc = new RTCSessionDescription(s.payload);
              await pcRef.current.setRemoteDescription(desc);
            }
          } else if (s.type === "candidate") {
            try {
              const candidate = new RTCIceCandidate(s.payload);
              await pcRef.current.addIceCandidate(candidate);
            } catch (err) {
              console.error("Error adding ICE candidate", err);
            }
          } else if (s.type === "end") {
            toast(t("family.callEnded"));
            await endCall(false);
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
        toast.success(`${res.data.member?.username || newMemberEmail} added!`);
        setNewMemberEmail("");
        setNewMemberRelation("");
        setIsAddModalOpen(false);
        fetchMembers();
      } else {
        toast.error(res.data?.message || "Failed to add member.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not add member. Try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (linkId) => {
    if (
      !window.confirm(
        t("family.confirmRemove") || "Are you sure you want to remove this family member?",
      )
    ) {
      return;
    }
    try {
      const res = await axios.post(
        API.FAMILY_REMOVE,
        { id: linkId },
        { withCredentials: true },
      );
      if (res.data?.status === "success") {
        toast.success("Member removed.");
        setMembers((prev) => prev.filter((m) => m.link_id !== linkId));
      } else {
        toast.error(res.data?.message || "Remove failed.");
      }
    } catch (err) {
      toast.error("Error removing member.");
    }
  };

  const handleChat = (member) => {
    setActiveMember(member);
    setIsChatModalOpen(true);
    setChatMessages([]);
    setChatInput("");
    setChatCurrentUserId(null);
  };

  const fetchChatMessages = useCallback(
    async (linkId) => {
      if (!linkId) return;
      try {
        setChatLoading(true);
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
      } finally {
        setChatLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isChatModalOpen || !activeMember?.link_id) {
      cleanupChatPolling();
      return;
    }

    // Initial load
    fetchChatMessages(activeMember.link_id);

    // Poll every 3s
    if (!chatPollIntervalRef.current) {
      chatPollIntervalRef.current = setInterval(() => {
        fetchChatMessages(activeMember.link_id);
      }, 3000);
    }

    return () => {
      cleanupChatPolling();
    };
  }, [isChatModalOpen, activeMember, fetchChatMessages]);

  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || !activeMember?.link_id) return;
    try {
      await axios.post(
        API.FAMILY_CHAT,
        { link_id: activeMember.link_id, message: text },
        { withCredentials: true },
      );
      setChatInput("");
      // Optimistic refresh
      fetchChatMessages(activeMember.link_id);
    } catch (err) {
      console.error("Failed to send chat message", err);
      toast.error(t("family.chatSendFailed") || "Failed to send message.");
    }
  };

  const handleCall = async (member) => {
    try {
      // Reset toggle states for new call
      setIsCameraOn(false);
      setIsMicOn(true);

      const res = await axios.post(
        API.FAMILY_CALL_START,
        { member_user_id: member.member_id },
        { withCredentials: true },
      );

      if (res.data?.status !== "success" || !res.data.call) {
        toast.error(
          res.data?.message || t("family.callFailed", { name: member.username }),
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
      setIsInCall(true);
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
      setIsCameraOn(false);
      setIsMicOn(true);

      await axios.post(
        API.FAMILY_CALL_STATUS,
        { callId, action: "accept" },
        { withCredentials: true },
      );

      lastSignalIdRef.current = 0;
      await createPeerConnection(member, roomId, false);
      startSignalPolling(roomId, member, false);
      setIsInCall(true);
      setIsCallMinimized(false);
      stopIncomingRingtone();
      toast.success(
        t("family.callConnected", {
          name: member.username || member.email,
        }),
      );
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

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(prev => !prev);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(prev => !prev);
    }
  };

  // Map API data to FamilyMemberCard expected format
  const mapToCard = (m) => ({
    id: m.member_id,
    name: m.username || m.email,
    relation: m.relation || "Family",
    healthScore: 80, // placeholder until real health data is linked
    completedTasks: 0,
    totalTasks: 0,
    alerts: m.status === "pending" ? ["Invitation pending"] : [],
    avatar: m.profile_picture || null,
  });

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
              actions={
                <>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white border-gray-100 hover:border-primary-200 transition-colors rounded-xl"
                    size="sm"
                    onClick={() => handleChat(member)}>
                    <MessageSquare className="w-4 h-4 mr-2 text-primary-600" />
                    {t("family.chat")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white border-gray-100 hover:border-success-200 transition-colors rounded-xl"
                    size="sm"
                    onClick={() => handleCall(member)}>
                    <Phone className="w-4 h-4 mr-2 text-success-600" />
                    {t("family.call")}
                  </Button>
                  <button
                    onClick={() => handleRemoveMember(member.link_id)}
                    className="p-2 text-gray-400 hover:text-error-600 transition-colors rounded-xl hover:bg-error-50"
                    title="Remove member">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
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
            <label className="text-sm font-bold text-gray-700 ml-1">Relation</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
              value={newMemberRelation}
              required
              onChange={(e) => setNewMemberRelation(e.target.value)}
            >
              <option value="" disabled>Select relation...</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Other">Other</option>
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
        <div className="flex flex-col h-[70vh] max-h-[600px] overflow-hidden">
          <div className="flex-1 border border-gray-100 rounded-2xl p-3 mb-3 overflow-y-auto overflow-x-hidden bg-gray-50/60 text-xs">
            {chatLoading && !chatMessages.length ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {t("common.loading")}
              </div>
            ) : chatMessages.length ? (
              chatMessages.map((m) => {
                const isMe =
                  chatCurrentUserId != null && m.from_user_id === chatCurrentUserId;
                return (
                  <div
                    key={m.id}
                    className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span
                      className={`px-2 py-1 rounded-xl max-w-[75%] break-words overflow-wrap-anywhere ${isMe
                        ? "bg-primary-100 text-primary-900"
                        : "bg-white border border-gray-100 text-gray-800"
                        }`}>
                      {m.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {t("family.chatEmpty") ||
                  "No messages yet. Start the conversation with your family member."}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              placeholder={t("family.chatPlaceholder") || "Type a message..."}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700"
            />
            <Button
              size="sm"
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim()}>
              {t("family.chatSend") || "Send"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Call Modal - Instagram Style */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => endCall()}
        title={
          callInfo
            ? callInfo.isCaller
              ? t("family.calling", {
                name: callInfo.member.username || callInfo.member.email,
              })
              : t("family.incomingCallTitle", {
                name: callInfo.member.username || callInfo.member.email,
              })
            : t("family.call")
        }
        size="full">
        <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
          {/* Remote video full-screen background - Always rendered */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile picture overlay - Only show when not in call (ringing state) */}
          {!isInCall && callInfo?.member && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 z-10">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 shadow-2xl">
                {callInfo.member.profile_picture ? (
                  <img
                    src={callInfo.member.profile_picture}
                    alt={callInfo.member.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-white">
                    {(callInfo.member.username || callInfo.member.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {callInfo.member.username || callInfo.member.email}
              </h3>
              <p className="text-gray-300 text-sm">
                {callInfo.isCaller ? "Calling..." : "Incoming call"}
              </p>
            </div>
          )}

          {/* Local video preview - Always show during calls */}
          {isInCall && (
            <div className="absolute top-4 right-4 w-32 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-10">
              {isCameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-black"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-white/80" />
                </div>
              )}
            </div>
          )}

          {/* Floating controls at bottom - Instagram style */}
          {isInCall && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
              {/* Mic toggle */}
              <button
                onClick={toggleMic}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMicOn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
                  }`}>
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Camera toggle */}
              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCameraOn
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
                  }`}>
                {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              {/* End call button */}
              <button
                onClick={() => endCall()}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg">
                <Phone className="w-6 h-6 rotate-135" />
              </button>

              {/* Minimize button */}
              <button
                onClick={() => {
                  setIsCallModalOpen(false);
                  setIsCallMinimized(true);
                }}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-lg">
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Incoming call controls */}
          {!isInCall && !callInfo?.isCaller && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
              <button
                onClick={handleDeclineIncoming}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg">
                <Phone className="w-7 h-7 rotate-135" />
              </button>
              <button
                onClick={handleAcceptIncoming}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all shadow-lg">
                <Phone className="w-7 h-7" />
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Minimized call overlay (like Instagram PIP) */}
      {isInCall && isCallMinimized && callInfo && (
        <div className="fixed bottom-4 right-4 z-40 w-64 h-40 bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="relative flex-1">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {isCameraOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-20 h-14 object-cover absolute bottom-2 right-2 rounded-lg border border-white/40"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-20 h-14 absolute bottom-2 right-2 rounded-lg border border-white/40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <VideoOff className="w-5 h-5 text-white/80" />
              </div>
            )}
          </div>
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              onClick={() => {
                setIsCallMinimized(false);
                setIsCallModalOpen(true);
              }}
              className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Expand">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => endCall()}
              className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Hang up">
              <Phone className="w-3 h-3 rotate-135" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Family;
