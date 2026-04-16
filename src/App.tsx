import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, Search, UserRound, Video, X, Flame, AlertCircle } from "lucide-react";
import AuthPage, { type AuthMode, type RegisterPayload, getInitials } from "./AuthPage";
import type { Chat, EditableAuthProfile, Message, MessageStatus, Reaction, UserProfile } from "./chat-types";
import Sidebar from "./components/chat/Sidebar";
import MyProfilePage from "./components/chat/MyProfilePage";
import ChatView from "./components/chat/ChatView";
import PeerProfilePanel from "./components/chat/PeerProfilePanel";
import GroupProfilePanel from "./components/chat/GroupProfilePanel";
import BottomNavBar from "./components/chat/BottomNavBar";
import DiscoverView from "./components/chat/DiscoverView";
import ProfileView from "./components/chat/PostView";
import { Button } from "./components/ui/button";
import {
  authClient,
  hasSupabaseAuth,
  readStoredAuthFlag,
  readStoredProfile,
  restoreAuthProfile,
  signOutApp,
  supabaseConfigError,
  syncProfileToSupabase,
} from "./lib/auth";
import {
  createGroupConversation,
  getOrCreateConversation,
  deleteMessage,
  fetchChats,
  fetchCurrentProfile,
  fetchMessages,
  fetchUsers,
  sendMessageToConversation,
  subscribeToChatList,
  subscribeToConversation,
  toggleMessageReaction,
  updateMessage,
  updateReadStatus,
  uploadAvatar,
  type ChatListRealtimeEvent,
  type ConversationRealtimeEvent,
} from "./lib/chat";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
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

type UnreadMap = Record<string, number>;
type ReadCursorMap = Record<string, string>;

function buildChatPreview(message: { text?: string | null; voice_duration?: number | null; voice?: number | null }) {
  const hasVoice =
    typeof message.voice_duration === "number" ||
    typeof message.voice === "number";
  if (hasVoice) return "🎤 Голосовое сообщение";
  const text = typeof message.text === "string" ? message.text.trim() : "";
  return text || "Сообщение";
}

