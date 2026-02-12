import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";
import {
  Menu as MenuIcon,
  X,
  Globe,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user, updateProfile } = useAuthStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ne" ? "en" : "ne";
    i18n.changeLanguage(newLang);
    if (isAuthenticated) {
      updateProfile({ ...user, language: newLang });
    }
    setIsOpen(false);
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [{ name: t("nav.home"), path: "/" }];
    }

    if (user?.role === "admin") {
      return [{ name: t("nav.adminPanel"), path: "/admin" }];
    }

    if (user?.role === "doctor") {
      return [{ name: t("nav.dashboard"), path: "/doctor-dashboard" }];
    }

    // Role: user
    return [
      { name: t("nav.home"), path: "/" },
      { name: t("nav.dashboard"), path: "/dashboard" },
    ];
  };

  const navLinks = getNavLinks();

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === "admin") return "/admin";
    if (user?.role === "doctor") return "/doctor-dashboard";
    return "/dashboard";
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container-custom h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to={getHomePath()} className="flex items-center  group">
          <div className="relative">
            <img
              src={logoIcon}
              alt="R"
              className="h-14 w-14 sm:h-20 sm:w-20 object-contain transform transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-primary-600/10 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900 tracking-tighter leading-none flex items-center">
              Rapi<span className="text-primary-600">Report</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">
              {t("hero.mockTitle")}
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-lg font-bold text-gray-700 hover:text-blue-600 transition-colors font-outfit">
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold">
              {i18n.language === "ne" ? "English" : "नेपाली"}
            </span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">
                  {user?.name || "User"}
                </p>
                <button
                  onClick={logout}
                  className="text-[10px] text-gray-500 hover:text-error-600 flex items-center gap-1 ml-auto">
                  <LogOut className="w-3 h-3" />
                  {t("nav.logout")}
                </button>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                <User className="w-6 h-6" />
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}>
                {t("nav.login")}
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")}>
                {t("nav.signup")}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-4">
        <div className="md:hidden bg-white border-b border-gray-100 absolute w-full left-0 overflow-hidden">
          <div className="container-custom py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-gray-900 border-b border-gray-50 pb-2">
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-4 pt-2">
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-between w-full p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">{t("nav.language")}</span>
                </div>
                <span className="text-sm font-bold text-primary-600">
                  {i18n.language === "ne" ? "English" : "नेपाली"}
                </span>
              </button>

              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate("/auth");
                      setIsOpen(false);
                    }}>
                    {t("nav.login")}
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setIsOpen(false);
                    }}>
                    {t("nav.signup")}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}>
                  {t("nav.logout")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar;
