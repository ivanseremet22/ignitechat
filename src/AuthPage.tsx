import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Camera, Lock, Mail, Sparkles, User } from "lucide-react";

export type AuthFormState = {
  name: string;
  username: string;
  bio: string;
  email: string;
  password: string;
};

export type RegisterPayload = AuthFormState;

export function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function normalizeUsername(username: string): string {
  return username.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase();
}

function runAssertions(): void {
  console.assert(getInitials("Мира Ли") === "МЛ", "getInitials должен возвращать первые буквы имени");
  console.assert(getInitials("") === "U", "getInitials должен возвращать U для пустого имени");
  console.assert(getInitials("  anna   maria ") === "AM", "getInitials должен игнорировать лишние пробелы");
  console.assert(normalizeUsername(" @Mi Ra ") === "mira", "normalizeUsername должен чистить username");
  console.assert(normalizeUsername("@@User_Name") === "user_name", "normalizeUsername должен удалять @ в начале");
}

const canUseImportMetaEnv = (() => {
  try {
    return typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined";
  } catch {
    return false;
  }
})();

const isDev = canUseImportMetaEnv ? Boolean(import.meta.env.DEV) : false;

if (isDev) {
  runAssertions();
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
  name: "Мира Ли",
  username: "mirali",
  bio: "Делаю красивый UI, люблю чат-продукты и живые профили ✨",
  email: "",
  password: "",
};

const stats = [
  { label: "Профиль", value: "Новый" },
  { label: "Стиль", value: "Social" },
  { label: "Статус", value: "Готов" },
] as const;

const interests = ["Интерфейс", "Анимация", "Чаты"] as const;

const floatingDots = [
  "left-[8%] top-[10%]",
  "left-[22%] bottom-[14%]",
  "right-[10%] top-[12%]",
  "right-[18%] bottom-[10%]",
] as const;

