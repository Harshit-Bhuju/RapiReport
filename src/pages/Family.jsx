import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus, MessageSquare, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { FamilyMemberCard } from "@/components/ui/FamilyMemberCard";
import ChatInterface from "@/components/features/ChatInterface";
import { toast } from "react-hot-toast";

const Family = () => {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock Data
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Sita Sharma",
      relation: "Mother",
      healthScore: 85,
      completedTasks: 3,
      totalTasks: 5,
      alerts: [],
      avatar: null,
    },
    {
      id: 2,
      name: "Ram Sharma",
      relation: "Father",
      healthScore: 65,
      completedTasks: 1,
      totalTasks: 4,
      alerts: ["High Blood Pressure Alert"],
      avatar: null,
    },
    {
      id: 3,
      name: "Hari Sharma",
      relation: "Brother",
      healthScore: 92,
      completedTasks: 5,
      totalTasks: 5,
      alerts: [],
      avatar: null,
    },
  ]);

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(`Invitation sent to ${newMemberEmail}`);
      setIsLoading(false);
      setNewMemberEmail("");
      setIsAddModalOpen(false);

      // Optional: Add a pending member for visual feedback
      // setMembers([...members, { ...pendingMember }]);
    }, 1500);
  };

  const handleChat = (member) => {
    setActiveMember(member);
    setIsChatModalOpen(true);
  };

  const handleCall = (member) => {
    toast.success(`Calling ${member.name}...`);
    // Implement actual call logic here later
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-600" />
            Family Health
          </h1>
          <p className="text-gray-500 font-bold mt-1 text-sm">
            Monitor and support your family's health journey
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col h-full bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="flex-grow">
              <FamilyMemberCard
                member={member}
                className="shadow-none border-none h-full"
              />
            </div>

            <div className="p-5 pt-0 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-white border-gray-100 hover:border-primary-200 transition-colors"
                size="sm"
                onClick={() => handleChat(member)}>
                <MessageSquare className="w-4 h-4 mr-2 text-primary-600" />
                Chat
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-white border-gray-100 hover:border-success-200 transition-colors"
                size="sm"
                onClick={() => handleCall(member)}>
                <Phone className="w-4 h-4 mr-2 text-success-600" />
                Call
              </Button>
            </div>
          </div>
        ))}

        {/* Empty State / Add New Placeholder */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 hover:border-primary-300 hover:bg-primary-50 transition-all group h-full min-h-[250px]">
          <div className="w-14 h-14 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors shadow-sm group-hover:shadow-md">
            <Plus className="w-7 h-7 group-hover:text-primary-600" />
          </div>
          <span className="font-black text-gray-900 group-hover:text-primary-700">
            Add Family Member
          </span>
          <p className="text-xs font-bold mt-1 opacity-60">Invite via Email</p>
        </button>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Family Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter the email address of the family member you want to add. We
            will send them an invitation to join your family circle.
          </p>
          <Input
            label="Email Address"
            placeholder="member@example.com"
            type="email"
            required
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal */}
      <Modal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        title={activeMember ? `Chat with ${activeMember.name}` : "Chat"}
        size="lg">
        <div className="h-[500px]">
          {/* We reuse ChatInterface but ideally we would pass context. 
              For now relying on its internal mock logic but creating a visual wrapper. */}
          <ChatInterface isFullPage />
        </div>
      </Modal>
    </div>
  );
};

export default Family;
