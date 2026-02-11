import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, Search, Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ne" ? "en" : "ne";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600">
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-64">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t("common.quickSearch")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full border-2 border-white" />
              </button>
              <div className="h-8 w-[1px] bg-gray-100 mx-2" />
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                title={
                  i18n.language === "ne"
                    ? "Switch to English"
                    : "नेपालीमा बदल्नुहोस्"
                }>
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold">
                  {i18n.language === "ne" ? "English" : "नेपाली"}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 sm:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