function sortChatsByActivity(items: Chat[]) {
  return [...items].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function unreadStorageKey(userId: string) {
  return `ignitechat:unread:${userId}`;
}

function readCursorStorageKey(userId: string) {
  return `ignitechat:read-cursor:${userId}`;
}

function readJsonRecord<T extends Record<string, unknown>>(key: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {} as T;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJsonRecord(key: string, value: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function mergeUnreadIntoChats(baseChats: Chat[], unreadMap: UnreadMap) {
  return sortChatsByActivity(
    baseChats.map((chat) => ({
      ...chat,
      unread: unreadMap[chat.id] ?? chat.unread ?? 0,
    })),
  );
}

function applyPeerReadCursor(
  messages: Message[],
  currentUserId: string,
  peerReadAt?: string | null,
): Message[] {
  const readTime = peerReadAt ? new Date(peerReadAt).getTime() : null;

  return messages.map((message) => {
    // Если сообщение не наше (пришло от собеседника), оно не имеет статуса "прочитано" для нас в плане индикатора
    if (message.senderId !== currentUserId) {
      return {
        ...message,
        seen: false,
        status: "sent" as MessageStatus,
      };
    }

    // Для наших сообщений проверяем, прочитал ли их собеседник
    const isSeen = readTime !== null && new Date(message.createdAt).getTime() <= readTime;
    
    let status: MessageStatus = "sent";
    if (message.status === "error") status = "error";
    else if (isSeen) status = "seen";

    return {
      ...message,
      seen: isSeen,
      status,
    };
  });
}

function upsertChatWithPatch(chats: Chat[], patch: Chat) {
  const filtered = chats.filter((chat) => chat.id !== patch.id);
  return sortChatsByActivity([patch, ...filtered]);
}

function coercePayloadRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getStringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}


export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedPathname = useMemo(() => {
    const trimmed = location.pathname.replace(/\/+$/, "");
    return trimmed || "/";
  }, [location.pathname]);
  const routeChatId = useMemo(() => {
    const match = normalizedPathname.match(/^\/chat\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [normalizedPathname]);
  const isAuthRoute = normalizedPathname === "/auth";

  const [activeTab, setActiveTab] = useState<"chats" | "discover" | "profile" | "stats" | "groups" | "post">("post");
  const isProfileRoute = normalizedPathname === "/profile";
  const isChatRoute = normalizedPathname === "/chat" || Boolean(routeChatId);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readStoredAuthFlag());
  const [authProfile, setAuthProfile] = useState<EditableAuthProfile | null>(
    () => (readStoredProfile() as EditableAuthProfile | null),
  );
  const [authBooting, setAuthBooting] = useState<boolean>(hasSupabaseAuth);
  const [authRefreshKey, setAuthRefreshKey] = useState(0);

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sendPulse, setSendPulse] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [pendingVoiceSeconds, setPendingVoiceSeconds] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState<"peer" | "me" | "group">("peer");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myProfilePageOpen, setMyProfilePageOpen] = useState(false);
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
  const mobileEmptyStatePromptShownRef = useRef(false);
  const unreadMapRef = useRef<UnreadMap>({});
  const peerReadCursorRef = useRef<ReadCursorMap>({});
  const activeChatIdRef = useRef<string | null>(null);
  const currentProfileRef = useRef<UserProfile | null>(null);

  const provider = authClient ? "supabase" : "mock";
  const currentUserId = currentProfile?.id || "";
  const totalUnread = useMemo(() => chats.reduce((acc, chat) => acc + (chat.unread || 0), 0), [chats]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    currentProfileRef.current = currentProfile;
  }, [currentProfile]);

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
        setCurrentProfile(null);
        setUsers([]);
        setChats([]);
        setMessages([]);
        setActiveChatId(null);
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
    mobileEmptyStatePromptShownRef.current = false;
  }, [authRefreshKey]);

  useEffect(() => {
    if (
      isDesktop ||
      !isAuthenticated ||
      loadingChats ||
      mobileEmptyStatePromptShownRef.current ||
      myProfilePageOpen ||
      profileOpen
    ) {
      return;
    }

    if (currentProfile && chats.length === 0 && !activeChatId) {
      setMobileSidebarOpen(true);
      mobileEmptyStatePromptShownRef.current = true;
    }
  }, [
    activeChatId,
    chats.length,
    currentProfile,
    isAuthenticated,
    isDesktop,
    loadingChats,
    myProfilePageOpen,
    profileOpen,
  ]);
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingChats(false);
      return;
    }

    if (!authClient) {
      setError(supabaseConfigError || "Supabase не настроен. Проверь env переменные.");
      setLoadingChats(false);
      return;
    }

    const client = authClient;
    let mounted = true;

    async function loadBootData() {
      setLoadingChats(true);
      setError(null);

      try {
        let nextCurrentProfile: UserProfile | null = null;

        try {
          nextCurrentProfile = await fetchCurrentProfile(client);
        } catch {
          const {
            data: { user },
          } = await client.auth.getUser();

          if (!user) {
            throw new Error("Сессия пользователя не найдена.");
          }

          const { data: profileRows, error: profileError } = await client
            .from("profiles")
            .select("id, username, created_at")
            .eq("id", user.id)
            .limit(1);

          if (profileError) {
            throw profileError;
          }

          const row = profileRows?.[0];

          if (!row) {
            throw new Error("Профиль в таблице profiles не найден.");
          }

          nextCurrentProfile = {
            id: row.id,
            name: authProfile?.name || row.username || "User",
            username: row.username || "user",
            bio: authProfile?.bio || "",
            avatar: getInitials(authProfile?.name || row.username || "User"),
            avatarUrl: authProfile?.avatarDataUrl || "",
            phone: authProfile?.phone || "—",
            location: authProfile?.location || "—",
            status: authProfile?.statusText || "В сети",
            joinedAt: row.created_at || new Date().toISOString(),
            online: true,
            role: "Member",
            accent: "from-amber-300 via-orange-200 to-yellow-100",
            interests: ["Chat"],
          };
        }

        if (!nextCurrentProfile) {
          throw new Error("Не удалось подготовить профиль текущего пользователя.");
        }

        const [nextUsers, fetchedChats] = await Promise.all([
          fetchUsers(client, nextCurrentProfile.id),
          fetchChats(client, nextCurrentProfile.id),
        ]);

        if (!mounted) return;

        const savedUnread = readJsonRecord<UnreadMap>(unreadStorageKey(nextCurrentProfile.id));
        const savedReadCursors = readJsonRecord<ReadCursorMap>(readCursorStorageKey(nextCurrentProfile.id));

        unreadMapRef.current = savedUnread;
        peerReadCursorRef.current = savedReadCursors;

        const nextChats = mergeUnreadIntoChats(fetchedChats, savedUnread);

        // Синхронизируем курсоры прочтения из БД
        fetchedChats.forEach((chat) => {
          if (chat.peerReadAt) {
            const current = peerReadCursorRef.current[chat.id];
            if (!current || new Date(chat.peerReadAt).getTime() > new Date(current).getTime()) {
              peerReadCursorRef.current[chat.id] = chat.peerReadAt;
            }
          }
        });

        setCurrentProfile(nextCurrentProfile);
        setUsers(nextUsers);
        setChats(nextChats);
        setActiveChatId((prev) => {
          if (prev && nextChats.some((chat) => chat.id === prev)) return prev;
          return nextChats[0]?.id ?? null;
        });
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить приложение.");
      } finally {
        if (mounted) {
          setLoadingChats(false);
        }
      }
    }

    void loadBootData();

    return () => {
      mounted = false;
    };
  }, [authRefreshKey, isAuthenticated]);


  useEffect(() => {
    if (!isAuthenticated || !authClient || !currentProfile) return;

    const client = authClient;
    const currentUserId = currentProfile.id;

    const presenceChannel = client.channel("online-users", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    // Подписка на новые профили для живого поиска
    const profilesChannel = client
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async () => {
          try {
            const nextUsers = await fetchUsers(client, currentUserId);
            setUsers(nextUsers);
          } catch (err) {
            console.error("Error refreshing users from realtime:", err);
          }
        }
      )
      .subscribe();

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set(Object.keys(state));
        setOnlineUsers(onlineIds);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          newPresences.forEach((p: any) => next.add(p.presence_ref));
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          leftPresences.forEach((p: any) => next.delete(p.presence_ref));
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      void client.removeChannel(presenceChannel);
      void client.removeChannel(profilesChannel);
    };
  }, [authClient, currentProfile?.id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !authClient || !currentProfile) return;

    const client = authClient;
    const currentUserId = currentProfile.id;
    let alive = true;

    const persistUnread = () => {
      writeJsonRecord(unreadStorageKey(currentUserId), unreadMapRef.current);
    };

    const refreshFromServer = async (keepChatId?: string | null) => {
      try {
        const fetchedChats = await fetchChats(client, currentUserId);
        if (!alive) return;
        const mergedChats = mergeUnreadIntoChats(fetchedChats, unreadMapRef.current);
        setChats(mergedChats);
        setActiveChatId((prev) => {
          const target = keepChatId ?? routeChatId ?? prev;
          if (target && mergedChats.some((chat) => chat.id === target)) return target;
          return mergedChats[0]?.id ?? null;
        });
      } catch (error) {
        console.error("chat list refresh error:", error);
      }
    };

    const unsubscribe = subscribeToChatList(client, currentUserId, (event: ChatListRealtimeEvent) => {
      if (!alive) return;

      if (event.kind === "message" && (event.event === "INSERT" || event.event === "UPDATE")) {
        const payload = coercePayloadRecord(event.payload);
        const nextRow =
          (event.event as string) === "DELETE"
            ? coercePayloadRecord(payload.old)
            : coercePayloadRecord(payload.new);

        const conversationId = getStringField(nextRow, "conversation_id");
        const senderId = getStringField(nextRow, "sender_id");
        const createdAt = getStringField(nextRow, "created_at") || new Date().toISOString();

        if (!conversationId) return;

        const isMine = senderId === currentUserId;
        const isActiveChat = activeChatIdRef.current === conversationId;
        const preview = buildChatPreview({
          text: typeof nextRow.text === "string" ? nextRow.text : null,
          voice_duration:
            typeof nextRow.voice_duration === "number" ? nextRow.voice_duration : null,
        });

        let found = false;

        setChats((prev) => {
          const nextChats = prev.map((chat) => {
            if (chat.id !== conversationId) return chat;
            found = true;

            let unread = chat.unread ?? 0;
            if ((event.event as string) === "INSERT" && !isMine && !isActiveChat) {
              unread = unread + 1;
              unreadMapRef.current = {
                ...unreadMapRef.current,
                [conversationId]: unread,
              };
              persistUnread();
            }

            if (isActiveChat) {
              unread = 0;
              if (conversationId in unreadMapRef.current) {
                const nextUnread = { ...unreadMapRef.current };
                delete nextUnread[conversationId];
                unreadMapRef.current = nextUnread;
                persistUnread();
              }
            }

            return {
              ...chat,
              preview,
              updatedAt: createdAt,
              unread,
            };
          });

          if (found) {
            return sortChatsByActivity(nextChats);
          } else if (event.event === "INSERT") {
            // Если чат не найден и это новое сообщение, обновляем список целиком
            void refreshFromServer(activeChatIdRef.current);
          }
          return prev;
        });

        return;
      }

      void refreshFromServer(activeChatIdRef.current);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [authClient, currentProfile?.id, isAuthenticated, routeChatId]);

  useEffect(() => {
    if (!isAuthenticated || !authClient || !activeChatId || !currentProfile) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const client = authClient;
    const currentUserId = currentProfile.id;
    let active = true;
    setLoadingMessages(true);
    setError(null);

    const persistUnread = () => {
      writeJsonRecord(unreadStorageKey(currentUserId), unreadMapRef.current);
    };

    const persistReadCursors = () => {
      writeJsonRecord(readCursorStorageKey(currentUserId), peerReadCursorRef.current);
    };

    const clearUnreadForActiveChat = () => {
      if (unreadMapRef.current[activeChatId]) {
        const nextUnread = { ...unreadMapRef.current };
        delete nextUnread[activeChatId];
        unreadMapRef.current = nextUnread;
        persistUnread();
      }

      setChats((prev) =>
        prev.map((chat) => (chat.id === activeChatId ? { ...chat, unread: 0 } : chat)),
      );
    };

    const applyPeerReadAt = (readAt?: string | null) => {
      if (!readAt) return;
      const previous = peerReadCursorRef.current[activeChatId];
      if (previous && new Date(previous).getTime() >= new Date(readAt).getTime()) {
        return;
      }

      peerReadCursorRef.current = {
        ...peerReadCursorRef.current,
        [activeChatId]: readAt,
      };
      persistReadCursors();

      // Обновляем сообщения
      setMessages((prev) => applyPeerReadCursor(prev, currentUserId, readAt));

      // Обновляем чат в списке, чтобы сохранить состояние
      setChats((prev) =>
        prev.map((chat) => (chat.id === activeChatId ? { ...chat, peerReadAt: readAt } : chat)),
      );
    };

    const readChannel = client
      .channel(`read-receipts:${activeChatId}`)
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const record = coercePayloadRecord(payload);
        const userId = getStringField(record, "userId");
        const chatId = getStringField(record, "chatId");
        const readAt = getStringField(record, "readAt");
        if (!userId || userId === currentUserId || chatId !== activeChatId || !readAt) return;
        applyPeerReadAt(readAt);
      })
      .subscribe();

    const broadcastRead = async (readAt: string) => {
      // Обновляем локально только если время больше текущего
      const previous = peerReadCursorRef.current[activeChatId];
      if (previous && new Date(previous).getTime() >= new Date(readAt).getTime()) {
        // Если это наше сообщение (или мы его уже пометили прочитанным), 
        // всё равно очищаем unread, но не шлем broadcast старого времени
        clearUnreadForActiveChat();
        return;
      }

      clearUnreadForActiveChat();
      try {
        // Обновляем в БД для персистентности
        void updateReadStatus(client, activeChatId, currentUserId, readAt);

        // Транслируем в реалтайме для мгновенного обновления у собеседника
        await readChannel.send({
          type: "broadcast",
          event: "read",
          payload: {
            chatId: activeChatId,
            userId: currentUserId,
            readAt,
          },
        });
      } catch (error) {
        console.error("read receipt broadcast error:", error);
      }
    };

    const loadConversation = async () => {
      try {
        const fetchedMessages = await fetchMessages(client, activeChatId);
        if (!active) return;

        const peerReadAt = peerReadCursorRef.current[activeChatId];
        const nextMessages = applyPeerReadCursor(fetchedMessages, currentUserId, peerReadAt);
        
        // Сначала обновляем сообщения
        setMessages(nextMessages);

        // Затем проверяем наличие новых сообщений от собеседника для отправки статуса "прочитано"
        const peerMessages = nextMessages.filter((message) => message.senderId !== currentUserId);
        const latestPeerMessage = peerMessages[peerMessages.length - 1];

        clearUnreadForActiveChat();

        if (latestPeerMessage) {
          void broadcastRead(latestPeerMessage.createdAt);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить сообщения.");
      } finally {
        if (active) {
          setLoadingMessages(false);
        }
      }
    };

    void loadConversation();

    const unsubscribe = subscribeToConversation(
      client,
      activeChatId,
      (event: ConversationRealtimeEvent) => {
        if (!active) return;

        if (event.kind === "message") {
          const payload = coercePayloadRecord(event.payload);
          const nextRow =
            event.event === "DELETE"
              ? coercePayloadRecord(payload.old)
              : coercePayloadRecord(payload.new);

          const createdAt = getStringField(nextRow, "created_at") || new Date().toISOString();
          const senderId = getStringField(nextRow, "sender_id");

          if (event.event === "INSERT" || event.event === "UPDATE") {
            setChats((prev) =>
              sortChatsByActivity(
                prev.map((chat) =>
                  chat.id === activeChatId
                    ? {
                        ...chat,
                        preview: buildChatPreview({
                          text: typeof nextRow.text === "string" ? nextRow.text : null,
                          voice_duration:
                            typeof nextRow.voice_duration === "number" ? nextRow.voice_duration : null,
                        }),
                        updatedAt: createdAt,
                        unread: 0,
                      }
                    : chat,
                ),
              ),
            );
          }

          void loadConversation();

          if (event.event === "INSERT" && senderId && senderId !== currentUserId) {
            void broadcastRead(createdAt);
          } else if (event.event === "INSERT" && senderId === currentUserId) {
            // Если мы сами отправили сообщение с другого устройства, убираем unread
            clearUnreadForActiveChat();
          }

          return;
        }

        if (event.kind === "participant") {
          const payload = coercePayloadRecord(event.payload);
          const nextRow =
            event.event === "DELETE"
              ? coercePayloadRecord(payload.old)
              : coercePayloadRecord(payload.new);

          const userId = getStringField(nextRow, "user_id");
          const readAt = getStringField(nextRow, "last_read_at");

          if (userId && userId !== currentUserId && readAt) {
            applyPeerReadAt(readAt);
          }
          return;
        }

        void loadConversation();
      },
    );

    return () => {
      active = false;
      unsubscribe();
      void client.removeChannel(readChannel);
    };
  }, [activeChatId, authClient, currentProfile?.id, isAuthenticated]);

  const filteredChats = useMemo(() => {
    const term = search.trim().replace(/^@/, "").toLowerCase();
    if (!term) return chats;
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(term) ||
        chat.preview.toLowerCase().includes(term) ||
        (chat.peerId && users.find(u => u.id === chat.peerId)?.username.toLowerCase().includes(term))
    );
  }, [search, chats, users]);

  const searchResults = useMemo(() => {
    const term = search.trim().replace(/^@/, "").toLowerCase();
    if (!term || !currentProfile) return [];

    const existingPeerIds = new Set(chats.map((chat) => chat.peerId).filter(Boolean));
    return users
      .filter((user) => {
        const matches =
          user.username.toLowerCase().includes(term) || user.name.toLowerCase().includes(term);
        return matches && user.id !== currentProfile.id;
      })
      .sort((left, right) => left.username.localeCompare(right.username))
      .slice(0, 8)
      .map((user) => ({
        ...user,
        status: existingPeerIds.has(user.id) ? "Чат уже есть" : user.status,
      }));
  }, [chats, currentProfile, search, users]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [activeChatId, chats],
  );

  const activeMessages = useMemo(
    () => messages.filter((message) => message.chatId === activeChatId),
    [messages, activeChatId],
  );

  const activePeer = useMemo(() => {
    if (!activeChat?.peerId) return null;
    return users.find((user) => user.id === activeChat.peerId) || null;
  }, [activeChat, users]);

  const replyPreview = useMemo(
    () => findMessageById(activeMessages, replyTo || undefined),
    [activeMessages, replyTo],
  );

  const myProfile = useMemo<UserProfile | null>(() => {
    if (!currentProfile) return null;

    return {
      ...currentProfile,
      name: authProfile?.name || currentProfile.name,
      username: authProfile?.username || currentProfile.username,
      bio: authProfile?.bio || currentProfile.bio,
      phone: authProfile?.phone || (currentProfile.phone === "—" ? "" : currentProfile.phone),
      location: authProfile?.location || (currentProfile.location === "—" ? "" : currentProfile.location),
      status: authProfile?.statusText || currentProfile.status,
      avatar: authProfile?.name ? getInitials(authProfile.name) : currentProfile.avatar,
      avatarUrl: authProfile?.avatarDataUrl || currentProfile.avatarUrl,
      online: true,
    };
  }, [authProfile, currentProfile]);

  const activeProfile = useMemo(() => {
    if (!activePeer) return null;
    return {
      ...activePeer,
      online: onlineUsers.has(activePeer.id),
    };
  }, [activePeer, onlineUsers]);

  useEffect(() => {
    if (!myProfile) return;
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
  }, [authProfile, myProfile]);

  const sharedMessages = useMemo(
    () =>
      activeProfile
        ? activeMessages.filter(
            (message) => message.senderId === activeProfile.id || message.senderId === currentProfile?.id,
          )
        : activeMessages,
    [activeMessages, activeProfile, currentProfile],
  );

  const panelProfile = profileView === "me" ? myProfile : activeProfile;
  const panelMessages = useMemo(
    () =>
      profileView === "me"
        ? activeMessages.filter((message) => message.senderId === currentProfile?.id)
        : sharedMessages,
    [activeMessages, currentProfile, profileView, sharedMessages],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [activeMessages.length, activeChatId, loadingMessages]);

  useEffect(() => {
    if (!playingVoiceId) return;
    const current = messages.find((message) => message.id === playingVoiceId);
    if (!current?.voice) return;
    const timer = window.setTimeout(() => setPlayingVoiceId(null), current.voice * 400);
    return () => window.clearTimeout(timer);
  }, [playingVoiceId, messages]);

  async function refreshChats(keepChatId?: string | null) {
    if (!authClient || !currentProfile) return;
    const client = authClient;
    const nextChats = await fetchChats(client, currentProfile.id);
    setChats(nextChats);
    setActiveChatId((prev) => {
      const target = keepChatId ?? prev;
      if (target && nextChats.some((chat) => chat.id === target)) return target;
      return nextChats[0]?.id ?? null;
    });
  }

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  async function handleEditMessage(messageId: string, newText: string) {
    if (!authClient) return;
    try {
      await updateMessage(authClient, messageId, newText);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: newText } : m)),
      );
      setEditingMessageId(null);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить сообщение.");
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!authClient) return;
    try {
      await deleteMessage(authClient, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить сообщение.");
    }
  }

  async function handleSend() {
    if (!currentProfile || !activeChat || !authClient) return;

    if (editingMessageId) {
      await handleEditMessage(editingMessageId, draft);
      return;
    }

    const client = authClient;
    const trimmed = draft.trim();
    const hasVoice = pendingVoiceSeconds !== null;
    if (!trimmed && !hasVoice) return;

    const optimisticId = `temp-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const optimisticMessage: Message = {
      id: optimisticId,
      chatId: activeChat.id,
      senderId: currentProfile.id,
      text: trimmed,
      createdAt,
      replyTo: replyTo || undefined,
      voice: hasVoice ? pendingVoiceSeconds || undefined : undefined,
      voiceUrl: null,
      reactions: [],
      status: "sending",
      seen: false,
    };

    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, optimisticMessage]);
    setChats((prev) =>
      upsertChatWithPatch(prev, {
        ...activeChat,
        preview: buildChatPreview({
          text: trimmed,
          voice: hasVoice ? pendingVoiceSeconds || undefined : undefined,
        }),
        updatedAt: createdAt,
        unread: 0,
      }),
    );

    try {
      await sendMessageToConversation(client, {
        conversationId: activeChat.id,
        senderId: currentProfile.id,
        text: trimmed,
        replyTo: replyTo || undefined,
        voice: hasVoice ? pendingVoiceSeconds || undefined : undefined,
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === optimisticId ? { ...message, status: "sent" } : message,
        ),
      );

      setDraft("");
      setReplyTo(null);
      setPendingVoiceSeconds(null);
      setRecording(false);
      setRecordStart(null);
      setSendPulse(true);
      window.setTimeout(() => setSendPulse(false), 280);
    } catch (err: unknown) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === optimisticId ? { ...message, status: "error" } : message,
        ),
      );
      setError(err instanceof Error ? err.message : "Не удалось отправить сообщение.");
    } finally {
      window.setTimeout(() => setSending(false), 220);
    }
  }

  async function addReaction(id: string, type: Reaction["type"]) {
    if (!currentProfile || !authClient) return;
    const client = authClient;
    try {
      await toggleMessageReaction(client, {
        messageId: id,
        userId: currentProfile.id,
        type,
      });
      if (activeChatId) {
        const nextMessages = await fetchMessages(client, activeChatId);
        setMessages(nextMessages);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось поставить реакцию.");
    }
  }

  async function startChatWithUser(userId: string) {
    if (!authClient || !currentProfile) return;
    const client = authClient;
    setCreatingChat(userId);
    setError(null);

    try {
      const chatId = await getOrCreateConversation(client, currentProfile.id, userId);
      await refreshChats(chatId);
      const nextMessages = await fetchMessages(client, chatId);
      setMessages(nextMessages);
      setActiveChatId(chatId);
      setSearch("");
      setReplyTo(null);
      navigate(`/chat/${chatId}`);
      if (!isDesktop) {
        setMobileSidebarOpen(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось создать чат.");
    } finally {
      setCreatingChat(null);
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

    if (currentProfileRef.current) {
      if (unreadMapRef.current[chatId]) {
        const nextUnread = { ...unreadMapRef.current };
        delete nextUnread[chatId];
        unreadMapRef.current = nextUnread;
        writeJsonRecord(unreadStorageKey(currentProfileRef.current.id), nextUnread);
      }

      setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat)));
    }

    navigate(`/chat/${chatId}`);
    if (!isDesktop) {
      setMobileSidebarOpen(false);
      setProfileOpen(false);
    }
  }

  function openMyProfile() {
    setEditingMyProfile(false);
    setProfileOpen(false);
    navigate("/profile");
  }

  function openPeerProfile() {
    setProfileView("peer");
    setProfileOpen(true);
  }

  function closeMyProfilePage() {
    setEditingMyProfile(false);
    navigate(activeChatId ? `/chat/${activeChatId}` : "/chat");
  }

  async function signOutToRegistration() {
    await signOutApp();
    setEditingMyProfile(false);
    setMyProfilePageOpen(false);
    setProfileOpen(false);
    setAuthProfile(null);
    setCurrentProfile(null);
    setUsers([]);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    setIsAuthenticated(false);
    setAuthRefreshKey((prev) => prev + 1);
    navigate("/auth", { replace: true });
  }

  function updateMyProfileDraft<K extends keyof EditableAuthProfile>(
    key: K,
    value: EditableAuthProfile[K],
  ) {
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
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateMyProfileDraft("avatarDataUrl", result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function saveMyProfile() {
    if (!authClient || !currentProfile) return;
    const client = authClient;

    const normalizedName = myProfileDraft.name.trim() || currentProfile?.name || "User";
    const normalizedUsername =
      myProfileDraft.username.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase() || "user";

    let finalAvatarUrl = myProfileDraft.avatarDataUrl || "";

    try {
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(client, currentProfile.id, avatarFile);
      }

      const nextProfile: EditableAuthProfile = {
        name: normalizedName,
        username: normalizedUsername,
        bio: myProfileDraft.bio.trim(),
        email: myProfileDraft.email,
        password: myProfileDraft.password,
        phone: myProfileDraft.phone?.trim() || "",
        location: myProfileDraft.location?.trim() || "",
        statusText: myProfileDraft.statusText?.trim() || "",
        avatarDataUrl: finalAvatarUrl,
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ignite.auth", "1");
        window.localStorage.setItem("ignite.profile", JSON.stringify(nextProfile));
      }

      await syncProfileToSupabase(nextProfile);
      setAuthProfile(nextProfile);
      setEditingMyProfile(false);
      setAvatarFile(null);
      setAuthRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль.");
    }
  }

  const handleAuthComplete = (payload: RegisterPayload) => {
    setAuthProfile(payload as EditableAuthProfile);
    setIsAuthenticated(true);
    setAuthBooting(false);
    setAuthRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (authBooting) return;

    if (!isAuthenticated) {
      if (!isAuthRoute) {
        navigate("/auth", { replace: true });
      }
      return;
    }

    if (isAuthRoute || normalizedPathname === "/") {
      navigate(activeChatId ? `/chat/${activeChatId}` : "/chat", { replace: true });
      return;
    }

    if (!isProfileRoute && !isChatRoute) {
      navigate(activeChatId ? `/chat/${activeChatId}` : "/chat", { replace: true });
    }
  }, [
    activeChatId,
    authBooting,
    isAuthenticated,
    isAuthRoute,
    isChatRoute,
    isProfileRoute,
    navigate,
    normalizedPathname,
  ]);

  useEffect(() => {
    if (myProfilePageOpen !== isProfileRoute) {
      setMyProfilePageOpen(isProfileRoute);
    }

    if (isProfileRoute) {
      setProfileOpen(false);
      if (!isDesktop) {
        setMobileSidebarOpen(false);
      }
    }
  }, [isDesktop, isProfileRoute, myProfilePageOpen]);

  useEffect(() => {
    if (authBooting || !isAuthenticated || !isChatRoute || isProfileRoute) return;

    if (routeChatId) {
      if (loadingChats) return;

      const targetExists = chats.some((chat) => chat.id === routeChatId);
      if (!targetExists) {
        navigate(activeChatId ? `/chat/${activeChatId}` : "/chat", { replace: true });
        return;
      }

      if (activeChatId !== routeChatId) {
        setActiveChatId(routeChatId);
      }
      return;
    }

    if (normalizedPathname === "/chat" && activeChatId && !loadingChats) {
      navigate(`/chat/${activeChatId}`, { replace: true });
    }
  }, [
    activeChatId,
    authBooting,
    chats,
    isAuthenticated,
    isChatRoute,
    isProfileRoute,
    loadingChats,
    navigate,
    normalizedPathname,
    routeChatId,
  ]);

  if (authBooting) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 items-center justify-center rounded-[24px] bg-white text-black shadow-2xl flex mb-6 animate-pulse">
            <Flame className="h-8 w-8" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Initializing Adverse...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return isAuthRoute ? <AuthPage onComplete={handleAuthComplete} /> : <Navigate to="/auth" replace />;
  }

  if (!currentProfile) {
    if (loadingChats) {
      return (
        <div className="flex min-h-[100svh] items-center justify-center bg-black text-white">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 items-center justify-center rounded-[24px] bg-white text-black shadow-2xl flex mb-6 animate-pulse">
              <Flame className="h-8 w-8" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Loading Profile...
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-black px-4 text-white">
        <div className="max-w-xl rounded-[40px] border border-white/10 bg-white/5 px-8 py-10 text-center backdrop-blur-3xl shadow-2xl">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-white text-black mx-auto shadow-xl">
             <AlertCircle className="h-8 w-8" />
          </div>
          <div className="mb-2 text-xl font-black uppercase tracking-tighter">Profile Error</div>
          <div className="mb-8 text-sm font-bold text-white/40 uppercase tracking-widest leading-loose">
            Session active but profile sync failed.
          </div>
          <button
            onClick={() => void signOutToRegistration()}
            className="w-full h-16 rounded-3xl bg-white text-black font-black text-lg uppercase tracking-tighter shadow-2xl transition hover:scale-105 active:scale-95"
          >
            Reset Session
          </button>
        </div>
      </div>
    );
  }

  async function submitCreateGroup() {
    if (!authClient || !currentProfile || !newGroupName.trim()) return;
    
    try {
      const userIds = users.map((u) => u.id).concat(currentProfile.id);
      const conversationId = await createGroupConversation(authClient, newGroupName, userIds);
      setActiveChatId(conversationId);
      setIsCreatingGroup(false);
      setNewGroupName("");
      setAuthRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Group creation failed:", err);
      const message = (err as any)?.message || String(err) || "Не удалось создать группу.";
      setError(`Ошибка создания группы: ${message}`);
    }
  }

  return (
    <div className="app-shell bg-black text-white font-sans selection:bg-white/20 h-[100svh] w-full overflow-hidden flex flex-col relative">
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* SIDEBAR - Only visible on desktop or if in chats tab and no active chat */}
        {isDesktop && activeTab === "chats" && (
          <Sidebar
            isDesktop={isDesktop}
            mobileSidebarOpen={true}
            onCloseMobile={() => {}}
            provider={provider}
            isLive={Boolean(authClient)}
            myProfile={myProfile}
            onOpenMyProfile={openMyProfile}
            search={search}
            onSearchChange={setSearch}
            loadingChats={loadingChats}
            filteredChats={filteredChats}
            searchResults={searchResults}
            activeChatId={activeChatId}
            onSelectChat={selectChat}
            onStartChat={startChatWithUser}
            onCreateGroup={() => setIsCreatingGroup(true)}
            formatTime={formatTime}
          />
        )}

        <main className="chat-main-shell relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex-1 flex flex-col min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === "post" ? (
                  <motion.div
                    key="post"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <ProfileView 
                      myProfile={myProfile} 
                      onSaveProfile={async (data) => {
                        if (data.name) updateMyProfileDraft("name", data.name);
                        if (data.bio) updateMyProfileDraft("bio", data.bio);
                        if (data.avatarFile) setAvatarFile(data.avatarFile);
                        await saveMyProfile();
                      }}
                    />
                  </motion.div>
                ) : activeTab === "discover" ? (
                  <motion.div
                    key="discover"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <DiscoverView />
                  </motion.div>
                ) : myProfilePageOpen && myProfile ? (
                  <motion.div
                    key="myprofile"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
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
                  </motion.div>
                ) : activeChat && activeTab === "chats" ? (
                  <motion.div
                    key={`chat-${activeChatId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex"
                  >
                    <div className="flex flex-1 flex-col min-w-0 relative">
                      <ChatView
                        activeChat={activeChat}
                        activeProfile={activeProfile}
                        activePeer={activePeer}
                        myProfile={myProfile}
                        showTyping={false}
                        error={error}
                        loadingMessages={loadingMessages}
                        activeMessages={activeMessages}
                        currentUserId={currentUserId}
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
                        openMyProfile={() => setMyProfilePageOpen(true)}
                        openPeerProfile={() => {
                          if (activeChat?.isGroup) {
                            setProfileView("group");
                          } else {
                            setProfileView("peer");
                          }
                          setProfileOpen(true);
                        }}
                        setMobileSidebarOpen={(open) => {
                          if (!open) setActiveChatId(null);
                        }}
                        onEditMessage={(id, text) => {
                          setEditingMessageId(id);
                          setDraft(text);
                        }}
                        onDeleteMessage={handleDeleteMessage}
                        editingMessageId={editingMessageId}
                        setEditingMessageId={setEditingMessageId}
                      />
                    </div>

                    {profileOpen && profileView === "peer" && activeProfile && (
                      <PeerProfilePanel
                        profile={activeProfile}
                        sharedMessages={sharedMessages}
                        isDesktop={isDesktop}
                        open={profileOpen}
                        onClose={() => setProfileOpen(false)}
                        formatMessageMeta={formatMessageMeta}
                      />
                    )}

                    {profileOpen && profileView === "group" && activeChat && (
                      <GroupProfilePanel
                        chat={activeChat}
                        members={users.filter(u => u.id === activeChat.peerId || u.id === currentUserId)}
                        isDesktop={isDesktop}
                        open={profileOpen}
                        onClose={() => setProfileOpen(false)}
                        onTriggerAvatarPicker={() => {
                          alert("Group avatar upload coming soon!");
                        }}
                      />
                    )}
                  </motion.div>
                ) : activeTab === "chats" ? (
                  <motion.div
                    key="sidebar"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex"
                  >
                    {!isDesktop && (
                      <Sidebar
                        isDesktop={isDesktop}
                        mobileSidebarOpen={true}
                        onCloseMobile={() => {}}
                        provider={provider}
                        isLive={Boolean(authClient)}
                        myProfile={myProfile}
                        onOpenMyProfile={openMyProfile}
                        search={search}
                        onSearchChange={setSearch}
                        loadingChats={loadingChats}
                        filteredChats={filteredChats}
                        searchResults={searchResults}
                        activeChatId={activeChatId}
                        onSelectChat={selectChat}
                        onStartChat={startChatWithUser}
                        onCreateGroup={() => setIsCreatingGroup(true)}
                        formatTime={formatTime}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="coming-soon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-40"
                  >
                    <div className="text-xl font-bold uppercase tracking-widest">Coming Soon</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
      
      {/* NEW BOTTOM NAV BAR */}
      <BottomNavBar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'chats') setActiveChatId(null);
          if (tab === 'profile') openMyProfile();
        }} 
        unreadCount={totalUnread} 
      />
    </div>
  );
}