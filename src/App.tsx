import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Video } from "lucide-react";
import AuthPage, { type RegisterPayload, type AuthMode, getInitials } from "./AuthPage";
import type { EditableAuthProfile, User, UserProfile, Reaction, MessageStatus, Message, Chat } from "./chat-types";
import Sidebar from "./components/chat/Sidebar";
import MyProfilePage from "./components/chat/MyProfilePage";
import ChatView from "./components/chat/ChatView";
import PeerProfilePanel from "./components/chat/PeerProfilePanel";
import {
  authClient,
  hasSupabaseAuth,
  readStoredAuthFlag,
  readStoredProfile,
  restoreAuthProfile,
  signOutApp,
  submitAuth,
  syncProfileToSupabase,
} from "./lib/auth";


type SendMessageInput = {
  chatId: string;
  senderId: string;
  text: string;
  replyTo?: string;
  voice?: number;
};

type ToggleReactionInput = {
  messageId: string;
  userId: string;
  type: Reaction["type"];
};

type ChatDataSource = {
  provider: "mock" | "supabase";
  isLive: boolean;
  getCurrentUser: () => Promise<User>;
  getUsers: () => Promise<User[]>;
  getChats: () => Promise<Chat[]>;
  getMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (input: SendMessageInput) => Promise<Message>;
  toggleReaction: (input: ToggleReactionInput) => Promise<Message[]>;
  subscribeToMessages: (chatId: string, callback: (messages: Message[]) => void) => (() => void);
};

type SupabaseProfileRow = {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean | null;
  status: string | null;
};

type SupabaseChatRow = {
  id: string;
  title: string;
  avatar: string | null;
  preview: string | null;
  pinned: boolean | null;
  unread: number | null;
  updated_at: string;
};

type SupabaseMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string | null;
  created_at: string;
  reply_to: string | null;
  voice_duration: number | null;
  voice_url: string | null;
  status: MessageStatus | null;
  seen: boolean | null;
};

type SupabaseReactionRow = {
  id: string;
  message_id: string;
  user_id: string;
  type: Reaction["type"];
};

const nowIso = () => new Date().toISOString();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const seedUsers: UserProfile[] = [
  {
    id: "u1",
    name: "You",
    avatar: "YO",
    online: true,
    status: "в сети",
    username: "you",
    bio: "Собираю продуктовый чат и довожу UI до релиза.",
    phone: "+7 999 000-00-01",
    location: "Алматы",
    joinedAt: "Jan 2024",
    role: "Product builder",
    accent: "from-amber-400 via-orange-300 to-yellow-200",
    interests: ["UX", "Chat", "Launch"],
  },
  {
    id: "u2",
    name: "Mira",
    avatar: "MI",
    online: true,
    status: "печатает…",
    username: "mira.ui",
    bio: "Frontend dev • Люблю чистый UI, быстрые сценарии и красивые мелочи ✨",
    phone: "+7 999 000-00-02",
    location: "Tbilisi",
    joinedAt: "Feb 2024",
    role: "UI designer",
    accent: "from-fuchsia-300 via-orange-200 to-amber-100",
    interests: ["Interface", "Motion", "Brand"],
  },
  {
    id: "u3",
    name: "Alex",
    avatar: "AL",
    online: false,
    status: "был(а) 1 ч назад",
    username: "alex.pm",
    bio: "Product-minded. Люблю, когда чат ощущается как настоящий продукт.",
    phone: "+7 999 000-00-03",
    location: "Warsaw",
    joinedAt: "Mar 2024",
    role: "Product lead",
    accent: "from-sky-200 via-cyan-100 to-white",
    interests: ["Roadmap", "Metrics", "Growth"],
  },
  {
    id: "u4",
    name: "Ignite Bot",
    avatar: "IB",
    online: true,
    status: "в сети",
    username: "ignite.bot",
    bio: "Тестовый собеседник для проверки UX, reply, voice и realtime сценариев.",
    phone: "Service account",
    location: "Cloud node",
    joinedAt: "Jan 2024",
    role: "Assistant",
    accent: "from-orange-300 via-amber-200 to-yellow-100",
    interests: ["Testing", "Flows", "Automation"],
  },
];

