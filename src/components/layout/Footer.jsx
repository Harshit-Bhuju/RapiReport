import React from "react";
import { useTranslation } from "react-i18next";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <img
                src={logoIcon}
                alt="R"
                className="h-20 w-20 object-contain transition-all"
              />
              <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">
                Rapi<span className="text-primary-600">Report</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {t("hero.subtitle")}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              {t("footer.builtInNepal")}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">{t("nav.home")}</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  {t("nav.features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  {t("nav.pricing")}
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  {t("nav.dashboard")}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary-600">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-primary-500" />
                info@rapireport.com.np
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-primary-500" />
                +977-1-4XXXXXX
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-primary-500" />
                Kathmandu, Nepal
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {currentYear} RapiReport Nepal. {t("footer.rights")}.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-primary-600">
              Facebook
            </a>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-primary-600">
              LinkedIn
            </a>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-primary-600">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
