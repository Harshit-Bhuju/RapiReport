import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  Stethoscope,
  ClipboardList,
  LogOut,
  X,
  ChevronDown,
  UserCog,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const DoctorSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const doctorNavItems = [
    { name: "Doctor Profile", path: "/doctor-profile", icon: ClipboardList },
  ];

  return (
    <>
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
          <div className="p-6 flex items-center justify-between">
            <Link to="/doctor-profile" className="flex items-center group">
              <div className="relative">
                <img
                  src={logoIcon}
                  alt="RapiReport"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-gray-900 tracking-tighter leading-none flex items-center gap-1">
                  <Stethoscope className="w-5 h-5 text-primary-600" />
                  Doctor
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">
                  RapiReport
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-grow px-4 space-y-1.5 py-6 overflow-y-auto">
            <div className="mb-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Doctor Menu
            </div>
            {doctorNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold transition-all duration-300 group",
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  )
                }>
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r transition-transform duration-300",
                        isActive ? "scale-y-100" : "scale-y-0",
                      )}
                    />
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  navigate("/dashboard");
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <ArrowLeft className="w-5 h-5" />
                Back to App
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all",
                  isUserMenuOpen ? "bg-white shadow-sm ring-1 ring-gray-100" : "hover:bg-white hover:shadow-sm",
                )}>
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold">{user?.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-grow min-w-0 text-left">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[10px] font-medium text-gray-400 truncate">{user?.email}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400", isUserMenuOpen && "rotate-180")} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsUserMenuOpen(false);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-primary-50 hover:text-primary-600">
                    <UserCog className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-error-600 hover:bg-error-50">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DoctorSidebar;
