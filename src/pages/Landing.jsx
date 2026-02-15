import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  FileText,
  LineChart,
  Brain,
  UploadCloud,
  ArrowRight,
  Lock,
  Quote,
  ChevronRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// ——— 1. SPLIT HERO (dark, left text / right abstract visual) ———
const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="min-h-[90vh] flex flex-col lg:flex-row bg-zinc-950 text-white overflow-hidden">
      {/* Left: copy */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24 py-20 lg:py-0 order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
            {t("hero.title").split(" ").slice(0, 2).join(" ")}
            <br />
            <span className="text-amber-400">
              {t("hero.title").split(" ").slice(2).join(" ")}
            </span>
          </h1>
          <p className="mt-6 text-zinc-400 text-lg max-w-md">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-zinc-900 font-semibold hover:bg-zinc-100 transition-colors">
              {t("hero.cta")}
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-zinc-500 text-sm">
              Trusted by <span className="text-zinc-300 font-medium">10,000+</span> users
            </span>
          </div>
        </motion.div>
      </div>

      {/* Right: abstract visual (no browser mockup) */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-[90vh] order-1 lg:order-2 flex items-center justify-center p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_70%_50%,rgba(251,191,36,0.12),transparent)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative w-full max-w-lg aspect-square">
          {/* Abstract: rings + bars */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15 + i * 0.1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.15 }}
                className="absolute rounded-full border border-amber-400/40"
                style={{
                  width: `${40 + i * 25}%`,
                  height: `${40 + i * 25}%`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end justify-center gap-1 sm:gap-2 pb-20">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                className="w-2 sm:w-3 rounded-t-full bg-amber-400/80"
              />
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 flex items-center justify-center">
            <Brain className="w-12 h-12 text-amber-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// ——— 2. MARQUEE-STYLE STATS STRIP ———
const StatsStrip = () => {
  const { t } = useTranslation();
  const items = [
    { value: "10K+", label: t("stats.reportsProcessed") },
    { value: "50+", label: t("stats.partnerLabs") },
    { value: "4.9/5", label: t("stats.userRating") },
  ];

  return (
    <section className="bg-zinc-900 border-y border-zinc-800 py-6">
      <div className="container mx-auto px-4 overflow-hidden">
        <motion.div
          className="flex gap-16 sm:gap-24 justify-center items-baseline flex-wrap"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center sm:flex-row sm:gap-3">
              <span className="font-heading text-3xl sm:text-4xl font-bold text-white tabular-nums">
                {item.value}
              </span>
              <span className="text-zinc-500 text-sm whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ——— 3. BENTO GRID (replaces how it works + features) ———
const BentoSection = () => {
  const { t } = useTranslation();

  const cells = [
    {
      title: t("howItWorks.step1.title"),
      desc: t("howItWorks.step1.desc"),
      icon: UploadCloud,
      size: "large",
      className: "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300",
      iconBg: "bg-violet-500",
    },
    {
      title: t("howItWorks.step2.title"),
      desc: t("howItWorks.step2.desc"),
      icon: Brain,
      size: "small",
      className: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
      iconBg: "bg-amber-500",
    },
    {
      title: t("howItWorks.step3.title"),
      desc: t("howItWorks.step3.desc"),
      icon: LineChart,
      size: "small",
      className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
      iconBg: "bg-emerald-500",
    },
    {
      title: t("features.feature1.title"),
      desc: t("features.feature1.desc"),
      icon: Zap,
      size: "small",
      className: "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300",
      iconBg: "bg-sky-500",
    },
    {
      title: t("features.feature2.title"),
      desc: t("features.feature2.desc"),
      icon: LineChart,
      size: "small",
      className: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300",
      iconBg: "bg-rose-500",
    },
    {
      title: t("trust.title"),
      desc: t("trust.security"),
      icon: Shield,
      size: "wide",
      className: "bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200",
      iconBg: "bg-zinc-600",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-3 text-zinc-600 max-w-xl mx-auto">
              {t("features.title")} — simple, secure, and built for clarity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {cells.map((cell, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className={cn(
                  "rounded-2xl border p-6 sm:p-8 flex flex-col",
                  cell.size === "large" && "sm:col-span-2 sm:row-span-2",
                  cell.size === "wide" && "sm:col-span-2",
                  cell.className,
                )}>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    cell.iconBg,
                    "text-white",
                  )}>
                  <cell.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">
                  {cell.title}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed mt-auto">
                  {cell.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ——— 4. QUOTE BLOCK ———
const QuoteSection = () => {
  return (
    <section className="py-20 sm:py-28 bg-zinc-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center">
          <Quote className="w-12 h-12 text-zinc-300 mx-auto mb-6" />
          <blockquote className="font-heading text-2xl sm:text-3xl font-semibold text-zinc-800 leading-snug">
            Finally, my lab results in one place with insights I can actually use.
          </blockquote>
          <p className="mt-6 text-zinc-500 text-sm">
            — Sarah K., RapiReport user
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// ——— 5. TRUST LINE (single row) ———
const TrustLine = () => {
  const items = [
    { icon: Shield, label: "HIPAA" },
    { icon: Lock, label: "ISO 27001" },
    { icon: Zap, label: "HL7 Compliant" },
  ];

  return (
    <section className="py-12 border-t border-zinc-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ——— 6. CTA (full width, diagonal or bold) ———
const CTASection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative py-24 sm:py-32 bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(251,191,36,0.08)_0%,transparent_50%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to take control of your health?
          </h2>
          <p className="mt-4 text-zinc-400">
            Join thousands making informed decisions with AI-powered insights.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-400 text-zinc-900 font-semibold hover:bg-amber-300 transition-colors">
              {t("cta.button")}
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/#features"
              className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-sm">
              {t("cta.link")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ——— PAGE ———
const Landing = () => {
  const { isAuthenticated, user, isProfileComplete } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      if (!isProfileComplete) {
        navigate("/profile-setup");
      } else if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, isProfileComplete, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <StatsStrip />
      <BentoSection />
      <QuoteSection />
      <TrustLine />
      <CTASection />
    </div>
  );
};

export default Landing;
