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
  ChevronDown,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Mock users for UI — replace with API later
const MOCK_USERS = [
  { id: 1, name: "Alex Johnson", email: "alex@example.com", role: "user" },
  { id: 2, name: "Dr. Sarah Chen", email: "sarah@example.com", role: "doctor" },
  { id: 3, name: "Sam Williams", email: "sam@example.com", role: "user" },
  { id: 4, name: "Maria Garcia", email: "maria@example.com", role: "user" },
  { id: 5, name: "Dr. James Lee", email: "james@example.com", role: "doctor" },
  { id: 6, name: "Emma Brown", email: "emma@example.com", role: "user" },
  { id: 7, name: "Admin User", email: "admin@example.com", role: "admin" },
];

const AdminPanel = () => {
  const { user: currentUser } = useAuthStore();
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
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
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
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, role: "user" } : u,
        ),
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Shield className="w-6 h-6" />
            </div>
            Admin Panel
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage users and assign doctor roles
          </p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-11"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input appearance-none pr-10 min-w-[140px] bg-white cursor-pointer"
              >
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

      {/* User list */}
      <Card className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-16 text-center text-gray-500 font-medium"
                    >
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {u.email}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-4 px-6 text-right">
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
                            className="text-error-600 border-error-200 hover:bg-error-50"
                          >
                            {assigningId === u.id
                              ? "Updating..."
                              : "Remove doctor"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={assigningId === u.id}
                            onClick={() => handleAssignDoctor(u)}
                            className="gap-2"
                          >
                            {assigningId === u.id ? (
                              "Assigning..."
                            ) : (
                              <>
                                <BadgeCheck className="w-4 h-4" />
                                Assign doctor
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        UI only — user list is mock data. Connect your API to load real users
        and persist role changes.
      </p>
    </div>
  );
};

export default AdminPanel;
