import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import api from "@/lib/api";
import API from "@/Configs/ApiEndpoints";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import {
  CheckCircle2,
  Shield,
  ArrowRight,
  Sparkles,
  Brain,
} from "lucide-react";
import logoIcon from "@/assets/logos/rapireport_logo.png";

const Auth = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );

        const { sub, email, name, picture } = userInfo.data;

        const response = await api.post(API.GOOGLE_LOGIN, {
          google_id: sub,
          email: email,
          username: name,
          picture: picture,
        });

        if (
          response.data.status === "success" ||
          response.data.status === "not_null"
        ) {
          setAuth(response.data.user, tokenResponse.access_token);
          if (response.data.user.language) {
            i18n.changeLanguage(response.data.user.language);
          }
          toast.success(`Welcome back, ${response.data.user.name}!`);

          if (response.data.user.profileComplete) {
            navigate("/dashboard");
          } else {
            navigate("/profile-setup");
          }
        } else {
          toast.error(response.data.message || "Login failed");
        }
      } catch (error) {
        toast.error("Failed to login with Google");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error(t("auth.googleLoginFailed"));
    },
  });

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side: Immersive Visuals */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-slate-950 items-center justify-center p-20 overflow-hidden">
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 mesh-gradient-dark opacity-80" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary-600/20 blur-[120px] rounded-full animate-pulse" />
          <div
            className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-12">
              <Sparkles className="w-5 h-5 text-primary-400 animate-pulse" />
              <span className="text-xs font-black text-white tracking-[0.3em] uppercase">
                {t("auth.badge")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              The future of <br />
              <span className="text-primary-500">personal health.</span>
            </h1>

            <p className="text-primary-100/60 text-lg mb-16 leading-relaxed font-semibold max-w-md">
              {t("auth.heroSubtitle")}
            </p>

            {/* AI Guardian Visual Mock */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center text-white shadow-2xl">
                    <Brain className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-white font-black text-2xl tracking-tight mb-1">
                      RapiAI Guardian
                    </p>
                    <p className="text-primary-400 font-bold uppercase tracking-widest text-xs">
                      Active & Protecting
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="h-2.5 bg-white/10 rounded-full w-full relative overflow-hidden">
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"
                    />
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full w-[85%]" />
                  <div className="h-2.5 bg-white/10 rounded-full w-[60%]" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Elegant Auth Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-20 bg-white relative">
        <div className="w-full max-w-[480px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-5 tracking-tight">
              {t("auth.createTitle")}
            </h2>
            <p className="text-slate-500 text-lg font-semibold opacity-70">
              {t("auth.createSubtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}>
            <div className="space-y-12">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
                  Social Authentication
                </p>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full py-8 rounded-[2rem] border-2 border-slate-100 flex items-center justify-center gap-6 hover:bg-slate-50 bg-white text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200/50 font-black text-xl"
                  onClick={handleGoogleLogin}
                  loading={isLoading}>
                  {!isLoading && (
                    <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-50">
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-6 h-6"
                      />
                    </div>
                  )}
                  {t("auth.continueGoogle")}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.5em]">
                  <span className="bg-white px-8 text-slate-400">
                    Secure Checkpoint
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-success-50/50 border border-success-100 w-full sm:w-auto">
                  <Shield className="w-5 h-5 text-success-600" />
                  <span className="text-xs font-black text-success-700 uppercase tracking-widest">
                    {t("auth.hipaa")}
                  </span>
                </div>
                <div className="flex items-center gap-4 py-3 px-6 rounded-2xl bg-primary-50/50 border border-primary-100 w-full sm:w-auto">
                  <Activity className="w-5 h-5 text-primary-600" />
                  <span className="text-xs font-black text-primary-700 uppercase tracking-widest">
                    Encrypted Data
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <footer className="mt-20 text-center lg:text-left opacity-60">
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-sm">
              {t("auth.termsAgree")} <br />
              <button className="text-primary-600 hover:text-primary-700 transition-colors">
                {t("auth.terms")}
              </button>{" "}
              &{" "}
              <button className="text-primary-600 hover:text-primary-700 transition-colors">
                {t("auth.privacy")}
              </button>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Auth;