const seedChats: Chat[] = [
  {
    id: "c0",
    title: "Ignite Bot",
    avatar: "IB",
    preview: "Напиши что-нибудь, и бот ответит для проверки переписки",
    pinned: true,
    unread: 0,
    updatedAt: nowIso(),
  },
  {
    id: "c1",
    title: "Mira",
    avatar: "MI",
    preview: "Теперь это реально выглядит как продукт 🔥",
    pinned: true,
    unread: 2,
    updatedAt: nowIso(),
  },
  {
    id: "c2",
    title: "Alex",
    avatar: "AL",
    preview: "Нужен ещё более premium UI",
    unread: 0,
    updatedAt: nowIso(),
  },
];

const seedMessages: Message[] = [
  {
    id: "b1",
    chatId: "c0",
    senderId: "u4",
    text: "Привет. Я тестовый бот. Напиши любое сообщение — я отвечу, чтобы можно было проверить переписку.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reactions: [],
    status: "seen",
  },
  {
    id: "b2",
    chatId: "c0",
    senderId: "u4",
    text: "Я умею отвечать на обычные сообщения и на ответы. Это удобно для теста UI и UX чата.",
    createdAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    reactions: [],
    status: "seen",
  },
  {
    id: "1",
    chatId: "c1",
    senderId: "u2",
    text: "Теперь это реально выглядит как продукт 🔥",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    reactions: [{ type: "fire", userId: "u1" }],
    status: "seen",
  },
  {
    id: "2",
    chatId: "c1",
    senderId: "u2",
    text: "Нужно сделать мобильную навигацию мягкой и удобной.",
    createdAt: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    reactions: [],
    status: "seen",
  },
  {
    id: "3",
    chatId: "c1",
    senderId: "u1",
    text: "Сделаю slide-in список чатов, grouped bubbles и нормальные voice messages.",
    createdAt: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    reactions: [],
    seen: true,
    status: "seen",
  },
  {
    id: "4",
    chatId: "c1",
    senderId: "u1",
    voice: 9,
    voiceUrl: null,
    text: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    reactions: [],
    seen: true,
    status: "seen",
  },
  {
    id: "5",
    chatId: "c2",
    senderId: "u3",
    text: "Нужен ещё более premium UI.",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    reactions: [],
    status: "delivered",
  },
];

