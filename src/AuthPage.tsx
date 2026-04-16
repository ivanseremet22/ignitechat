import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, Lock, Mail, User, Send, ChevronRight, ChevronLeft, Sparkles, MessageCircle, ShieldCheck, Zap, Globe, Rocket } from "lucide-react";
import { submitAuth } from "./lib/auth";
import type { EditableAuthProfile } from "./chat-types";

export type AuthFormState = {
  name: string;
  username: string;
  bio: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  statusText?: string;
  avatarDataUrl?: string;
};

export type RegisterPayload = AuthFormState;

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
 }

function normalizeUsername(value: string) {
  return value
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .toLowerCase()
    .slice(0, 24);
}

export type AuthMode = "register" | "login";

export type AuthNotice = {
  type: "info" | "success" | "error";
  title: string;
  message: string;
};

type AuthPageProps = {
  onComplete: (payload: RegisterPayload, mode: AuthMode) => Promise<void> | void;
  preferredMode?: AuthMode;
  notice?: AuthNotice | null;
  initialValues?: Partial<AuthFormState> | null;
  onResendConfirmation?: (email: string) => Promise<void> | void;
};

const initialForm: AuthFormState = {
  name: "",
  username: "",
  bio: "",
  email: "",
  password: "",
};

type OnboardingSlide = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const slides: OnboardingSlide[] = [
  {
    id: 0,
    title: "The Art of Shorts",
    description: "Погрузитесь в мир коротких видео и мгновенных сообщений.",
    icon: <MessageCircle size={120} className="text-white" />,
    color: "from-purple-600 to-pink-500",
  },
  {
    id: 1,
    title: "Winds of Destiny",
    description: "Откройте для себя новые горизонты общения в реальном времени.",
    icon: <Zap size={120} className="text-white" />,
    color: "from-blue-600 to-cyan-500",
  },
  {
    id: 2,
    title: "Escape Corpo",
    description: "Ваша свобода общения под надежной защитой шифрования.",
    icon: <ShieldCheck size={120} className="text-white" />,
    color: "from-emerald-500 to-teal-600",
  }
];

export default function AuthPage({
  onComplete,
  preferredMode = "register",
  notice = null,
  initialValues = null,
  onResendConfirmation,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(preferredMode);
  const [form, setForm] = useState<AuthFormState>(initialValues ? { ...initialForm, ...initialValues } : initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<AuthNotice | null>(notice);
  
  // Состояние онбординга
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  // Добавим состояние для фонового изображения
  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop");

  useEffect(() => {
    const images = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop"
    ];
    setBgImage(images[currentSlide % images.length]);
  }, [currentSlide]);

  useEffect(() => {
    setMode(preferredMode);
  }, [preferredMode]);

  useEffect(() => {
    if (!initialValues) return;
    setForm((prev) => ({
      ...prev,
      ...initialValues,
    }));
  }, [initialValues]);

  useEffect(() => {
    setLocalNotice(notice);
  }, [notice]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "username" ? normalizeUsername(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const profile = await submitAuth(form, mode);
      await onComplete(profile as any, mode);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Ошибка авторизации.");
    } finally {
      setSubmitting(false);
    }
  };

  const [direction, setDirection] = useState(1);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowAuth(true);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const initials = form.name ? getInitials(form.name) : "?";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#041411] font-sans text-white">
      {/* Dynamic Background Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -right-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -left-[10%] bottom-[10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6 py-12 flex flex-col min-h-screen justify-end pb-20 md:justify-center md:pb-12">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              className="flex flex-col items-start text-left"
            >
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 rounded-full glass-panel px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md"
              >
                Recommended
              </motion.div>

              <div className="min-h-[180px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: direction === 1 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 1 ? -50 : 50 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.9] uppercase italic-none">
                      {slides[currentSlide].title.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h1>
                    <p className="text-lg text-white/60 leading-tight max-w-[280px]">
                      {slides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex gap-1.5 mb-12 mt-8 w-full">
                {slides.map((s) => (
                  <div
                    key={s.id}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      currentSlide === s.id ? "bg-white" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-4 w-full items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextSlide}
                  className="flex-1 h-16 rounded-3xl bg-white text-black font-black text-xl uppercase tracking-tighter flex items-center justify-center shadow-2xl"
                >
                  {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                </motion.button>
                
                {currentSlide > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={prevSlide}
                    className="h-16 w-16 rounded-3xl glass-panel text-white flex items-center justify-center backdrop-blur-xl"
                  >
                    <ChevronLeft size={28} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-full"
            >
              <div className="w-full rounded-[40px] glass-panel-heavy p-8 shadow-2xl backdrop-blur-3xl relative overflow-hidden">
                <div className="mb-10 flex flex-col items-center">
                   <div className="flex p-1 glass-panel rounded-full mb-8 w-full max-w-[240px]">
                      <button 
                        onClick={() => setMode("register")}
                        className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === "register" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
                      >
                        Sign Up
                      </button>
                      <button 
                        onClick={() => setMode("login")}
                        className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === "login" ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
                      >
                        Log In
                      </button>
                   </div>

                   <h2 className="text-3xl font-black tracking-tighter uppercase italic-none mb-2">
                     {mode === "register" ? "Create Account" : "Welcome Back"}
                   </h2>
                   <p className="text-sm text-white/40">Enter your details to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7C3AED] transition-colors" size={18} />
                      <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full h-16 rounded-3xl bg-white/5 border border-white/5 pl-14 pr-6 text-base font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                  )}

                  {mode === "register" && (
                    <div className="relative group">
                      <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7C3AED] transition-colors" size={18} />
                      <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="w-full h-16 rounded-3xl bg-white/5 border border-white/5 pl-14 pr-6 text-base font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7C3AED] transition-colors" size={18} />
                    <input
                      type="email"
                      name="email"
                      placeholder="Your e-mail address"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/5 pl-14 pr-6 text-base font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#7C3AED] transition-colors" size={18} />
                    <input
                      type="password"
                      name="password"
                      placeholder="Create password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="w-full h-16 rounded-3xl bg-white/5 border border-white/5 pl-14 pr-6 text-base font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>

                  {submitError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center glass-panel py-3 rounded-2xl"
                    >
                      {submitError}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="w-full h-16 rounded-3xl bg-[#7C3AED] text-white font-black text-xl uppercase tracking-tighter flex items-center justify-center shadow-2xl mt-6 disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : mode === "register" ? "Sign Up" : "Log In"}
                  </motion.button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Social Login</p>
                  <div className="flex justify-center gap-4">
                    {['apple', 'facebook', 'google'].map((provider) => (
                      <button key={provider} className="h-14 w-14 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Globe size={20} className="text-white/40" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <button className="hover:text-white transition-colors">Terms</button>
                <button className="hover:text-white transition-colors">Privacy</button>
                <button className="hover:text-white transition-colors">Legal</button>
              </div>

              <button 
                onClick={() => setShowAuth(false)}
                className="mt-8 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors flex items-center gap-2 self-center"
              >
                <ChevronLeft size={14} /> Back to info
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
