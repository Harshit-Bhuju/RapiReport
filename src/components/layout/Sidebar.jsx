import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
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
  Activity,
  Utensils,
  Gift,
  History,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const mainGroups = [
    {
      title: "Overview",
      items: [
        {
          name: t("sidebar.dashboard"),
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        { name: t("sidebar.reports"), path: "/reports", icon: FileText },
        { name: "Medical history", path: "/medical-history", icon: History },
      ],
    },
    {
      title: "Health Intelligence",
      items: [
        { name: "Symptoms", path: "/symptoms", icon: Activity },
        { name: "Diet", path: "/diet", icon: Utensils },
        { name: "Prescriptions", path: "/prescriptions", icon: ScanLine },
      ],
    },
    {
      title: "Connect & Community",
      items: [
        {
          name: t("sidebar.consultation"),
          path: "/consultation",
          icon: MessageSquare,
        },
        { name: t("sidebar.doctors"), path: "/doctors", icon: Stethoscope },
        { name: "Family Health", path: "/family", icon: Users },
      ],
    },
    {
      title: "Discover",
      items: [
        { name: "Quest Game", path: "/quest-game", icon: Map },
        { name: "Marketplace", path: "/marketplace", icon: Gift },
      ],
    },
  ];

  // System/Admin items
  const systemItems = [
    ...(user?.role === "doctor"
      ? [
          {
            name: "Doctor Profile",
            path: "/doctor-profile",
            icon: ClipboardList,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [{ name: "Admin Panel", path: "/admin", icon: Shield }]
      : []),
  ];

  if (systemItems.length > 0) {
    mainGroups.push({
      title: "System",
      items: systemItems,
    });
  }

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
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 transition-all duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-5 flex items-center justify-between">
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <img
                  src={logoIcon}
                  alt="R"
                  className="h-12 w-12 object-contain transform transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-primary-600/10 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col ml-1">
                <span className="text-lg font-black text-gray-900 tracking-tighter leading-none flex items-center">
                  Rapi<span className="text-primary-600">Report</span>
                </span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-none mt-1">
                  Precision Health
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow px-3 space-y-4 overflow-y-auto scrollbar-hide py-2">
            {mainGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest opacity-80 mb-1">
                  {group.title}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[15px] font-semibold transition-all duration-200 group overflow-hidden",
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                      )
                    }>
                    {({ isActive }) => (
                      <>
                        <div
                          className={cn(
                            "absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-600 rounded-r-full transition-transform duration-200",
                            isActive ? "scale-y-100" : "scale-y-0",
                          )}
                        />

                        <item.icon
                          className={cn(
                            "w-4 h-4 min-w-[16px] transition-all duration-200",
                            isActive
                              ? "text-primary-600"
                              : "group-hover:text-primary-600",
                          )}
                        />
                        <span className="truncate tracking-tight">
                          {item.name}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
                {groupIdx < mainGroups.length - 1 && (
                  <div className="mt-4 mx-2 h-px bg-gray-50/80" />
                )}
              </div>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-3 border-t border-gray-100 mt-auto bg-gray-50/30">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2 rounded-lg transition-all duration-200 group",
                  isUserMenuOpen
                    ? "bg-white shadow-sm ring-1 ring-gray-100"
                    : "hover:bg-white",
                )}>
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 overflow-hidden ring-1 ring-white">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-xs">
                        {user?.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className="text-[13px] font-bold text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[9px] font-medium text-gray-400 truncate tracking-tight">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-gray-400 transition-transform duration-200",
                    isUserMenuOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Floating Menu */}
              {isUserMenuOpen && (
                <div
                  className={cn(
                    "absolute bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] transition-all",
                    "lg:left-full lg:bottom-0 lg:mb-0 lg:ml-4 lg:w-52",
                    "left-0 right-0 w-full",
                  )}>
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
