import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Users,
  Stethoscope,
  Search,
  Mail,
  Filter,
  Gift,
  Zap,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "@/Configs/ApiEndpoints";
import { useConfirmStore } from "@/store/confirmStore";

// Add new API endpoint to Configs/ApiEndpoints if needed, 
// for now we'll use a direct path for the new manage_rewards.php
const ADMIN_MANAGE_REWARDS = "/admin/manage_rewards.php";

const AdminPanel = () => {
  const openConfirm = useConfirmStore((s) => s.openConfirm);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_doctors: 0,
    scheduled_appointments: 0,
    completed_appointments: 0,
    total_revenue: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [editingPoints, setEditingPoints] = useState(null);
  const [newPoints, setNewPoints] = useState("");

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API.ADMIN_GET_USERS, { withCredentials: true });
      if (res.data.status === "success") {
        // Map username to name for the table (as per DB schema)
        const mappedUsers = res.data.users.map(u => {
          const name = u.username || u.email?.split('@')[0] || "User";
          return {
            ...u,
            name: name
          };
        });
        setUsers(mappedUsers);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(API.ADMIN_GET_ANALYTICS, { withCredentials: true });
      if (res.data.status === "success") {
        setStats(res.data.stats);
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const [assigningId, setAssigningId] = useState(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.name || u.username || "";
      const email = u.email || "";
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter, users]);

  const handleAssignDoctor = async (user) => {
    setAssigningId(user.id);
    try {
      const res = await axios.post(API.ADMIN_UPDATE_ROLE, {
        user_id: user.id,
        role: "doctor"
      }, { withCredentials: true });

      if (res.data.status === "success") {
        toast.success(`${user.name || user.username} has been assigned as a doctor`);
        fetchUsers();
        fetchStats(); // Update stats too
      } else {
        toast.error(res.data.message || "Failed to assign doctor role");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemoveDoctor = (u) => {
    openConfirm({
      title: "Remove doctor role?",
      message: `Remove doctor role from ${u.name || u.username}? They will no longer appear as a consultant.`,
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        setAssigningId(u.id);
        try {
          const res = await axios.post(API.ADMIN_UPDATE_ROLE, {
            user_id: u.id,
            role: "user"
          }, { withCredentials: true });

          if (res.data.status === "success") {
            toast.success(`${u.name || u.username}'s doctor role has been removed`);
            fetchUsers();
            fetchStats();
          } else {
            toast.error(res.data.message || "Failed to remove doctor role");
          }
        } catch (error) {
          toast.error("Error connecting to server");
        } finally {
          setAssigningId(null);
        }
      },
    });
  };

  const handleUpdatePoints = async (user, delta) => {
    try {
      const res = await axios.post(ADMIN_MANAGE_REWARDS, {
        action: 'adjust_points',
        user_id: user.id,
        points: delta
      }, { withCredentials: true });

      if (res.data.status === "success") {
        toast.success(`Points updated for ${user.username}`);
        fetchUsers();
        setEditingPoints(null);
      } else {
        toast.error(res.data.message || "Failed to update points");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    }
  };

  const getRoleBadge = (role) => {

    const styles = {
      admin: "bg-gray-100 text-gray-700 border-gray-200",
      doctor: "bg-primary-50 text-primary-700 border-primary-200",
      user: "bg-gray-50 text-gray-600 border-gray-100",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border capitalize",
          styles[role] || styles.user,
        )}>
        {role === "doctor" && <Stethoscope className="w-3 h-3" />}
        {role === "admin" && <Shield className="w-3 h-3" />}
        {role}
      </span>
    );
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Shield className="w-6 h-6" />
            </div>
            Admin Panel
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage users and monitor system health
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Users
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {stats.total_users}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Doctors
                </p>
                <p className="text-2xl font-black text-primary-600 mt-1">
                  {stats.total_doctors}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Points
                </p>
                <p className="text-2xl font-black text-orange-600 mt-1">
                  {users.reduce((acc, u) => acc + (u.cumulative_points || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tab bar */}
      <div className="flex gap-4 border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "pb-3 text-sm font-bold transition-all border-b-2",
            activeTab === "users" ? "border-primary-600 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
          )}>
          User Management
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={cn(
            "pb-3 text-sm font-bold transition-all border-b-2",
            activeTab === "rewards" ? "border-primary-600 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
          )}>
          Rewards & Points
        </button>
      </div>


      {activeTab === "users" ? (
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-11"
                  />
                </div>
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input appearance-none pr-10 min-w-[140px] bg-white cursor-pointer">
                    <option value="all">All roles</option>
                    <option value="user">User</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                        User
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="text-left py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="text-right py-4 px-3 sm:px-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-3 sm:px-6">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">
                              {u.name || "Unknown User"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 sm:px-6">
                          <span className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                            {u.email}
                          </span>
                        </td>
                        <td className="py-4 px-3 sm:px-6">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="py-4 px-3 sm:px-6 text-right">
                          {u.role === "admin" ? (
                            <span className="text-xs text-gray-400 font-medium">
                              —
                            </span>
                          ) : u.role === "doctor" ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={assigningId === u.id}
                              onClick={() => handleRemoveDoctor(u)}
                              className="text-error-600 border-error-200 hover:bg-error-50 text-xs h-auto py-1.5">
                              Remove
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={assigningId === u.id}
                              onClick={() => handleAssignDoctor(u)}
                              className="text-xs h-auto py-1.5">
                              {assigningId === u.id ? "..." : "Assign"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-xl shadow-gray-100/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Gift className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900">Points & Reward Management</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Current Points</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Quests Today</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Modify Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-gray-900">{u.username}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-black text-indigo-600">{u.cumulative_points || 0}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-bold text-gray-600">{u.quests_today || 0}/10</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {editingPoints === u.id ? (
                              <div className="flex items-center justify-end gap-2 animate-in slide-in-from-right duration-300">
                                <input
                                  type="number"
                                  value={newPoints}
                                  onChange={(e) => setNewPoints(e.target.value)}
                                  placeholder="+/- Points"
                                  className="w-24 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePoints(u, parseInt(newPoints))}
                                  disabled={!newPoints}
                                  className="h-8 text-[10px] px-3">
                                  Save
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingPoints(null)}
                                  className="h-8 text-[10px] px-3">
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingPoints(u.id);
                                  setNewPoints("");
                                }}
                                className="h-8 flex items-center gap-2 text-[10px] px-4">
                                <Edit2 className="w-3 h-3" />
                                Adjust
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
