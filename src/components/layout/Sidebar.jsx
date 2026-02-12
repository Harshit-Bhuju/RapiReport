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
  Map,
  Users,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { name: t("sidebar.dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("sidebar.reports"), path: "/reports", icon: FileText },
    {
      name: t("sidebar.consultation"),
      path: "/consultation",
      icon: MessageSquare,
    },
    { name: "Family Health", path: "/family", icon: Users },
    { name: t("sidebar.doctors"), path: "/doctors", icon: Stethoscope },
    { name: "Quest Game", path: "/quest-game", icon: Map },
    { name: t("sidebar.risk"), path: "/prevention", icon: ShieldAlert },
    { name: t("sidebar.planner"), path: "/planner", icon: CalendarCheck },
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
          <nav className="flex-grow px-4 space-y-2 py-4 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group",
                    isActive
                      ? "bg-primary-50 text-primary-600 shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                  )
                }>
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    "group-hover:text-primary-600",
                  )}
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-gray-50 mt-auto bg-white/50 backdrop-blur-sm">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group",
                isUserMenuOpen ? "bg-gray-50" : "hover:bg-gray-50",
              )}>
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-black text-base">
                    {user?.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-grow min-w-0 text-left">
                <p className="text-sm font-black text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                  {user?.email}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform duration-200",
                  isUserMenuOpen && "rotate-180",
                )}
              />
            </button>

            {/* Collapsible Sign Out */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isUserMenuOpen
                  ? "max-h-40 mt-2 opacity-100"
                  : "max-h-0 opacity-0",
              )}>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsUserMenuOpen(false);
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all duration-200">
                <UserCog className="w-5 h-5 text-primary-500" />
                {t("common.edit") || "Edit"} Profile
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-error-600 hover:bg-error-50 transition-all duration-200">
                <LogOut className="w-5 h-5" />
                {t("sidebar.signout")}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
