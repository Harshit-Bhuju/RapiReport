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
  Zap,
  Lock,
  TrendingUp,
  Users,
  Activity,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Features & Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center">
            {/* Logo */}
            <div className="mb-12">
              <img src={logoIcon} alt="RapiReport" className="h-12 w-auto" />
            </div>

            {/* Main Heading */}
            <div className="mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-blue-200/50 text-blue-600 text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                {t("auth.badge")}
              </span>

              <h1 className="text-4xl xl:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                The future of
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  personal health
                </span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed">
                {t("auth.heroSubtitle")}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Analysis",
                  desc: "Advanced insights from your health data",
                  color: "blue",
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  desc: "HIPAA-compliant data protection",
                  color: "green",
                },
                {
                  icon: TrendingUp,
                  title: "Track Progress",
                  desc: "Monitor your health journey over time",
                  color: "purple",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      feature.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : feature.color === "green"
                          ? "bg-green-100 text-green-600"
                          : "bg-purple-100 text-purple-600"
                    }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-slate-200/50">
              <p className="text-sm text-slate-600 mb-4 font-medium">
                Trusted by 10,000+ users worldwide
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                      <img
                        src={`https://i.pravatar.cc/150?u=${i + 30}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-900">
                    4.9/5
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/50 p-8 sm:p-10">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-8 text-center">
                  <img
                    src={logoIcon}
                    alt="RapiReport"
                    className="h-10 w-auto mx-auto mb-6"
                  />
                </div>

                {/* Form Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                    {t("auth.createTitle")}
                  </h2>
                  <p className="text-slate-600">{t("auth.createSubtitle")}</p>
                </div>

                {/* Google Sign In Button */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full py-4 rounded-xl border-2 border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 bg-white text-slate-900 transition-all font-semibold text-base hover:border-slate-300 hover:shadow-md"
                  onClick={handleGoogleLogin}
                  loading={isLoading}>
                  {!isLoading && (
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-5 h-5"
                    />
                  )}
                  {t("auth.continueGoogle")}
                </Button>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500 font-medium">
                      Secure & Protected
                    </span>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      {t("auth.hipaa")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Encrypted
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-center text-slate-500 leading-relaxed">
                  {t("auth.termsAgree")}{" "}
                  <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {t("auth.terms")}
                  </button>{" "}
                  &{" "}
                  <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    {t("auth.privacy")}
                  </button>
                </p>
              </div>

              {/* Mobile Features */}
              <div className="lg:hidden mt-8 space-y-4">
                {[
                  {
                    icon: Brain,
                    title: "AI-Powered Analysis",
                    color: "blue",
                  },
                  {
                    icon: Shield,
                    title: "Secure & Private",
                    color: "green",
                  },
                  {
                    icon: TrendingUp,
                    title: "Track Progress",
                    color: "purple",
                  },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/50">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        feature.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : feature.color === "green"
                            ? "bg-green-100 text-green-600"
                            : "bg-purple-100 text-purple-600"
                      }`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-900 text-sm">
                      {feature.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
