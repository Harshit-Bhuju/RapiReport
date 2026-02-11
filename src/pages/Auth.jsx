import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Sparkles, ArrowRight } from "lucide-react";

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // Simulate Google OAuth
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary-50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] bg-success-50 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl shadow-gray-100 mb-8 border border-gray-50 group hover:scale-110 transition-transform">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              R
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            Health intelligence for everyone.
          </h1>
          <p className="text-gray-500 font-bold text-lg leading-relaxed">
            Step into the future of diagnostic reports with AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white/50">
            <CardBody className="p-8 sm:p-10">
              <div className="space-y-6">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full py-5 rounded-2xl border border-gray-200 flex items-center justify-center gap-4 hover:bg-gray-50 bg-white text-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm font-black text-lg"
                  onClick={handleGoogleLogin}
                  loading={isLoading}>
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-6 h-6"
                  />
                  Continue with Google
                </Button>

                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] text-center pt-2">
                  Secure OAuth 2.0 via Google
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-success-50 px-4 py-2 rounded-full border border-success-100">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span className="text-xs font-black text-success-700 uppercase tracking-wider">
              AI Systems Fully Operational
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
