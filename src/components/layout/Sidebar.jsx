import React from "react";
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();

  const navItems = [
    { name: t("sidebar.dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("sidebar.reports"), path: "/reports", icon: FileText },
    {
      name: t("sidebar.consultation"),
      path: "/consultation",
      icon: MessageSquare,
    },
    { name: t("sidebar.doctors"), path: "/doctors", icon: Stethoscope },
    { name: "Territory Game", path: "/territory-game", icon: Map },
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
          "fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300 transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-100">
                R
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">
                RapiReport
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow px-4 space-y-2 py-4">
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
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-6 border-t border-gray-50 mt-auto">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-black text-lg">
                    {user?.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-error-600 hover:bg-error-50 transition-all duration-200">
              <LogOut className="w-5 h-5" />
              {t("sidebar.signout")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