const qaScenarios = [
  "Supabase adapter подключается без переписывания UI",
  "Фолбэк на mock datasource при пустом конфиге",
  "Реакции с replace/toggle логикой",
  "Статусы сообщения: sending/sent/seen/error",
  "Realtime через subscribeToMessages",
  "Автоответ бота живёт только в mock datasource",
  "Отправка Enter",
  "Запись и отправка голосового",
  "Группировка сообщений без дублирования",
  "Разделители дат между днями",
];

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatMessageMeta(date: string) {
  const messageDate = new Date(date);
  return `${messageDate.toLocaleDateString()} • ${messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatDayLabel(date: string) {
  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate(),
  ).getTime();
  const diffDays = Math.round((today - target) / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  return messageDate.toLocaleDateString();
}

function sameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function findMessageById(messages: Message[], id?: string) {
  if (!id) return null;
  return messages.find((message) => message.id === id) || null;
}

function makeId(prefix = "msg") {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortMessages(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function toAvatarLabel(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  if (!text) return fallback.slice(0, 2).toUpperCase();
  return text.slice(0, 2).toUpperCase();
}

function mapProfile(row: SupabaseProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    avatar: toAvatarLabel(row.avatar, row.name),
    online: row.online ?? false,
    status: row.status ?? "в сети",
  };
}

function getProfileByUserId(users: User[], userId: string): UserProfile {
  const fallback = users.find((user) => user.id === userId) || users[0];
  const extended = seedUsers.find((user) => user.id === userId);
  if (extended) return extended;
  return {
    ...(fallback as User),
    username: fallback?.name?.toLowerCase().replace(/\s+/g, ".") || "profile",
    bio: "Профиль скоро появится.",
    phone: "—",
    location: "—",
    joinedAt: "2024",
    role: "Member",
    accent: "from-slate-200 via-slate-100 to-white",
    interests: ["Chat"],
  };
}

function mapChat(row: SupabaseChatRow): Chat {
  return {
    id: row.id,
    title: row.title,
    avatar: toAvatarLabel(row.avatar, row.title),
    preview: row.preview ?? "",
    pinned: row.pinned ?? false,
    unread: row.unread ?? 0,
    updatedAt: row.updated_at,
  };
}

function mapMessages(rows: SupabaseMessageRow[], reactions: SupabaseReactionRow[]): Message[] {
  return sortMessages(
    rows.map((row) => ({
      id: row.id,
      chatId: row.chat_id,
      senderId: row.sender_id,
      text: row.text ?? "",
      createdAt: row.created_at,
      replyTo: row.reply_to ?? undefined,
      voice: row.voice_duration ?? undefined,
      voiceUrl: row.voice_url,
      status: row.status ?? "sent",
      seen: row.seen ?? false,
      reactions: reactions
        .filter((reaction) => reaction.message_id === row.id)
        .map((reaction) => ({ type: reaction.type, userId: reaction.user_id })),
    })),
  );
}

function createMockChatDataSource(): ChatDataSource {
  let users = [...seedUsers];
  let chats = [...seedChats];
  let messages = [...seedMessages];
  const listeners = new Set<(chatId: string, nextMessages: Message[]) => void>();

  const emit = (chatId: string) => {
    const payload = sortMessages(messages.filter((message) => message.chatId === chatId));
    listeners.forEach((listener) => listener(chatId, payload));
  };

  const touchChat = (chatId: string, preview: string) => {
    chats = chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            preview,
            updatedAt: nowIso(),
          }
        : chat,
    );
  };

  return {
    provider: "mock",
    isLive: false,
    async getCurrentUser() {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      return users[0];
    },
    async getUsers() {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      return [...users];
    },
    async getChats() {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      return [...chats].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    },
    async getMessages(chatId: string) {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      return sortMessages(messages.filter((message) => message.chatId === chatId));
    },
    async sendMessage(input: SendMessageInput) {
      const createdAt = nowIso();
      const optimistic: Message = {
        id: makeId(),
        chatId: input.chatId,
        senderId: input.senderId,
        text: input.text,
        createdAt,
        reactions: [],
        replyTo: input.replyTo,
        voice: input.voice,
        voiceUrl: null,
        status: "sent",
        seen: true,
      };

      messages = [...messages, optimistic];
      touchChat(
        input.chatId,
        input.voice ? `Голосовое · ${input.voice}s` : input.text || "Новое сообщение",
      );
      emit(input.chatId);

      if (input.chatId === "c0") {
        window.setTimeout(() => {
          const botReply: Message = {
            id: makeId("bot"),
            chatId: "c0",
            senderId: "u4",
            text: input.voice
              ? "Получил голосовое. Для теста интерфейса всё сработало корректно."
              : input.replyTo
                ? `Вижу твой ответ: «${input.text || "сообщение"}». Проверка цепочки reply работает.`
                : `Бот получил: «${input.text || "сообщение"}». Можно продолжать тестировать переписку.`,
            createdAt: nowIso(),
            reactions: [],
            replyTo: input.replyTo,
            status: "seen",
            seen: true,
          };

          messages = [...messages, botReply];
          touchChat("c0", botReply.text);
          emit("c0");
        }, 900);
      }

      return optimistic;
    },
    async toggleReaction(input: ToggleReactionInput) {
      messages = messages.map((message) => {
        if (message.id !== input.messageId) return message;

        const existing = message.reactions.find((reaction) => reaction.userId === input.userId);
        if (!existing) {
          return {
            ...message,
            reactions: [...message.reactions, { type: input.type, userId: input.userId }],
          };
        }

        if (existing.type === input.type) {
          return {
            ...message,
            reactions: message.reactions.filter((reaction) => reaction.userId !== input.userId),
          };
        }

        return {
          ...message,
          reactions: message.reactions.map((reaction) =>
            reaction.userId === input.userId ? { ...reaction, type: input.type } : reaction,
          ),
        };
      });

      const target = messages.find((message) => message.id === input.messageId);
      if (target) emit(target.chatId);
      return sortMessages(messages);
    },
    subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
      const listener = (emittedChatId: string, nextMessages: Message[]) => {
        if (emittedChatId === chatId) callback(nextMessages);
      };

      listeners.add(listener);
      callback(sortMessages(messages.filter((message) => message.chatId === chatId)));

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function createSupabaseChatDataSource(client: SupabaseClient): ChatDataSource {
  const readMessages = async (chatId: string) => {
    const [{ data: messageRows, error: messageError }, { data: reactionRows, error: reactionError }] =
      await Promise.all([
        client
          .from("messages")
          .select(
            "id, chat_id, sender_id, text, created_at, reply_to, voice_duration, voice_url, status, seen",
          )
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true }),
        client.from("message_reactions").select("id, message_id, user_id, type"),
      ]);

    if (messageError) throw messageError;
    if (reactionError) throw reactionError;

    return mapMessages(
      (messageRows as SupabaseMessageRow[]) ?? [],
      (reactionRows as SupabaseReactionRow[]) ?? [],
    );
  };

  return {
    provider: "supabase",
    isLive: true,
    async getCurrentUser() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        return {
          id: "guest-user",
          name: "Guest",
          avatar: "GU",
          online: true,
          status: "гость",
        };
      }

      const { data, error } = await client
        .from("profiles")
        .select("id, name, avatar, online, status")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        return {
          id: user.id,
          name: user.email?.split("@")[0] || "User",
          avatar: "US",
          online: true,
          status: "в сети",
        };
      }

      return mapProfile(data as SupabaseProfileRow);
    },
    async getUsers() {
      const { data, error } = await client
        .from("profiles")
        .select("id, name, avatar, online, status")
        .order("name", { ascending: true });

      if (error) throw error;
      return ((data as SupabaseProfileRow[]) ?? []).map(mapProfile);
    },
    async getChats() {
      const { data, error } = await client
        .from("chats")
        .select("id, title, avatar, preview, pinned, unread, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return ((data as SupabaseChatRow[]) ?? []).map(mapChat);
    },
    async getMessages(chatId: string) {
      return readMessages(chatId);
    },
    async sendMessage(input: SendMessageInput) {
      const insertPayload = {
        chat_id: input.chatId,
        sender_id: input.senderId,
        text: input.text || null,
        reply_to: input.replyTo ?? null,
        voice_duration: input.voice ?? null,
        voice_url: null,
        status: "sent" as MessageStatus,
        seen: false,
      };

      const { data, error } = await client
        .from("messages")
        .insert(insertPayload)
        .select(
          "id, chat_id, sender_id, text, created_at, reply_to, voice_duration, voice_url, status, seen",
        )
        .single();

      if (error) throw error;

      await client
        .from("chats")
        .update({
          preview: input.voice ? `Голосовое · ${input.voice}s` : input.text || "Новое сообщение",
          updated_at: nowIso(),
        })
        .eq("id", input.chatId);

      const row = data as SupabaseMessageRow;
      return {
        id: row.id,
        chatId: row.chat_id,
        senderId: row.sender_id,
        text: row.text ?? "",
        createdAt: row.created_at,
        reactions: [],
        replyTo: row.reply_to ?? undefined,
        voice: row.voice_duration ?? undefined,
        voiceUrl: row.voice_url,
        status: row.status ?? "sent",
        seen: row.seen ?? false,
      };
    },
    async toggleReaction(input: ToggleReactionInput) {
      const { data: existingRows, error: existingError } = await client
        .from("message_reactions")
        .select("id, message_id, user_id, type")
        .eq("message_id", input.messageId)
        .eq("user_id", input.userId)
        .limit(1);

      if (existingError) throw existingError;

      const existing = (existingRows as SupabaseReactionRow[] | null)?.[0] ?? null;

      if (!existing) {
        const { error } = await client.from("message_reactions").insert({
          message_id: input.messageId,
          user_id: input.userId,
          type: input.type,
        });
        if (error) throw error;
      } else if (existing.type === input.type) {
        const { error } = await client.from("message_reactions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("message_reactions")
          .update({ type: input.type })
          .eq("id", existing.id);
        if (error) throw error;
      }

      const { data: messageRows, error: messageError } = await client
        .from("messages")
        .select(
          "id, chat_id, sender_id, text, created_at, reply_to, voice_duration, voice_url, status, seen",
        )
        .order("created_at", { ascending: true });
      const { data: reactionRows, error: reactionError } = await client
        .from("message_reactions")
        .select("id, message_id, user_id, type");

      if (messageError) throw messageError;
      if (reactionError) throw reactionError;

      return mapMessages(
        (messageRows as SupabaseMessageRow[]) ?? [],
        (reactionRows as SupabaseReactionRow[]) ?? [],
      );
    },
    subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
      const channel = client
        .channel(`messages:${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          async () => {
            callback(await readMessages(chatId));
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "message_reactions",
          },
          async () => {
            callback(await readMessages(chatId));
          },
        )
        .subscribe();

      readMessages(chatId).then(callback).catch(() => undefined);

      return () => {
        client.removeChannel(channel);
      };
    },
  };
}

