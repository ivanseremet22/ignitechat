import { createClient, type User } from "@supabase/supabase-js";
import type { RegisterPayload } from "../AuthPage";

export type AuthSubmitMode = "register" | "login";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const AUTH_STORAGE_KEY = "ignite.auth";
const PROFILE_STORAGE_KEY = "ignite.profile";

export const authClient = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const hasSupabaseAuth = Boolean(authClient);

function getEmailName(email: string | undefined): string {
  return email?.split("@")[0] || "User";
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function readStoredProfile(): RegisterPayload | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RegisterPayload;
  } catch {
    return null;
  }
}

export function readStoredAuthFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "1";
}

export function writeStoredProfile(profile: RegisterPayload): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function markStoredAuthenticated(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "1");
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

function normalizeProfile(payload: RegisterPayload, fallbackEmail = ""): RegisterPayload {
  const normalizedName = payload.name.trim() || getEmailName(payload.email || fallbackEmail);
  const normalizedUsername =
    payload.username.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase() ||
    getEmailName(payload.email || fallbackEmail).replace(/\s+/g, "").toLowerCase();

  return {
    name: normalizedName,
    username: normalizedUsername,
    bio: payload.bio.trim(),
    email: payload.email.trim() || fallbackEmail,
    password: payload.password,
  };
}

function mergeUserWithStoredProfile(user: User, storedProfile: RegisterPayload | null): RegisterPayload {
  const email = user.email || storedProfile?.email || "";
  const metadata = user.user_metadata ?? {};
  const draft = {
    name: typeof metadata.name === "string" ? metadata.name : storedProfile?.name || getEmailName(email),
    username:
      typeof metadata.username === "string"
        ? metadata.username
        : storedProfile?.username || getEmailName(email).replace(/\s+/g, "").toLowerCase(),
    bio: typeof metadata.bio === "string" ? metadata.bio : storedProfile?.bio || "",
    email,
    password: storedProfile?.password || "",
  };

  return normalizeProfile(draft, email);
}

async function readProfileFromSupabase(user: User, storedProfile: RegisterPayload | null): Promise<RegisterPayload | null> {
  if (!authClient) {
    return storedProfile;
  }

  const result = await authClient
    .from("profiles")
    .select("name,username,bio,email")
    .eq("id", user.id)
    .maybeSingle();

  if (result.error || !result.data) {
    return storedProfile;
  }

  return normalizeProfile(
    {
      name: result.data.name || storedProfile?.name || getEmailName(user.email),
      username: result.data.username || storedProfile?.username || getEmailName(user.email).toLowerCase(),
      bio: result.data.bio || storedProfile?.bio || "",
      email: result.data.email || user.email || storedProfile?.email || "",
      password: storedProfile?.password || "",
    },
    user.email || storedProfile?.email || "",
  );
}

export async function restoreAuthProfile(): Promise<{
  isAuthenticated: boolean;
  profile: RegisterPayload | null;
}> {
  const storedProfile = readStoredProfile();

  if (!authClient) {
    return {
      isAuthenticated: readStoredAuthFlag(),
      profile: storedProfile,
    };
  }

  const {
    data: { session },
  } = await authClient.auth.getSession();

  if (!session?.user) {
    return {
      isAuthenticated: false,
      profile: storedProfile,
    };
  }

  const profileFromDb = await readProfileFromSupabase(session.user, storedProfile);
  const mergedProfile = profileFromDb || mergeUserWithStoredProfile(session.user, storedProfile);
  writeStoredProfile(mergedProfile);
  markStoredAuthenticated(true);

  return {
    isAuthenticated: true,
    profile: mergedProfile,
  };
}

export async function syncProfileToSupabase(profile: RegisterPayload & {
  statusText?: string;
  avatarDataUrl?: string;
  phone?: string;
  location?: string;
}): Promise<void> {
  if (!authClient) return;

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return;

  const normalized = normalizeProfile(profile, user.email || "");

  const upsertResult = await authClient.from("profiles").upsert(
    {
      id: user.id,
      email: normalized.email || user.email || "",
      name: normalized.name,
      username: normalized.username,
      bio: normalized.bio,
      avatar: getInitials(normalized.name),
      avatar_url: profile.avatarDataUrl || null,
      online: true,
      status: profile.statusText?.trim() || "в сети",
      phone: profile.phone?.trim() || null,
      location: profile.location?.trim() || null,
      role: "Member",
    },
    { onConflict: "id" },
  );

  if (upsertResult.error) {
    throw new Error(upsertResult.error.message);
  }
}

export async function submitAuth(
  payload: RegisterPayload,
  mode: AuthSubmitMode,
): Promise<RegisterPayload> {
  const normalized = normalizeProfile(payload);

  if (!authClient) {
    writeStoredProfile(normalized);
    markStoredAuthenticated(true);
    return normalized;
  }

  if (!normalized.email || !normalized.password) {
    throw new Error("Для входа и регистрации нужны email и пароль.");
  }

  if (mode === "register") {
    const signUpResult = await authClient.auth.signUp({
      email: normalized.email,
      password: normalized.password,
      options: {
        data: {
          name: normalized.name,
          username: normalized.username,
          bio: normalized.bio,
        },
      },
    });

    if (signUpResult.error) {
      throw new Error(signUpResult.error.message);
    }

    const activeUser = signUpResult.data.user;
    const activeSession = signUpResult.data.session;

    if (!activeUser) {
      throw new Error("Не удалось создать аккаунт.");
    }

    writeStoredProfile(normalized);

    if (!activeSession) {
      throw new Error("Аккаунт создан. Подтверди email по ссылке в письме, потом войди.");
    }

    await syncProfileToSupabase(normalized);
    markStoredAuthenticated(true);
    return normalized;
  }

  const signInResult = await authClient.auth.signInWithPassword({
    email: normalized.email,
    password: normalized.password,
  });

  if (signInResult.error || !signInResult.data.user) {
    throw new Error(signInResult.error?.message || "Не удалось войти в аккаунт.");
  }

  const nextProfile = await readProfileFromSupabase(
    signInResult.data.user,
    readStoredProfile() ?? normalized,
  );

  const merged = nextProfile || mergeUserWithStoredProfile(signInResult.data.user, readStoredProfile() ?? normalized);
  writeStoredProfile(merged);
  markStoredAuthenticated(true);
  return merged;
}

export async function signOutApp(): Promise<void> {
  if (authClient) {
    await authClient.auth.signOut();
  }
  clearStoredAuth();
}
