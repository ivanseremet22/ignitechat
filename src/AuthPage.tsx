import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, Lock, Mail, User, Send, ChevronRight, ChevronLeft, Sparkles, MessageCircle, ShieldCheck, Zap, Globe, Rocket, Phone } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp, completePhoneRegistration } from "./lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
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
    title: "IgniteChat",
    description: "Самый быстрый мессенджер в мире. Бесплатно и безопасно.",
    icon: <MessageCircle size={120} className="text-white" />,
    color: "from-blue-600 to-cyan-500",
  },
  {
    id: 1,
    title: "Скорость",
    description: "Сообщения доставляются мгновенно в любую точку планеты.",
    icon: <Zap size={120} className="text-white" />,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 2,
    title: "Безопасность",
    description: "Ваши данные под защитой сквозного шифрования.",
    icon: <ShieldCheck size={120} className="text-white" />,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: 3,
    title: "Возможности",
    description: "Групповые чаты, медиафайлы и облачное хранилище.",
    icon: <Rocket size={120} className="text-white" />,
    color: "from-purple-600 to-pink-500",
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
  const [form, setForm] = useState<AuthFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<AuthNotice | null>(notice);
  
  // Состояние онбординга и шагов
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [otpToken, setOtpToken] = useState("");
  const [tempUser, setTempUser] = useState<SupabaseUser | null>(null);

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await sendPhoneOtp(form.phone);
      setStep("otp");
    } catch (err: any) {
      setSubmitError(err.message || "Ошибка отправки кода.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { user, isNewUser } = await verifyPhoneOtp(form.phone || "", otpToken);
      if (isNewUser) {
        setTempUser(user);
        setStep("profile");
      } else {
        // Fetch full profile and complete
        const profile: EditableAuthProfile = {
          ...initialForm,
          phone: form.phone || "",
          name: user.user_metadata?.name || "",
          username: user.user_metadata?.username || "",
        };
        await onComplete(profile, "login");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Неверный код.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const profile = await completePhoneRegistration(tempUser, {
        name: form.name,
        username: form.username,
        bio: form.bio,
      });
      await onComplete(profile, "register");
    } catch (err: any) {
      setSubmitError(err.message || "Ошибка сохранения профиля.");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e1621] font-sans text-white">
      {/* Динамический фон */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-20`}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0e1621_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 py-12">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className="flex flex-col items-center text-center"
            >
              {/* Анимированная иконка слайда */}
              <div className="relative mb-12 h-48 w-48 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, rotate: direction === 1 ? -180 : 180, scale: 0 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: direction === 1 ? 180 : -180, scale: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute"
                  >
                    {slides[currentSlide].icon}
                  </motion.div>
                </AnimatePresence>
                {/* Декоративное свечение */}
                <div className={`absolute h-40 w-48 rounded-full bg-gradient-to-br ${slides[currentSlide].color} opacity-30 blur-[60px]`} />
              </div>

              {/* Текст слайда */}
              <div className="min-h-[140px] md:min-h-[160px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: direction === 1 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 1 ? -50 : 50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      {slides[currentSlide].title}
                    </h1>
                    <p className="text-base md:text-lg text-slate-400 leading-relaxed px-2 md:px-4">
                      {slides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Индикаторы */}
              <div className="flex gap-2 mb-10 mt-6">
                {slides.map((s) => (
                  <div
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === s.id ? "w-8 bg-blue-500" : "w-1.5 bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              {/* Кнопки навигации */}
              <div className="flex gap-4 w-full">
                <AnimatePresence>
                  {currentSlide > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.8 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={prevSlide}
                      className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center transition"
                      aria-label="Назад"
                    >
                      <ChevronLeft size={28} />
                    </motion.button>
                  )}
                </AnimatePresence>
                
                <motion.button
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextSlide}
                  className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  {currentSlide === slides.length - 1 ? "Начать общение" : "Далее"}
                  <ChevronRight size={24} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
                
                <div className="mb-8 flex flex-col items-center text-center">
                  {step === "profile" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative mb-6 h-20 w-20 overflow-hidden rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold"
                    >
                      {initials}
                    </motion.div>
                  ) : (
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/20 text-blue-500">
                      <Phone size={40} />
                    </div>
                  )}
                  
                  <h2 className="text-2xl font-bold text-white">
                    {step === "phone" ? "Ваш номер" : step === "otp" ? "Код из SMS" : "О себе"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {step === "phone" 
                      ? "Введите номер телефона для входа или регистрации" 
                      : step === "otp" 
                        ? `Мы отправили код на ${form.phone}` 
                        : "Почти готово! Как вас зовут?"}
                  </p>
                </div>

                {step === "phone" && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone || ""}
                        onChange={handleChange}
                        placeholder="+7 999 000-00-00"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-12 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition"
                      />
                    </div>
                    {submitError && <p className="text-red-400 text-xs text-center">{submitError}</p>}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold text-lg mt-4 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Отправка..." : "Далее"}
                      <ChevronRight size={20} />
                    </motion.button>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="text"
                        name="otp"
                        required
                        autoFocus
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        placeholder="000000"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-12 text-white text-center tracking-[1em] text-xl placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition"
                      />
                    </div>
                    {submitError && <p className="text-red-400 text-xs text-center">{submitError}</p>}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold text-lg mt-4 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Проверка..." : "Подтвердить"}
                      <ChevronRight size={20} />
                    </motion.button>
                    <button 
                      type="button"
                      onClick={() => setStep("phone")}
                      className="w-full text-center text-sm text-slate-500 hover:text-white transition"
                    >
                      Изменить номер
                    </button>
                  </form>
                )}

                {step === "profile" && (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Ваше имя"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-12 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition"
                      />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input
                        type="text"
                        name="username"
                        required
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Никнейм"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-12 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition"
                      />
                    </div>
                    {submitError && <p className="text-red-400 text-xs text-center">{submitError}</p>}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting}
                      className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold text-lg mt-4 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Сохранение..." : "Завершить"}
                      <ChevronRight size={20} />
                    </motion.button>
                  </form>
                )}

              </div>
              
              <button 
                onClick={() => {
                  setShowAuth(false);
                  setStep("phone");
                }}
                className="mt-6 text-slate-500 hover:text-white transition"
              >
                Вернуться в начало
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
