import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Activity,
  CheckCircle2,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuth(
        {
          name: "Prashant Dahal",
          email: "prashant.dahal@gmail.com",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prashant",
        },
        "fake-jwt-token",
      );
      toast.success("Welcome back, Prashant!");
      navigate("/dashboard");
    }, 1200);
  };

  const features = [
    {
      icon: <Activity className="w-5 h-5 text-primary-500" />,
      title: t("auth.feature1Title"),
      description: t("auth.feature1Desc"),
    },
    {
      icon: <Shield className="w-5 h-5 text-success-500" />,
      title: t("auth.feature2Title"),
      description: t("auth.feature2Desc"),
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary-500" />,
      title: t("auth.feature3Title"),
      description: t("auth.feature3Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Left Side: Marketing/Visual (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 items-center justify-center p-12">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-primary-700/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-0 w-80 h-80 bg-success-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-800/50 border border-primary-700/50 mb-8">
              <Sparkles className="w-4 h-4 text-primary-300" />
              <span className="text-xs font-bold text-primary-200 tracking-wide uppercase">
                {t("auth.badge")}
              </span>
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              {t("auth.heroTitle1")} <br />
              <span className="text-primary-400">{t("auth.heroTitle2")}</span>
            </h1>
            <p className="text-primary-100/80 text-lg mb-10 leading-relaxed font-medium">
              {t("auth.heroSubtitle")}
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="p-2 rounded-xl bg-white/10">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-primary-100/60 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-200 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-success-200 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[440px] relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10">
            <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white font-black text-2xl shadow-xl shadow-primary-200 mb-6 mx-auto">
              R
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              {t("auth.createTitle")}
            </h2>
            <p className="text-gray-500 font-medium">
              {t("auth.createSubtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}>
            <Card className="border-gray-200/50 shadow-2xl shadow-slate-200/60 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white">
              <CardBody className="p-8 sm:p-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {t("auth.sso")}
                    </p>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full py-6 rounded-2xl border border-gray-200 flex items-center justify-center gap-4 hover:bg-gray-50 bg-white text-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm font-bold text-lg"
                      onClick={handleGoogleLogin}
                      loading={isLoading}>
                      {!isLoading && (
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google"
                          className="w-6 h-6"
                        />
                      )}
                      {t("auth.continueGoogle")}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">
                        {t("auth.secureAccess")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-success-50 border border-success-100">
                    <Shield className="w-4 h-4 text-success-600" />
                    <span className="text-[11px] font-bold text-success-700 uppercase tracking-wider">
                      {t("auth.hipaa")}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center">
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              {t("auth.termsAgree")} <br />
              <button className="text-primary-600 font-bold hover:underline">
                {t("auth.terms")}
              </button>{" "}
              {t("auth.and")}{" "}
              <button className="text-primary-600 font-bold hover:underline">
                {t("auth.privacy")}
              </button>
              .
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
};

export default Auth;