export default function AuthPage({
  onComplete,
  preferredMode = "register",
  notice = null,
  initialValues = null,
  onResendConfirmation,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(preferredMode);
  const [focusedField, setFocusedField] = useState<keyof AuthFormState | "">("");
  const [form, setForm] = useState<AuthFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [localNotice, setLocalNotice] = useState<AuthNotice | null>(notice);

  const initials = useMemo(() => getInitials(form.name), [form.name]);

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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => {
      if (name === "username") {
        return {
          ...prev,
          username: normalizeUsername(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await onComplete(form, mode);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось выполнить авторизацию.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const email = form.email.trim();
    if (!email || !onResendConfirmation) return;

    setResending(true);
    setSubmitError(null);

    try {
      await onResendConfirmation(email);
      setLocalNotice({
        type: "success",
        title: "Письмо отправлено",
        message: "Мы отправили новое письмо для подтверждения. Проверь почту и спам.",
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить письмо повторно.");
    } finally {
      setResending(false);
    }
  };

  const setFocus = (field: keyof AuthFormState | "") => {
    setFocusedField(field);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.12),_transparent_24%),linear-gradient(135deg,#fff7ed_0%,#ffffff_40%,#fffaf5_100%)] px-4 py-6 md:px-8 md:py-8">
      {floatingDots.map((position, index) => (
        <motion.div
          key={position}
          className={`pointer-events-none absolute ${position} h-32 w-32 rounded-full bg-gradient-to-br from-orange-200/30 via-amber-100/20 to-pink-200/20 blur-3xl`}
          animate={{
            y: [0, index % 2 === 0 ? -18 : 18, 0],
            x: [0, index % 2 === 0 ? 10 : -10, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8 + index,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative flex flex-col justify-between border-b border-orange-100/60 p-6 md:border-b-0 md:border-r md:p-10 lg:p-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.25),rgba(255,255,255,0))]" />

          <div className="relative z-10 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/80 px-3 py-1.5 text-sm font-medium text-orange-600 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Создай свой профиль
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mb-8 space-y-3"
            >
              <AnimatePresence mode="wait">
                <motion.h1
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl"
                >
                  {mode === "register" ? "Регистрация с живым превью профиля" : "Вход в твой аккаунт"}
                </motion.h1>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.p
                  key={`${mode}-subtitle`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, delay: 0.03 }}
                  className="max-w-lg text-base leading-7 text-slate-600 md:text-lg"
                >
                  {mode === "register"
                    ? "Слева ты заполняешь данные, справа сразу видишь, как будет выглядеть твой аккаунт внутри продукта."
                    : "Быстро войди в аккаунт и вернись в свои диалоги, профиль и медиа."}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {localNotice && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  localNotice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : localNotice.type === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                <div className="font-semibold">{localNotice.title}</div>
                <div className="mt-1 leading-6">{localNotice.message}</div>
                {localNotice.type !== "error" && onResendConfirmation && form.email.trim() && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="mt-3 inline-flex rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resending ? "Отправляем..." : "Отправить письмо ещё раз"}
                  </button>
                )}
              </motion.div>
            )}

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <User className="h-4 w-4 text-orange-500" />
                        Имя
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onFocus={() => setFocus("name")}
                        onBlur={() => setFocus("")}
                        onChange={handleChange}
                        placeholder="Как тебя будут видеть"
                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <AtSign className="h-4 w-4 text-orange-500" />
                        Username
                      </span>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onFocus={() => setFocus("username")}
                        onBlur={() => setFocus("")}
                        onChange={handleChange}
                        placeholder="Твой уникальный ник"
                        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        Bio
                      </span>
                      <textarea
                        name="bio"
                        value={form.bio}
                        onFocus={() => setFocus("bio")}
                        onBlur={() => setFocus("")}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Пара слов о себе"
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4 text-orange-500" />
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onFocus={() => setFocus("email")}
                    onBlur={() => setFocus("")}
                    onChange={handleChange}
                    placeholder="example@mail.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Lock className="h-4 w-4 text-orange-500" />
                    Пароль
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onFocus={() => setFocus("password")}
                    onBlur={() => setFocus("")}
                    onChange={handleChange}
                    placeholder="Минимум 8 символов"
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
              </div>

              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Подождите..." : mode === "register" ? "Создать аккаунт" : "Войти"}
                </motion.button>
                <p className="text-sm text-slate-500">
                  {mode === "register" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
                  <button
                    type="button"
                    onClick={() => setMode((prev) => (prev === "register" ? "login" : "register"))}
                    className="font-medium text-orange-600"
                  >
                    {mode === "register" ? "Войти" : "Создать аккаунт"}
                  </button>
                </p>
              </div>
            </motion.form>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="relative z-10 mt-10 flex flex-wrap gap-3 text-sm text-slate-500"
          >
            {["Чатовый продукт", "Социальный профиль", "Мягкий onboarding"].map((tag, index) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.38 + index * 0.06 }}
                whileHover={{ y: -2 }}
                className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
          className="relative flex items-center justify-center overflow-hidden p-6 md:p-10 lg:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.16),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_28%)]" />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98, rotateX: 6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.35 }}
            whileHover={{ y: -4 }}
            className="relative z-10 w-full max-w-[430px] rounded-[32px] border border-white/60 bg-white/80 p-5 shadow-[0_24px_60px_rgba(251,146,60,0.12)] backdrop-blur-xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-orange-500">
                  {mode === "register" ? "Предпросмотр профиля" : "Предпросмотр аккаунта"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {mode === "register" ? "Так тебя увидят другие" : "Так выглядит твой аккаунт"}
                </h2>
              </div>
              <button type="button" className="rounded-full border border-orange-100 bg-orange-50 p-2 text-orange-500 shadow-sm">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <motion.div
              layout
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="overflow-hidden rounded-[28px] border border-orange-100 bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,255,255,0.92))]"
            >
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.28),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))] px-6 pb-6 pt-7">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    layout
                    animate={{
                      scale: focusedField === "name" ? 1.06 : 1,
                      rotate: focusedField === "name" ? -4 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 via-amber-200 to-pink-200 text-2xl font-semibold text-slate-800 shadow-lg shadow-orange-200/40 ring-4 ring-white/80"
                  >
                    {initials}
                  </motion.div>

                  <AnimatePresence mode="wait">
                    <motion.h3
                      key={form.name || "Твоё имя"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="text-2xl font-semibold text-slate-900"
                    >
                      {form.name || "Твоё имя"}
                    </motion.h3>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={form.username || "username"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, delay: 0.04 }}
                      className="mt-1 text-sm font-medium text-slate-500"
                    >
                      @{form.username || "username"}
                    </motion.p>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={form.bio || "empty-bio"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, delay: 0.06 }}
                      className="mt-3 max-w-sm text-sm leading-6 text-slate-600"
                    >
                      {form.bio || "Короткое описание твоего профиля появится здесь."}
                    </motion.p>
                  </AnimatePresence>

                  <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    ● в сети
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24 }}
                    className="grid grid-cols-3 overflow-hidden border-y border-orange-100/80 bg-white/70"
                  >
                    {stats.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: 0.18 + index * 0.08 }}
                        whileHover={{ y: -2 }}
                        className="px-3 py-4 text-center"
                      >
                        <div className="text-sm font-semibold text-slate-900">{item.value}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5 p-5">
                <AnimatePresence initial={false}>
                  {mode === "register" && (
                    <motion.div
                      key="interests"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.24 }}
                      className="overflow-hidden"
                    >
                      <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Интересы</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((item, index) => (
                          <motion.span
                            key={item}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.24, delay: 0.26 + index * 0.06 }}
                            whileHover={{ y: -2, scale: 1.03 }}
                            className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600"
                          >
                            {item}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Из переписки</p>
                    <span className="text-xs text-slate-400">последнее</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-sm">
                      <div className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-500">
                        Голосовое 9с
                      </div>
                      <p className="text-sm leading-6 text-slate-700">Голосовое сообщение</p>
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 shadow-sm">
                      <div className="mb-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-500">
                        Сообщение
                      </div>
                      <p className="text-sm leading-6 text-slate-700">Теперь это выглядит как живой продукт.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
