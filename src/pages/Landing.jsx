import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  ChevronRight,
  CheckCircle2,
  FileText,
  LineChart,
  Brain,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden mesh-gradient">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 blur-[120px] rounded-full animate-float"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full animate-float"
          style={{ animationDuration: "15s", animationDelay: "2s" }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-xl text-primary-700 text-xs font-black mb-10 border border-white shadow-xl shadow-primary-100/20 uppercase tracking-[0.2em]">
                <Sparkles className="w-4 h-4 animate-pulse" />
                {t("hero.badge")}
              </motion.div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.05] mb-10 tracking-tight text-glow">
                {t("hero.title")
                  .split(" ")
                  .map((word, i) => (
                    <span
                      key={i}
                      className={i === 1 ? "text-primary-600 block" : ""}>
                      {word}{" "}
                    </span>
                  ))}
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-14 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-semibold opacity-80">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-12 py-8 text-xl font-black rounded-3xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)] active:scale-95 transition-all bg-primary-600 text-white"
                  onClick={() => navigate("/auth")}>
                  {t("hero.cta")}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>

                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform cursor-pointer">
                      <img
                        src={`https://i.pravatar.cc/150?u=${i + 10}`}
                        alt="User"
                      />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-lg">
                    10K+
                  </div>
                </div>
              </div>

              <div className="mt-16 flex flex-wrap justify-center lg:justify-start gap-10">
                <div className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  {t("hero.noCard")}
                </div>
                <div className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  {t("hero.trustedLabs")}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full relative perspective-[2000px]">
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -15, rotateX: 5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, rotateX: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="relative z-20 group">
              {/* Main App Mockup Card */}
              <div className="relative rounded-[3rem] glass-card border-white/50 overflow-hidden transform group-hover:-translate-y-4 transition-all duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] ring-1 ring-white/20">
                <div className="p-8 bg-white/40 border-b border-white/40 flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-error-400 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-warning-400 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-success-400 shadow-inner" />
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-white/50 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/50">
                    {t("hero.mockTitle")}
                  </div>
                </div>

                <div className="p-8 sm:p-12">
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-8 rounded-[2rem] bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-100 shadow-sm relative overflow-hidden">
                      <p className="text-[10px] text-primary-600 font-black tracking-widest mb-3 uppercase">
                        {t("hero.hemoglobin")}
                      </p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">
                        14.2{" "}
                        <span className="text-sm font-bold text-gray-400">
                          g/dL
                        </span>
                      </p>
                      <div className="mt-5 h-2.5 bg-primary-100/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 2, delay: 1 }}
                          className="h-full bg-primary-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-8 rounded-[2rem] bg-gradient-to-br from-warning-500/10 to-transparent border border-warning-100 shadow-sm relative overflow-hidden">
                      <p className="text-[10px] text-warning-600 font-black tracking-widest mb-3 uppercase">
                        {t("hero.bloodSugar")}
                      </p>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">
                        98{" "}
                        <span className="text-sm font-bold text-gray-400">
                          mg/dL
                        </span>
                      </p>
                      <div className="mt-5 h-2.5 bg-warning-100/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }}
                          transition={{ duration: 2, delay: 1.2 }}
                          className="h-full bg-warning-600 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        />
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-6">
                    <div className="h-6 bg-gray-100/40 rounded-full w-full relative overflow-hidden">
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      />
                    </div>
                    <div className="h-6 bg-gray-100/40 rounded-full w-5/6" />
                    <div className="h-6 bg-gray-100/40 rounded-full w-4/6" />
                  </div>
                </div>
              </div>

              {/* Enhanced Floating Cards */}
              <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, -2, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-10 -right-10 p-6 rounded-[2rem] bg-white/80 backdrop-blur-2xl shadow-2xl z-30 border border-white group/float cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 flex items-center justify-center text-white shadow-xl group-hover/float:scale-110 transition-transform">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">
                      AI Analysis
                    </p>
                    <p className="text-base font-black text-gray-900 tracking-tight leading-none">
                      Insights Generated
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, 2, 0] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-10 -left-10 p-6 rounded-[2rem] bg-white/80 backdrop-blur-2xl shadow-2xl z-30 border border-white group/float cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success-500 to-emerald-700 flex items-center justify-center text-white shadow-xl group-hover/float:scale-110 transition-transform">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-success-600 uppercase tracking-[0.2em] mb-1">
                      {t("hero.status")}
                    </p>
                    <p className="text-base font-black text-gray-900 tracking-tight leading-none">
                      {t("hero.healthVerified")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Subtle glow behind the mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary-200/20 blur-[150px] rounded-full -z-10 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("stats.reportsProcessed"),
      value: "10K+",
      color: "from-primary-600 to-indigo-600",
    },
    {
      label: t("stats.partnerLabs"),
      value: "50+",
      color: "from-indigo-600 to-primary-600",
    },
    {
      label: t("stats.userRating"),
      value: "4.9/5",
      color: "from-primary-600 to-indigo-600",
    },
  ];

  return (
    <section className="relative py-20 bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
      </div>
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}>
              <p
                className={cn(
                  "text-5xl md:text-7xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r",
                  stat.color,
                )}>
                {stat.value}
              </p>
              <p className="text-lg font-bold text-gray-400 uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
      icon: UploadCloud,
      color: "bg-blue-500",
      shadow: "shadow-blue-200",
    },
    {
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
      icon: Brain,
      color: "bg-primary-600",
      shadow: "shadow-primary-200",
    },
    {
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
      icon: LineChart,
      color: "bg-success-500",
      shadow: "shadow-success-200",
    },
  ];

  return (
    <section className="py-40 bg-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container-custom">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-32">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary-600 text-sm font-black uppercase tracking-[0.4em] mb-6">
              {t("howItWorks.subtitle")}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black text-gray-900 tracking-[-0.03em] leading-tight">
              {t("howItWorks.title")}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="hidden lg:block pb-4">
            <div className="flex items-center gap-4 text-gray-400 font-bold uppercase tracking-widest text-xs">
              <span className="w-12 h-px bg-gray-200" />
              Scroll to explore
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.8 }}
              className="relative group">
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-dashed-gradient z-0 opacity-20" />
              )}

              <div className="relative z-10 p-10 rounded-[3rem] bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] group-hover:-translate-y-4 transition-all duration-500 ring-1 ring-transparent group-hover:ring-primary-100">
                <div className="relative mb-12">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10",
                      step.color,
                      step.shadow,
                    )}>
                    <step.icon className="w-10 h-10" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-900 font-black text-xl border-4 border-gray-50 group-hover:border-white transition-colors">
                    0{idx + 1}
                  </div>
                </div>

                <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight group-hover:text-primary-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-semibold opacity-70 text-lg">
                  {step.desc}
                </p>

                <div className="mt-10 h-1.5 w-12 bg-gray-200 rounded-full group-hover:w-full group-hover:bg-primary-500 transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t("features.feature1.title"),
      desc: t("features.feature1.desc"),
      icon: Zap,
      color: "from-blue-500 to-indigo-600",
      delay: 0.1,
    },
    {
      title: t("features.feature2.title"),
      desc: t("features.feature2.desc"),
      icon: LineChart,
      color: "from-indigo-600 to-primary-600",
      delay: 0.2,
    },
    {
      title: t("features.feature3.title"),
      desc: t("features.feature3.desc"),
      icon: Users,
      color: "from-primary-600 to-violet-600",
      delay: 0.3,
    },
  ];

  return (
    <section
      id="features"
      className="py-40 bg-slate-950 relative overflow-hidden">
      {/* Dynamic background elements for dark section */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600 rounded-full blur-[150px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-primary-400 text-sm font-black uppercase tracking-[0.5em] mb-8">
            {t("features.subtitle")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
            {t("features.title")}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}>
              <div className="h-full p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] transition-all duration-500 group relative overflow-hidden">
                <div
                  className={cn(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mb-10 transition-all group-hover:scale-110 group-hover:-rotate-6 shadow-2xl bg-gradient-to-br",
                    feature.color,
                  )}>
                  <feature.icon className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 tracking-tight group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-semibold text-lg opacity-80">
                  {feature.desc}
                </p>

                <div className="mt-12 flex items-center gap-3 text-primary-400 font-extrabold opacity-60 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  EXPLORE FEATURE <ArrowRight className="w-5 h-5" />
                </div>

                {/* Decorative element background */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <Features />

      {/* Trust Section */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                {t("trust.title")}
              </h3>
              <p className="text-gray-500 font-medium">{t("trust.security")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Shield className="w-8 h-8" />
                HIPAA
              </div>
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Shield className="w-8 h-8" />
                ISO 27001
              </div>
              <div className="flex items-center gap-2 font-black text-gray-400">
                <Zap className="w-8 h-8" />
                HL7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-slate-950 relative overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 mesh-gradient-dark opacity-80" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3 animate-pulse"
          style={{ animationDelay: "3s" }}
        />

        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-primary-400 font-black uppercase tracking-[0.6em] mb-10 text-xs">
              Take Control of Your Health
            </motion.p>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-12 max-w-4xl mx-auto leading-[1.1] tracking-tight">
              Ready to see the{" "}
              <span className="text-primary-500">invisible?</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
              <Button
                size="lg"
                className="w-full sm:w-auto px-16 py-8 text-2xl font-black rounded-[2.5rem] bg-white text-slate-950 border-none shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all duration-300"
                onClick={() => navigate("/auth")}>
                {t("cta.button")}
              </Button>
              <Link
                to="/#features"
                className="text-white/60 text-xl font-bold border-b-2 border-white/10 hover:border-white hover:text-white transition-all py-1 tracking-tight">
                {t("cta.link")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
