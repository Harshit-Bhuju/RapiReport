import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Users,
  Stethoscope,
  Search,
  Mail,
  Filter,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "@/Configs/ApiEndpoints";

const AdminPanel = () => {
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

  const handleRemoveDoctor = async (user) => {
    setAssigningId(user.id);
    try {
      const res = await axios.post(API.ADMIN_UPDATE_ROLE, {
        user_id: user.id,
        role: "user"
      }, { withCredentials: true });

      if (res.data.status === "success") {
        toast.success(`${user.name || user.username}'s doctor role has been removed`);
        fetchUsers();
        fetchStats(); // Update stats too
      } else {
        toast.error(res.data.message || "Failed to remove doctor role");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setAssigningId(null);
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
      </div>


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
    </div>
  );
};

export default AdminPanel;
