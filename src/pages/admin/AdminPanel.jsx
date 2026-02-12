import React, { useState, useMemo } from "react";
import {
  Shield,
  Users,
  Stethoscope,
  Search,
  UserCheck,
  Mail,
  BadgeCheck,
  Filter,
  Activity,
  Server,
  Terminal,
  Cpu,
  Globe,
  Send,
  Bell,
  ListRestart,
  Settings,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_USERS = [
  { id: 1, name: "Alex Johnson", email: "alex@example.com", role: "user" },
  { id: 2, name: "Dr. Sarah Chen", email: "sarah@example.com", role: "doctor" },
  { id: 3, name: "Sam Williams", email: "sam@example.com", role: "user" },
  { id: 4, name: "Maria Garcia", email: "maria@example.com", role: "user" },
  { id: 5, name: "Dr. James Lee", email: "james@example.com", role: "doctor" },
  { id: 6, name: "Emma Brown", email: "emma@example.com", role: "user" },
  { id: 7, name: "Admin User", email: "admin@example.com", role: "admin" },
];

const MOCK_HEALTH = [
  { label: "API Server", status: "online", latency: "45ms", load: "12%" },
  { label: "Database", status: "online", latency: "12ms", load: "8%" },
  { label: "AI Service", status: "online", latency: "850ms", load: "22%" },
  { label: "Auth Provider", status: "online", latency: "120ms", load: "5%" },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    action: "User Registered",
    user: "Emma Brown",
    time: "2 mins ago",
    type: "user",
  },
  {
    id: 2,
    action: "Role Changed",
    user: "Dr. James Lee",
    time: "15 mins ago",
    type: "system",
  },
  {
    id: 3,
    action: "Backup Created",
    user: "System",
    time: "1 hour ago",
    type: "system",
  },
  {
    id: 4,
    action: "Security Alert",
    user: "Unknown IP",
    time: "3 hours ago",
    type: "alert",
  },
];

const AdminPanel = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [assigningId, setAssigningId] = useState(null);

  const filteredUsers = useMemo(() => {
    let list = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    );
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      doctors: users.filter((u) => u.role === "doctor").length,
      users: users.filter((u) => u.role === "user").length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  const handleAssignDoctor = (targetUser) => {
    if (targetUser.role === "doctor") {
      toast.success(`${targetUser.name} is already a doctor.`);
      return;
    }
    setAssigningId(targetUser.id);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, role: "doctor" } : u,
        ),
      );
      setAssigningId(null);
      toast.success(`Assigned doctor role to ${targetUser.name}`);
    }, 600);
  };

  const handleRemoveDoctor = (targetUser) => {
    if (targetUser.role !== "doctor") return;
    setAssigningId(targetUser.id);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: "user" } : u)),
      );
      setAssigningId(null);
      toast.success(`Removed doctor role from ${targetUser.name}`);
    }, 600);
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
                  {stats.total}
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
                  {stats.doctors}
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
                  Regular Users
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {stats.users}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-lg shadow-gray-100/50 overflow-hidden">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Admins
                </p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {stats.admins}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary-600" />
                  System Monitoring
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-50 text-success-700 text-[10px] font-black uppercase">
                  <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                  Normal
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_HEALTH.map((h, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        {h.label.includes("AI") ? (
                          <Cpu className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <Settings className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {h.label}
                        </p>
                        <p className="text-xs text-gray-500">{h.latency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary-600 uppercase tracking-wider">
                        {h.load} Load
                      </p>
                      <p className="text-[10px] text-success-600 font-bold mt-0.5">
                        {h.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-gray-900 text-white font-mono text-xs overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Terminal className="w-3 h-3" />
                  <span>logs.stdout</span>
                </div>
                <div className="space-y-1">
                  <p className="text-success-400">[info] DB cluster-01 ok</p>
                  <p className="text-indigo-400">[ai] prompt:842ms</p>
                  <p className="text-gray-400">[net] GET /api/v1/users 200</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50 bg-gradient-to-br from-primary-600 to-indigo-700 text-white">
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-primary-200" />
                <h2 className="text-xl font-black">Broadcast</h2>
              </div>
              <div className="space-y-4">
                <textarea
                  placeholder="Broadcast message..."
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-primary-200 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none h-24"
                />
                <Button className="w-full bg-white text-primary-600 hover:bg-primary-50 border-none shadow-lg gap-2">
                  <Send className="w-4 h-4" />
                  Broadcast
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card className="border-none shadow-xl shadow-gray-100/50 h-full">
            <CardBody className="p-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6">
                <ListRestart className="w-5 h-5 text-primary-600" />
                Activity
              </h2>
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                {MOCK_ACTIVITY.map((act) => (
                  <div key={act.id} className="relative pl-10">
                    <div
                      className={cn(
                        "absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border-4 border-white z-10",
                        act.type === "alert"
                          ? "bg-error-50 text-error-600"
                          : act.type === "user"
                            ? "bg-success-50 text-success-600"
                            : "bg-primary-50 text-primary-600",
                      )}>
                      {act.type === "alert" ? (
                        <BadgeCheck className="w-4 h-4 rotate-180" />
                      ) : act.type === "user" ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <Terminal className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {act.action}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {act.user}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

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
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">
                          {u.name}
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
  );
};

export default AdminPanel;
