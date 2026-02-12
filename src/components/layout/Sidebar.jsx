import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ShieldAlert,
  CalendarCheck,
  LogOut,
  X,
  Stethoscope,
  ScanLine,
  Map,
  Users,
  ChevronDown,
  UserCog,
  Shield,
  ClipboardList,
  Pill,
  Activity,
  Footprints,
  Utensils,
  Gift,
  Megaphone,
  History,
  BellRing,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const baseNavItems = [
    { name: t("sidebar.dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("sidebar.reports"), path: "/reports", icon: FileText },
    { name: "Prescriptions", path: "/prescriptions", icon: ScanLine },
    { name: "Adherence", path: "/adherence", icon: Pill },
    { name: "Symptoms", path: "/symptoms", icon: Activity },
    { name: "Activity", path: "/activity", icon: Footprints },
    { name: "Diet", path: "/diet", icon: Utensils },
    {
      name: t("sidebar.consultation"),
      path: "/consultation",
      icon: MessageSquare,
    },
    { name: "Family Health", path: "/family", icon: Users },
    { name: t("sidebar.doctors"), path: "/doctors", icon: Stethoscope },
    { name: "Quest Game", path: "/quest-game", icon: Map },
    { name: "Marketplace", path: "/marketplace", icon: Gift },
    { name: "Campaigns", path: "/campaigns", icon: Megaphone },
    { name: "Medical history", path: "/medical-history", icon: History },
    { name: "Alerts", path: "/alerts", icon: BellRing },
    { name: "Community", path: "/community", icon: BarChart3 },
    { name: t("sidebar.risk"), path: "/prevention", icon: ShieldAlert },
    { name: t("sidebar.planner"), path: "/planner", icon: CalendarCheck },
  ];

  const adminNav = { name: "Admin Panel", path: "/admin", icon: Shield };
  const doctorProfileNav = {
    name: "Doctor Profile",
    path: "/doctor-profile",
    icon: ClipboardList,
  };

  const navItems = [
    ...baseNavItems,
    ...(user?.role === "doctor" ? [doctorProfileNav] : []),
    ...(user?.role === "admin" ? [adminNav] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transition-all duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <img
                  src={logoIcon}
                  alt="R"
                  className="h-16 w-16 object-contain transform transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-primary-600/10 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-gray-900 tracking-tighter leading-none flex items-center">
                  Rapi<span className="text-primary-600">Report</span>
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">
                  Precision Health Insights
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow px-4 space-y-1 overflow-y-auto scrollbar-hide">
            <div className="mb-4 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] opacity-80">
              Menu
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group overflow-hidden mb-0.5",
                    isActive
                      ? "bg-primary-50 text-primary-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  )
                }>
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 bg-primary-600 transition-transform duration-300",
                        isActive ? "scale-y-100" : "scale-y-0",
                      )}
                    />

                    <item.icon
                      className={cn(
                        "w-5 h-5 min-w-[20px] transition-all duration-300",
                        isActive
                          ? "text-primary-600"
                          : "group-hover:text-primary-600 group-hover:scale-110",
                      )}
                    />
                    <span className="truncate tracking-tight">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/30 backdrop-blur-sm">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group",
                  isUserMenuOpen
                    ? "bg-white shadow-sm ring-1 ring-gray-100"
                    : "hover:bg-white hover:shadow-sm",
                )}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 overflow-hidden ring-2 ring-white">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-base">
                        {user?.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] font-medium text-gray-400 truncate  tracking-tighter">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-300",
                    isUserMenuOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Floating Menu on the Right */}
              {isUserMenuOpen && (
                <div className="absolute left-full bottom-0 ml-4 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] transition-all">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsUserMenuOpen(false);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors">
                      <UserCog className="w-4 h-4" />
                      {t("common.edit") || "Edit"} Profile
                    </button>
                    <div className="h-px bg-gray-50 mx-2" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-error-600 hover:bg-error-50 rounded-xl transition-colors">
                      <LogOut className="w-4 h-4" />
                      {t("sidebar.signout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
