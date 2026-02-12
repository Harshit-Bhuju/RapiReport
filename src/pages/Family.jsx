import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { FamilyMemberCard } from "@/components/ui/FamilyMemberCard";
import ChatInterface from "@/components/features/ChatInterface";
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
  };

  const handleCall = (member) => {
    toast.success(`Calling ${member.username}...`);
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
          <Input
            label="Relation"
            placeholder="e.g. Mother, Father, Brother…"
            value={newMemberRelation}
            onChange={(e) => setNewMemberRelation(e.target.value)}
          />
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

      {/* Chat Modal */}
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
        size="lg">
        <div className="h-[500px]">
          <ChatInterface isFullPage />
        </div>
      </Modal>
    </div>
  );
};

export default Family;
