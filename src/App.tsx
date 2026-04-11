import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, MessageSquarePlus, Search, UserRound, Video } from "lucide-react";
import AuthPage, { type AuthMode, type RegisterPayload, getInitials } from "./AuthPage";
import type { Chat, EditableAuthProfile, Message, Reaction, UserProfile } from "./chat-types";
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
import {
  createOrGetDirectConversation,
  fetchChats,
  fetchCurrentProfile,
  fetchMessages,
  fetchUsers,
  sendMessageToConversation,
  subscribeToConversation,
  toggleMessageReaction,
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readStoredAuthFlag());
  const [authProfile, setAuthProfile] = useState<EditableAuthProfile | null>(
    () => (readStoredProfile() as EditableAuthProfile | null),
  );
  const [authBooting, setAuthBooting] = useState<boolean>(hasSupabaseAuth);
  const [authRefreshKey, setAuthRefreshKey] = useState(0);

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
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
  const [profileView, setProfileView] = useState<"peer" | "me">("peer");
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
      setError("Supabase не настроен. Для реальных чатов нужен .env с ключами.");
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

        const [nextUsers, nextChats] = await Promise.all([
          fetchUsers(client, nextCurrentProfile.id),
          fetchChats(client, nextCurrentProfile.id),
        ]);

        if (!mounted) return;

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
    if (!isAuthenticated || !authClient || !activeChatId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const client = authClient;
    let active = true;
    setLoadingMessages(true);
    setError(null);

    const loadConversation = async () => {
      try {
        const nextMessages = await fetchMessages(client, activeChatId);
        if (!active) return;
        setMessages(nextMessages);
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

    const unsubscribe = subscribeToConversation(client, activeChatId, () => {
      void loadConversation();
      if (currentProfile) {
        void fetchChats(client, currentProfile.id).then((nextChats) => {
          setChats(nextChats);
        });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [activeChatId, authClient, currentProfile, isAuthenticated]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(term) || chat.preview.toLowerCase().includes(term),
    );
  }, [search, chats]);

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
    };
  }, [authProfile, currentProfile]);

  const activeProfile = useMemo(
    () => activePeer,
    [activePeer],
  );

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

  async function handleSend() {
    if (!currentProfile || !activeChat || !authClient) return;

    const client = authClient;
    const trimmed = draft.trim();
    const hasVoice = pendingVoiceSeconds !== null;
    if (!trimmed && !hasVoice) return;

    setSending(true);
    setError(null);

    try {
      await sendMessageToConversation(client, {
        conversationId: activeChat.id,
        senderId: currentProfile.id,
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
      await refreshChats(activeChat.id);
      const nextMessages = await fetchMessages(client, activeChat.id);
      setMessages(nextMessages);
    } catch (err: unknown) {
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
      const chatId = await createOrGetDirectConversation(client, currentProfile.id, userId);
      await refreshChats(chatId);
      setActiveChatId(chatId);
      setSearch("");
      setReplyTo(null);
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
    setCurrentProfile(null);
    setUsers([]);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    setIsAuthenticated(false);
    setAuthRefreshKey((prev) => prev + 1);
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateMyProfileDraft("avatarDataUrl", result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function saveMyProfile() {
    const normalizedName = myProfileDraft.name.trim() || currentProfile?.name || "User";
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

  if (!currentProfile && !loadingChats) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#f6f1ea_100%)] px-4 text-slate-900">
        <div className="max-w-xl rounded-3xl border border-slate-200/90 bg-white/95 px-6 py-5 text-sm text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-2 text-base font-semibold text-slate-900">Не удалось загрузить профиль</div>
          <div className="mb-4">
            Профиль есть в базе, но приложение не смогло его подтянуть. Нажми «Выйти» и войди снова.
          </div>
          <button
            onClick={() => void signOutToRegistration()}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  const provider = authClient ? "supabase" : "mock";

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
          formatTime={formatTime}
        />

        <main className="chat-main-shell relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#fbfcfe_0%,#f8fafc_38%,#f6f8fb_100%)] pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0">
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
          ) : activeChat ? (
            <ChatView
              activeChat={activeChat}
              activeProfile={activeProfile}
              activePeer={activePeer}
              myProfile={myProfile}
              showTyping={false}
              error={error}
              loadingMessages={loadingMessages}
              activeMessages={activeMessages}
              currentUserId={currentProfile?.id || ""}
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
          ) : (
            <section className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-6 md:px-6">
              <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-100 text-slate-900 shadow-[0_12px_30px_rgba(251,146,60,0.16)]">
                    {creatingChat ? <Video className="h-7 w-7 animate-pulse" /> : <MessageSquarePlus className="h-7 w-7" />}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                    Чатов пока нет
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                    Найди пользователя по username в левой колонке и нажми на него — чат создастся сразу в базе.
                  </p>

                  {!isDesktop && (
                    <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition hover:bg-slate-800"
                      >
                        <Search className="h-4 w-4" />
                        Люди и чаты
                      </button>
                      <button
                        type="button"
                        onClick={openMyProfile}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserRound className="h-4 w-4" />
                        Мой профиль
                      </button>
                    </div>
                  )}

                  <div className="mt-6 w-full rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 text-left">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Search className="h-4 w-4 text-orange-500" />
                      Что делать дальше
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      {!isDesktop && <div>0. Нажми «Люди и чаты», чтобы открыть левую колонку</div>}
                      <div>1. Зарегистрируй второй аккаунт с другим email</div>
                      <div>2. Войди под одним аккаунтом</div>
                      <div>3. Слева введи @username второго пользователя</div>
                      <div>4. Нажми на найденного пользователя — начнётся диалог</div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-5 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </section>
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

        {isAuthenticated && !isDesktop && (
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            <div className="pointer-events-auto mx-auto grid max-w-md grid-cols-3 gap-2 rounded-[28px] border border-white/70 bg-white/92 p-2 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  setMyProfilePageOpen(false);
                  setProfileOpen(false);
                  setMobileSidebarOpen(true);
                }}
                className={
                  "flex flex-col items-center justify-center gap-1 rounded-[20px] px-3 py-2.5 text-[11px] font-semibold transition " +
                  (mobileSidebarOpen && !myProfilePageOpen
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                }
              >
                <MessageCircle className="h-5 w-5" />
                <span>Чаты</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMyProfilePageOpen(false);
                  setProfileOpen(false);
                  setSearch("");
                  setMobileSidebarOpen(true);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-[20px] bg-slate-950 px-3 py-2.5 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
              >
                <MessageSquarePlus className="h-5 w-5" />
                <span>Новый чат</span>
              </button>

              <button
                type="button"
                onClick={openMyProfile}
                className={
                  "flex flex-col items-center justify-center gap-1 rounded-[20px] px-3 py-2.5 text-[11px] font-semibold transition " +
                  (myProfilePageOpen
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                }
              >
                <UserRound className="h-5 w-5" />
                <span>Профиль</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