function createDataSource(): ChatDataSource {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return createSupabaseChatDataSource(client);
  }
  return createMockChatDataSource();
}

const dataSource = createDataSource();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readStoredAuthFlag());
  const [authProfile, setAuthProfile] = useState<EditableAuthProfile | null>(() => readStoredProfile() as EditableAuthProfile | null);
  const [authBooting, setAuthBooting] = useState<boolean>(hasSupabaseAuth);
  const [authRefreshKey, setAuthRefreshKey] = useState(0);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState("c1");
  const [search, setSearch] = useState("");
  const [sendPulse, setSendPulse] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [pendingVoiceSeconds, setPendingVoiceSeconds] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState<"peer" | "me">("peer");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProfilePageOpen, setMyProfilePageOpen] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [myProfileDraft, setMyProfileDraft] = useState<EditableAuthProfile>({
    name: "",
    username: "",
    bio: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    statusText: "",
    avatarDataUrl: "",
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);

  const authInitials = authProfile ? getInitials(authProfile.name) : null;
  const displayCurrentUser = currentUser
    ? {
        ...currentUser,
        name: authProfile?.name || currentUser.name,
        avatar: authInitials || currentUser.avatar,
        status: currentUser.status,
      }
    : null;

  useEffect(() => {
    let active = true;

    restoreAuthProfile()
      .then(({ isAuthenticated: nextAuthenticated, profile }) => {
        if (!active) return;
        setIsAuthenticated(nextAuthenticated);
        setAuthProfile((profile as EditableAuthProfile | null) ?? null);
      })
      .catch(() => {
        if (!active) return;
        setIsAuthenticated(readStoredAuthFlag());
        setAuthProfile(readStoredProfile() as EditableAuthProfile | null);
      })
      .finally(() => {
        if (active) {
          setAuthBooting(false);
        }
      });

    if (!authClient) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const isLoggedIn = Boolean(session?.user);
      setIsAuthenticated(isLoggedIn);
      if (!isLoggedIn) {
        setCurrentUser(null);
      }
      setAuthRefreshKey((prev) => prev + 1);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const touchMedia = window.matchMedia("(hover: none)");
    const desktopMedia = window.matchMedia("(min-width: 768px)");

    const applyTouch = () => setIsTouch(touchMedia.matches);
    const applyDesktop = () => setIsDesktop(desktopMedia.matches);

    applyTouch();
    applyDesktop();

    touchMedia.addEventListener?.("change", applyTouch);
    desktopMedia.addEventListener?.("change", applyDesktop);

    return () => {
      touchMedia.removeEventListener?.("change", applyTouch);
      desktopMedia.removeEventListener?.("change", applyDesktop);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingChats(false);
      return;
    }

    let mounted = true;
    setLoadingChats(true);
    setError(null);

    Promise.all([dataSource.getCurrentUser(), dataSource.getUsers(), dataSource.getChats()])
      .then(([nextUser, nextUsers, nextChats]) => {
        if (!mounted) return;
        setCurrentUser(nextUser);
        setUsers(nextUsers);
        setChats(nextChats);
        if (!nextChats.find((chat) => chat.id === activeChatId) && nextChats[0]) {
          setActiveChatId(nextChats[0].id);
        }
        setLoadingChats(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить приложение.");
        setLoadingChats(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeChatId, authRefreshKey, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingMessages(false);
      return;
    }

    let active = true;
    setLoadingMessages(true);
    setError(null);

    dataSource
      .getMessages(activeChatId)
      .then((nextMessages) => {
        if (!active) return;
        setMessages(nextMessages);
        setLoadingMessages(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить сообщения.");
        setLoadingMessages(false);
      });

    const unsubscribe = dataSource.subscribeToMessages(activeChatId, (nextMessages) => {
      setMessages(nextMessages);
      setLoadingMessages(false);
      dataSource.getChats().then(setChats).catch(() => undefined);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [activeChatId, authRefreshKey, isAuthenticated]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(term) || chat.preview.toLowerCase().includes(term),
    );
  }, [search, chats]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || chats[0] || null,
    [activeChatId, chats],
  );

  const activeMessages = useMemo(
    () => messages.filter((message) => message.chatId === activeChatId),
    [messages, activeChatId],
  );

  const activePeer = useMemo(() => {
    if (!activeChat) return null;
    if (activeChatId === "c0") return users.find((user) => user.id === "u4") || null;
    if (activeChatId === "c1") return users.find((user) => user.id === "u2") || null;
    return users.find((user) => user.id === "u3") || null;
  }, [activeChat, activeChatId, users]);

  const replyPreview = useMemo(
    () => findMessageById(activeMessages, replyTo || undefined),
    [activeMessages, replyTo],
  );
  const activeProfile = useMemo(
    () => (activePeer ? getProfileByUserId(users, activePeer.id) : null),
    [activePeer, users],
  );
  const myProfile = useMemo<UserProfile | null>(() => {
    if (!displayCurrentUser) return null;

    const seedSelf = seedUsers.find((user) => user.id === displayCurrentUser.id);

    return {
      id: displayCurrentUser.id,
      name: authProfile?.name || displayCurrentUser.name,
      avatar: authInitials || displayCurrentUser.avatar,
      online: displayCurrentUser.online,
      status: authProfile?.statusText || displayCurrentUser.status,
      username:
        authProfile?.username ||
        seedSelf?.username ||
        displayCurrentUser.name.toLowerCase().replace(/\s+/g, "."),
      bio: authProfile?.bio || seedSelf?.bio || "Расскажите о себе.",
      phone: authProfile?.phone || seedSelf?.phone || "—",
      location: authProfile?.location || seedSelf?.location || "—",
      joinedAt: seedSelf?.joinedAt || "2024",
      role: seedSelf?.role || "Member",
      accent: seedSelf?.accent || "from-amber-300 via-orange-200 to-yellow-100",
      interests: seedSelf?.interests || ["Chat"],
      avatarUrl: authProfile?.avatarDataUrl || seedSelf?.avatarUrl,
    };
  }, [authInitials, authProfile, displayCurrentUser]);
  useEffect(() => {
    if (!myProfile) return;
    setMyProfileDraft((prev) => ({
      name: myProfile.name,
      username: myProfile.username,
      bio: myProfile.bio,
      email: authProfile?.email || prev.email || "",
      password: authProfile?.password || prev.password || "",
      phone: myProfile.phone === "—" ? "" : myProfile.phone,
      location: myProfile.location === "—" ? "" : myProfile.location,
      statusText: myProfile.status || "",
      avatarDataUrl: authProfile?.avatarDataUrl || "",
    }));
  }, [authProfile, myProfile]);

  const sharedMessages = useMemo(
    () =>
      activeProfile
        ? activeMessages.filter(
            (message) => message.senderId === activeProfile.id || message.senderId === currentUser?.id,
          )
        : activeMessages,
    [activeMessages, activeProfile, currentUser],
  );
  const panelProfile = profileView === "me" ? myProfile : activeProfile;
  const panelMessages = useMemo(
    () => (profileView === "me" ? activeMessages.filter((message) => message.senderId === currentUser?.id) : sharedMessages),
    [activeMessages, currentUser, profileView, sharedMessages],
  );
  const showTyping = dataSource.provider === "mock" && activeChatId === "c0" && sending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [activeMessages.length, activeChatId, loadingMessages]);

  useEffect(() => {
    if (!playingVoiceId) return;
    const current = messages.find((message) => message.id === playingVoiceId);
    if (!current?.voice) return;
    const timer = window.setTimeout(() => setPlayingVoiceId(null), current.voice * 400);
    return () => window.clearTimeout(timer);
  }, [playingVoiceId, messages]);

  async function handleSend() {
    if (!currentUser || !activeChat) return;

    const trimmed = draft.trim();
    const hasVoice = pendingVoiceSeconds !== null;
    if (!trimmed && !hasVoice) return;

    setSending(true);
    setError(null);

    try {
      await dataSource.sendMessage({
        chatId: activeChat.id,
        senderId: currentUser.id,
        text: trimmed,
        replyTo: replyTo || undefined,
        voice: hasVoice ? pendingVoiceSeconds || undefined : undefined,
      });

      setDraft("");
      setReplyTo(null);
      setPendingVoiceSeconds(null);
      setRecording(false);
      setRecordStart(null);
      setSendPulse(true);
      window.setTimeout(() => setSendPulse(false), 280);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось отправить сообщение.");
    } finally {
      window.setTimeout(() => setSending(false), 350);
    }
  }

  async function addReaction(id: string, type: Reaction["type"]) {
    if (!currentUser) return;
    try {
      await dataSource.toggleReaction({
        messageId: id,
        userId: currentUser.id,
        type,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось поставить реакцию.");
    }
  }

  function startRecord() {
    setRecording(true);
    setRecordStart(Date.now());
    setPendingVoiceSeconds(null);
  }

  function stopRecord() {
    if (!recordStart) {
      setRecording(false);
      return;
    }
    const seconds = Math.max(1, Math.floor((Date.now() - recordStart) / 1000));
    setRecording(false);
    setRecordStart(null);
    setPendingVoiceSeconds(seconds);
  }

  function toggleVoicePlay(id: string) {
    setPlayingVoiceId((prev) => (prev === id ? null : id));
  }

  function selectChat(chatId: string) {
    setActiveChatId(chatId);
    setReplyTo(null);
    if (!isDesktop) {
      setMobileSidebarOpen(false);
      setProfileOpen(false);
    }
  }

  function openMyProfile() {
    setEditingMyProfile(false);
    setMyProfilePageOpen(true);
    setProfileOpen(false);
  }

  function openPeerProfile() {
    setProfileView("peer");
    setProfileOpen(true);
  }

  function closeMyProfilePage() {
    setEditingMyProfile(false);
    setMyProfilePageOpen(false);
  }

  async function signOutToRegistration() {
    await signOutApp();
    setEditingMyProfile(false);
    setMyProfilePageOpen(false);
    setProfileOpen(false);
    setAuthProfile(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthRefreshKey((prev) => prev + 1);
  }

  function updateMyProfileDraft<K extends keyof EditableAuthProfile>(key: K, value: EditableAuthProfile[K]) {
    setMyProfileDraft((prev) => ({ ...prev, [key]: value }));
  }

  function triggerAvatarPicker() {
    profileAvatarInputRef.current?.click();
  }

  function removeAvatarPhoto() {
    updateMyProfileDraft("avatarDataUrl", "");
  }

  function handleProfileAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateMyProfileDraft("avatarDataUrl", result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function saveMyProfile() {
    const normalizedName = myProfileDraft.name.trim() || currentUser?.name || "User";
    const normalizedUsername =
      myProfileDraft.username.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase() || "user";

    const nextProfile: EditableAuthProfile = {
      name: normalizedName,
      username: normalizedUsername,
      bio: myProfileDraft.bio.trim(),
      email: myProfileDraft.email,
      password: myProfileDraft.password,
      phone: myProfileDraft.phone?.trim() || "",
      location: myProfileDraft.location?.trim() || "",
      statusText: myProfileDraft.statusText?.trim() || "",
      avatarDataUrl: myProfileDraft.avatarDataUrl || "",
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ignite.auth", "1");
      window.localStorage.setItem("ignite.profile", JSON.stringify(nextProfile));
    }

    await syncProfileToSupabase(nextProfile);
    setAuthProfile(nextProfile);
    setEditingMyProfile(false);
    setAuthRefreshKey((prev) => prev + 1);
  }

  const handleAuthComplete = async (payload: RegisterPayload, mode: AuthMode) => {
    const nextProfile = (await submitAuth(payload, mode)) as EditableAuthProfile;
    setAuthProfile(nextProfile);
    setIsAuthenticated(true);
    setAuthBooting(false);
    setAuthRefreshKey((prev) => prev + 1);
  };

  if (authBooting) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#f6f1ea_100%)] text-slate-900">
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 px-6 py-4 text-sm text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          Проверяем сессию IgniteChat...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onComplete={handleAuthComplete} />;
  }

  if (!currentUser || !activeChat) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#f6f1ea_100%)] text-slate-900">
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 px-6 py-4 text-sm text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          Загрузка IgniteChat...
        </div>
      </div>
    );
  }


  return (
    <div className="app-shell bg-[#f6f8fb] text-slate-900">

      <div className="relative flex h-full">
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-slate-900/18 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>


                <Sidebar
          isDesktop={isDesktop}
          mobileSidebarOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          provider={dataSource.provider}
          isLive={dataSource.isLive}
          myProfile={myProfile}
          onOpenMyProfile={openMyProfile}
          search={search}
          onSearchChange={setSearch}
          loadingChats={loadingChats}
          filteredChats={filteredChats}
          activeChatId={activeChatId}
          onSelectChat={selectChat}
          formatTime={formatTime}
          qaScenarios={qaScenarios}
        />

        <main className="chat-main-shell relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#fbfcfe_0%,#f8fafc_38%,#f6f8fb_100%)]">
          <div className="pointer-events-none absolute inset-0 opacity-90">
            <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.16),transparent_68%)]" />
            <div className="absolute left-10 top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)]" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/70 to-transparent" />

                    {myProfilePageOpen && myProfile ? (
            <MyProfilePage
              myProfile={myProfile}
              editingMyProfile={editingMyProfile}
              myProfileDraft={myProfileDraft}
              authEmail={authProfile?.email}
              panelMessages={panelMessages}
              onBack={closeMyProfilePage}
              onSignOut={signOutToRegistration}
              onStartEdit={() => setEditingMyProfile(true)}
              onCancelEdit={() => {
                if (myProfile) {
                  setMyProfileDraft({
                    name: myProfile.name,
                    username: myProfile.username,
                    bio: myProfile.bio,
                    email: authProfile?.email || "",
                    password: authProfile?.password || "",
                    phone: myProfile.phone === "—" ? "" : myProfile.phone,
                    location: myProfile.location === "—" ? "" : myProfile.location,
                    statusText: myProfile.status || "",
                    avatarDataUrl: authProfile?.avatarDataUrl || "",
                  });
                }
                setEditingMyProfile(false);
              }}
              onSave={() => void saveMyProfile()}
              onDraftChange={updateMyProfileDraft}
              onTriggerAvatarPicker={triggerAvatarPicker}
              onRemoveAvatarPhoto={removeAvatarPhoto}
              onAvatarInputChange={handleProfileAvatarChange}
              profileAvatarInputRef={profileAvatarInputRef}
              formatMessageMeta={formatMessageMeta}
            />
          ) : (
            <ChatView
              activeChat={activeChat}
              activeProfile={activeProfile}
              activePeer={activePeer}
              myProfile={myProfile}
              showTyping={showTyping}
              error={error}
              loadingMessages={loadingMessages}
              activeMessages={activeMessages}
              currentUserId={currentUser.id}
              hoveredMsg={hoveredMsg}
              setHoveredMsg={setHoveredMsg}
              setReplyTo={setReplyTo}
              addReaction={addReaction}
              findMessageById={findMessageById}
              toggleVoicePlay={toggleVoicePlay}
              playingVoiceId={playingVoiceId}
              isTouch={isTouch}
              formatDayLabel={formatDayLabel}
              sameDay={sameDay}
              bottomRef={bottomRef}
              replyPreview={replyPreview}
              pendingVoiceSeconds={pendingVoiceSeconds}
              setPendingVoiceSeconds={setPendingVoiceSeconds}
              draft={draft}
              setDraft={setDraft}
              handleSend={handleSend}
              sending={sending}
              sendPulse={sendPulse}
              recording={recording}
              startRecord={startRecord}
              stopRecord={stopRecord}
              openMyProfile={openMyProfile}
              openPeerProfile={openPeerProfile}
              setMobileSidebarOpen={setMobileSidebarOpen}
            />
          )}
        </main>

        {panelProfile && (
          <PeerProfilePanel
            profile={panelProfile}
            sharedMessages={panelMessages}
            isDesktop={isDesktop}
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            title={profileView === "me" ? "Мой профиль" : "Профиль"}
            formatMessageMeta={formatMessageMeta}
          />
        )}
      </div>
    </div>
  );
}