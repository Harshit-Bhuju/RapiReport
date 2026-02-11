import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name is too short").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setAuth(
        { name: data.name || "Prashant", email: data.email },
        "fake-jwt-token",
      );
      toast.success(
        isLogin ? "Welcome back!" : "Account created successfully!",
      );
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding/Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-primary-200">
            R
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? t("auth.login") : t("auth.signup")}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isLogin
              ? "Access your health intelligence"
              : "Join RapiReport today"}
          </p>
        </div>

        <Card className="shadow-2xl shadow-gray-200 border-none rounded-[2rem]">
          <CardBody className="p-8">
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                  isLogin
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}>
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                  !isLogin
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}>
                Signup
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}>
                    <Input
                      label="Full Name"
                      placeholder="Enter your name"
                      {...register("name")}
                      error={errors.name?.message}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label={t("auth.email")}
                type="email"
                placeholder="you@email.com"
                {...register("email")}
                error={errors.email?.message}
              />

              <div className="relative">
                <Input
                  label={t("auth.password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-100"
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    className="font-bold text-primary-600 hover:text-primary-700">
                    {t("auth.forgotPassword")}
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-4 rounded-2xl text-lg"
                loading={isLoading}>
                {isLogin ? t("auth.login") : t("auth.signup")}
                {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-center mt-8 text-sm text-gray-500 font-medium">
          {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-600 font-bold hover:underline">
            {isLogin ? t("nav.signup") : t("nav.login")}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
