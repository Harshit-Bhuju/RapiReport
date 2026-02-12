import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Menu, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ne" ? "en" : "ne");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600"
              aria-label="Toggle menu">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-2">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-6 h-6" />
              </button>
              <div className="h-8 w-px bg-gray-100" />
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold hidden sm:inline">
                  {i18n.language === "ne" ? "English" : "नेपाली"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
