import { createClient, type User } from "@supabase/supabase-js";
import type { RegisterPayload } from "../AuthPage";
import type { EditableAuthProfile } from "../chat-types";

export type AuthSubmitMode = "register" | "login";

const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;

const SUPABASE_URL = env?.VITE_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = env?.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

const AUTH_STORAGE_KEY = "ignite.auth";
const PROFILE_STORAGE_KEY = "ignite.profile";

function isValidSupabaseUrl(value: string) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function isLikelySupabaseKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("eyJ");
}

export const supabaseConfigError =
  !SUPABASE_URL || !SUPABASE_ANON_KEY
    ? "Не заданы VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY."
    : !isValidSupabaseUrl(SUPABASE_URL)
      ? "VITE_SUPABASE_URL имеет неверный формат."
      : !isLikelySupabaseKey(SUPABASE_ANON_KEY)
        ? "VITE_SUPABASE_ANON_KEY имеет неверный формат."
        : null;

export const authClient =
  supabaseConfigError === null
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const hasSupabaseAuth = Boolean(authClient);

function safeStorageGet(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeStorageRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function normalizeProfile(payload: Partial<EditableAuthProfile>): EditableAuthProfile {
  return {
    name: (payload.name || "").trim(),
    username: (payload.username || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/\s+/g, "")
      .toLowerCase(),
    bio: (payload.bio || "").trim(),
    email: (payload.email || "").trim(),
    password: payload.password || "",
    phone: (payload.phone || "").trim(),
    location: (payload.location || "").trim(),
    statusText: (payload.statusText || "").trim(),
    avatarDataUrl: payload.avatarDataUrl || "",
  };
}

function normalizeAuthError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message.toLowerCase().includes("failed to fetch")) {
    return new Error(
      "Не удалось подключиться к Supabase. Проверь VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и то, что сайт открыт по HTTPS.",
    );
  }

  return error instanceof Error ? error : new Error("Не удалось выполнить авторизацию.");
}

function requireAuthClient() {
  if (!authClient) {
    throw new Error(
      supabaseConfigError ||
        "Supabase не настроен. Проверь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.",
    );
  }

  return authClient;
}

export function getInitials(name: string) {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) return "U";
  return tokens.map((token) => token[0]!.toUpperCase()).join("");
}

export function readStoredAuthFlag() {
  return safeStorageGet(AUTH_STORAGE_KEY) === "1";
}

export function readStoredProfile(): EditableAuthProfile | null {
  const raw = safeStorageGet(PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function upsertProfile(user: User, profile: EditableAuthProfile) {
  const client = requireAuthClient();

  // Генерируем читаемый username, если он не указан
  const baseUsername =
    profile.username ||
    (user.email ? user.email.split("@")[0] : `user_${user.id.slice(0, 6)}`).toLowerCase();

  const name =
    profile.name ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    baseUsername;

  const updateData: any = {
    id: user.id,
    username: baseUsername,
    name,
    bio: profile.bio || "",
    phone: user.phone || profile.phone || "",
    email: user.email || null, // Явно передаем null, если почты нет
    location: profile.location || "",
    status: profile.statusText || "в сети",
    avatar_url: profile.avatarDataUrl || "",
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("profiles").upsert(updateData, { onConflict: "id" });

  if (error) {
    console.error("Profile upsert error details:", error);
    // Если ошибка в уникальности username, пробуем добавить суффикс
    if (error.code === "23505" && error.message.includes("username")) {
      updateData.username = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
      const { error: retryError } = await client.from("profiles").upsert(updateData, { onConflict: "id" });
      if (retryError) throw retryError;
    } else {
      throw new Error(`Ошибка базы данных: ${error.message}`);
    }
  }
}

async function fetchProfileByUserId(userId: string) {
  const client = requireAuthClient();

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function syncProfileToSupabase(profile: EditableAuthProfile) {
  const normalized = normalizeProfile(profile);
  safeStorageSet(PROFILE_STORAGE_KEY, JSON.stringify(normalized));

  const client = requireAuthClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError) throw userError;
    if (!user) return normalized;

    await upsertProfile(user, normalized);
    return normalized;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function sendPhoneOtp(phone: string) {
  const client = requireAuthClient();
  const { error } = await client.auth.signInWithOtp({
    phone: phone.trim(),
  });
  if (error) throw normalizeAuthError(error);
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const client = requireAuthClient();
  const { data, error } = await client.auth.verifyOtp({
    phone: phone.trim(),
    token: token.trim(),
    type: "sms",
  });

  if (error) throw normalizeAuthError(error);
  if (!data.user) throw new Error("Не удалось выполнить вход.");

  const existingProfile = await fetchProfileByUserId(data.user.id);
  
  const profile = normalizeProfile({
    name: existingProfile?.name || "",
    username: existingProfile?.username || "",
    phone: phone.trim(),
    email: data.user.email || "",
  });

  if (existingProfile) {
    safeStorageSet(AUTH_STORAGE_KEY, "1");
    safeStorageSet(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  return { user: data.user, isNewUser: !existingProfile };
}

export async function completePhoneRegistration(user: User, payload: Partial<EditableAuthProfile>) {
  const profile = normalizeProfile({
    ...payload,
    phone: user.phone || payload.phone || "",
    email: user.email || payload.email || "",
  });

  await upsertProfile(user, profile);
  safeStorageSet(AUTH_STORAGE_KEY, "1");
  safeStorageSet(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export async function signOutApp() {
  safeStorageRemove(AUTH_STORAGE_KEY);
  safeStorageRemove(PROFILE_STORAGE_KEY);

  if (!authClient) return;
  await authClient.auth.signOut();
}

export async function restoreAuthProfile() {
  const fallbackProfile = readStoredProfile();

  if (!authClient) {
    return {
      isAuthenticated: false,
      profile: fallbackProfile,
    };
  }

  try {
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session?.user) {
      safeStorageRemove(AUTH_STORAGE_KEY);
      return {
        isAuthenticated: false,
        profile: fallbackProfile,
      };
    }

    const dbProfile = await fetchProfileByUserId(session.user.id);

    const restored = normalizeProfile({
      name:
        dbProfile?.name ||
        session.user.user_metadata?.name ||
        fallbackProfile?.name ||
        "",
      username:
        dbProfile?.username ||
        session.user.user_metadata?.username ||
        fallbackProfile?.username ||
        "",
      bio:
        dbProfile?.bio ||
        session.user.user_metadata?.bio ||
        fallbackProfile?.bio ||
        "",
      email: session.user.email || fallbackProfile?.email || "",
      password: fallbackProfile?.password || "",
      phone:
        dbProfile?.phone ||
        session.user.user_metadata?.phone ||
        fallbackProfile?.phone ||
        "",
      location:
        dbProfile?.location ||
        session.user.user_metadata?.location ||
        fallbackProfile?.location ||
        "",
      statusText:
        dbProfile?.status ||
        session.user.user_metadata?.statusText ||
        fallbackProfile?.statusText ||
        "",
      avatarDataUrl:
        dbProfile?.avatar_url ||
        session.user.user_metadata?.avatarDataUrl ||
        fallbackProfile?.avatarDataUrl ||
        "",
    });

    safeStorageSet(AUTH_STORAGE_KEY, "1");
    safeStorageSet(PROFILE_STORAGE_KEY, JSON.stringify(restored));

    return {
      isAuthenticated: true,
      profile: restored,
    };
  } catch (error) {
    throw normalizeAuthError(error);
  }
}
