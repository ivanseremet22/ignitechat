import type { RealtimeChannel, SupabaseClient, User } from "@supabase/supabase-js";
import type { Chat, Message, Reaction, UserProfile } from "../chat-types";

type ProfileRow = Record<string, unknown> & {
  id: string;
  username?: string | null;
  created_at?: string | null;
};

type ConversationRow = {
  id: string;
  updated_at: string | null;
  last_message_preview: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  created_at: string;
  reply_to: string | null;
  voice_duration: number | null;
  voice_url: string | null;
};

type ReactionRow = {
  message_id: string;
  user_id: string;
  type: Reaction["type"];
};

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
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

function makeAccent(seed: string): string {
  const accents = [
    "from-amber-300 via-orange-200 to-yellow-100",
    "from-fuchsia-300 via-orange-200 to-amber-100",
    "from-sky-200 via-cyan-100 to-white",
    "from-emerald-200 via-teal-100 to-white",
    "from-violet-200 via-fuchsia-100 to-white",
  ] as const;

  let sum = 0;
  for (const char of seed) sum += char.charCodeAt(0);
  return accents[sum % accents.length];
}

function formatJoinedAt(value: string | null): string {
  if (!value) return "2024";
  return new Date(value).toLocaleDateString();
}

function isMissingSchemaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find") ||
    normalized.includes("schema cache") ||
    normalized.includes("column") ||
    normalized.includes("relation")
  );
}

function normalizeProfileRow(row: ProfileRow, authUser?: User | null): UserProfile {
  const email = getNullableString(row.email) ?? authUser?.email ?? null;

  const username =
    getString(row.username).trim() ||
    getString(row.name).trim().toLowerCase().replace(/\s+/g, "") ||
    (email ? email.split("@")[0] : "") ||
    `user_${row.id.slice(0, 6)}`;

  const name =
    getString(row.name).trim() ||
    getString(row.full_name).trim() ||
    username ||
    (email ? email.split("@")[0] : "User");

  const status =
    getString(row.status).trim() ||
    getString(row.status_text).trim() ||
    "не в сети";

  const joinedAtRaw =
    getNullableString(row.joined_at) ??
    getNullableString(row.created_at) ??
    authUser?.created_at ??
    null;

  const avatarUrl =
    getString(row.avatar_url).trim() ||
    getString(row.avatar).trim() ||
    getString(row.avatarDataUrl).trim();

  return {
    id: row.id,
    name,
    avatar: getInitials(name),
    online: getBoolean(row.online, false),
    status,
    username,
    bio: getString(row.bio).trim() || "Пока без описания.",
    phone: getString(row.phone).trim() || "—",
    location: getString(row.location).trim() || "—",
    joinedAt: formatJoinedAt(joinedAtRaw),
    role: getString(row.role).trim() || "Member",
    accent: makeAccent(row.id),
    interests: ["Chat"],
    avatarUrl: avatarUrl || undefined,
  };
}

function mapMessages(rows: MessageRow[], reactions: ReactionRow[]): Message[] {
  return rows
    .map((row) => ({
      id: row.id,
      chatId: row.conversation_id,
      senderId: row.sender_id,
      text: row.text ?? "",
      createdAt: row.created_at,
      replyTo: row.reply_to ?? undefined,
      voice: row.voice_duration ?? undefined,
      voiceUrl: row.voice_url,
      reactions: reactions
        .filter((reaction) => reaction.message_id === row.id)
        .map((reaction) => ({
          userId: reaction.user_id,
          type: reaction.type,
        })),
      seen: true,
      status: "sent" as const,
    }))
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

async function getAuthenticatedUser(client: SupabaseClient): Promise<User> {
  const userResult = await client.auth.getUser();
  const user = userResult.data.user;

  if (!user) {
    throw new Error("Сессия не найдена.");
  }

  return user;
}

async function fetchProfileRows(
  client: SupabaseClient,
  query: { userId?: string; excludeUserId?: string; ids?: string[] } = {},
): Promise<ProfileRow[]> {
  let builder = client.from("profiles").select("*");

  if (query.userId) {
    builder = builder.eq("id", query.userId);
  }

  if (query.excludeUserId) {
    builder = builder.neq("id", query.excludeUserId);
  }

  if (query.ids && query.ids.length > 0) {
    builder = builder.in("id", query.ids);
  }

  builder = builder.order("username", { ascending: true });

  const result = await builder;

  if (result.error) {
    throw new Error(result.error.message || "Не удалось загрузить profiles.");
  }

  return (result.data ?? []) as ProfileRow[];
}

export async function fetchCurrentProfile(client: SupabaseClient): Promise<UserProfile> {
  const user = await getAuthenticatedUser(client);
  const rows = await fetchProfileRows(client, { userId: user.id });
  const profile = rows[0];

  if (!profile) {
    return normalizeProfileRow(
      {
        id: user.id,
        username: user.email?.split("@")[0] ?? null,
        created_at: user.created_at,
      },
      user,
    );
  }

  return normalizeProfileRow(profile, user);
}

export async function fetchUsers(client: SupabaseClient, currentUserId: string): Promise<UserProfile[]> {
  try {
    const rows = await fetchProfileRows(client, { excludeUserId: currentUserId });
    return rows.map((row) => normalizeProfileRow(row));
  } catch (error) {
    console.error("fetchUsers error:", error);
    return [];
  }
}

export async function fetchChats(client: SupabaseClient, currentUserId: string): Promise<Chat[]> {
  const participantResult = await client
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .eq("user_id", currentUserId);

  if (participantResult.error) {
    if (isMissingSchemaError(participantResult.error.message)) {
      return [];
    }

    throw new Error(participantResult.error.message || "Не удалось загрузить чаты.");
  }

  const myParticipants = (participantResult.data ?? []) as ConversationParticipantRow[];
  const conversationIds = myParticipants.map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return [];
  }

  const conversationsResult = await client
    .from("conversations")
    .select("id,updated_at,last_message_preview")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (conversationsResult.error) {
    if (isMissingSchemaError(conversationsResult.error.message)) {
      return [];
    }

    throw new Error(conversationsResult.error.message || "Не удалось загрузить чаты.");
  }

  const participantsResult = await client
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .in("conversation_id", conversationIds);

  if (participantsResult.error) {
    if (isMissingSchemaError(participantsResult.error.message)) {
      return [];
    }

    throw new Error(participantsResult.error.message || "Не удалось загрузить участников.");
  }

  const conversations = (conversationsResult.data ?? []) as ConversationRow[];
  const allParticipants = (participantsResult.data ?? []) as ConversationParticipantRow[];

  const otherUserIds = Array.from(
    new Set(
      allParticipants
        .filter((row) => row.user_id !== currentUserId)
        .map((row) => row.user_id),
    ),
  );

  const profilesMap = new Map<string, UserProfile>();

  if (otherUserIds.length > 0) {
    try {
      const profileRows = await fetchProfileRows(client, { ids: otherUserIds });

      for (const profile of profileRows) {
        profilesMap.set(profile.id, normalizeProfileRow(profile));
      }
    } catch (error) {
      console.error("fetchChats profiles error:", error);
    }
  }

  return conversations.map((conversation) => {
    const peerParticipant = allParticipants.find(
      (participant) =>
        participant.conversation_id === conversation.id && participant.user_id !== currentUserId,
    );

    const peerProfile = peerParticipant ? profilesMap.get(peerParticipant.user_id) : undefined;
    const title = peerProfile?.name || peerProfile?.username || "Новый чат";

    return {
      id: conversation.id,
      title,
      avatar: peerProfile?.avatar || getInitials(title),
      preview: conversation.last_message_preview?.trim() || "Сообщений пока нет",
      updatedAt: conversation.updated_at || new Date().toISOString(),
      unread: 0,
      pinned: false,
      peerId: peerProfile?.id,
    };
  });
}

export async function fetchMessages(client: SupabaseClient, conversationId: string): Promise<Message[]> {
  const messagesResult = await client
    .from("messages")
    .select("id,conversation_id,sender_id,text,created_at,reply_to,voice_duration,voice_url")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesResult.error) {
    if (isMissingSchemaError(messagesResult.error.message)) {
      return [];
    }

    throw new Error(messagesResult.error.message || "Не удалось загрузить сообщения.");
  }

  const messageRows = (messagesResult.data ?? []) as MessageRow[];

  if (messageRows.length === 0) {
    return [];
  }

  const reactionsResult = await client
    .from("message_reactions")
    .select("message_id,user_id,type")
    .in("message_id", messageRows.map((row) => row.id));

  if (reactionsResult.error) {
    if (isMissingSchemaError(reactionsResult.error.message)) {
      return mapMessages(messageRows, []);
    }

    throw new Error(reactionsResult.error.message || "Не удалось загрузить реакции.");
  }

  const reactionRows = (reactionsResult.data ?? []) as ReactionRow[];
  return mapMessages(messageRows, reactionRows);
}

export async function createOrGetDirectConversation(
  client: SupabaseClient,
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const mineResult = await client
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .eq("user_id", currentUserId);

  if (mineResult.error) {
    throw new Error(mineResult.error.message || "Не удалось найти чаты.");
  }

  const myRows = (mineResult.data ?? []) as ConversationParticipantRow[];
  const conversationIds = myRows.map((row) => row.conversation_id);

  if (conversationIds.length > 0) {
    const participantsResult = await client
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", conversationIds);

    if (participantsResult.error) {
      throw new Error(participantsResult.error.message || "Не удалось проверить участников.");
    }

    const participants = (participantsResult.data ?? []) as ConversationParticipantRow[];
    const participantMap = new Map<string, string[]>();

    for (const row of participants) {
      const list = participantMap.get(row.conversation_id) ?? [];
      list.push(row.user_id);
      participantMap.set(row.conversation_id, list);
    }

    for (const [conversationId, memberIds] of participantMap.entries()) {
      const unique = Array.from(new Set(memberIds));

      if (
        unique.length === 2 &&
        unique.includes(currentUserId) &&
        unique.includes(otherUserId)
      ) {
        return conversationId;
      }
    }
  }

  const conversationId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const conversationInsert = await client.from("conversations").insert({
    id: conversationId,
    last_message_preview: null,
  });

  if (conversationInsert.error) {
    throw new Error(conversationInsert.error.message || "Не удалось создать чат.");
  }

  const myParticipantInsert = await client.from("conversation_participants").insert({
    conversation_id: conversationId,
    user_id: currentUserId,
  });

  if (myParticipantInsert.error) {
    throw new Error(myParticipantInsert.error.message || "Не удалось добавить вас в чат.");
  }

  const peerParticipantInsert = await client.from("conversation_participants").insert({
    conversation_id: conversationId,
    user_id: otherUserId,
  });

  if (peerParticipantInsert.error) {
    throw new Error(peerParticipantInsert.error.message || "Не удалось добавить собеседника в чат.");
  }

  return conversationId;
}

export async function sendMessageToConversation(
  client: SupabaseClient,
  input: {
    conversationId: string;
    senderId: string;
    text: string;
    replyTo?: string;
    voice?: number;
  },
): Promise<void> {
  const preview = input.voice
    ? "🎤 Голосовое сообщение"
    : input.text.trim() || "Сообщение";

  const messageInsert = await client
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      text: input.text || "",
      reply_to: input.replyTo ?? null,
      voice_duration: input.voice ?? null,
      voice_url: null,
    });

  if (messageInsert.error) {
    throw new Error(messageInsert.error.message || "Не удалось отправить сообщение.");
  }

  const conversationUpdate = await client
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq("id", input.conversationId);

  if (conversationUpdate.error) {
    throw new Error(conversationUpdate.error.message || "Не удалось обновить чат.");
  }
}

export async function toggleMessageReaction(
  client: SupabaseClient,
  input: {
    messageId: string;
    userId: string;
    type: Reaction["type"];
  },
): Promise<void> {
  const existingResult = await client
    .from("message_reactions")
    .select("message_id,user_id,type")
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .eq("type", input.type)
    .maybeSingle();

  if (existingResult.error) {
    throw new Error(existingResult.error.message || "Не удалось проверить реакцию.");
  }

  const existing = existingResult.data;

  if (existing) {
    const removeResult = await client
      .from("message_reactions")
      .delete()
      .eq("message_id", input.messageId)
      .eq("user_id", input.userId)
      .eq("type", input.type);

    if (removeResult.error) {
      throw new Error(removeResult.error.message || "Не удалось убрать реакцию.");
    }

    return;
  }

  const removeOtherTypes = await client
    .from("message_reactions")
    .delete()
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId);

  if (removeOtherTypes.error) {
    throw new Error(removeOtherTypes.error.message || "Не удалось обновить реакцию.");
  }

  const insertResult = await client
    .from("message_reactions")
    .insert({
      message_id: input.messageId,
      user_id: input.userId,
      type: input.type,
    });

  if (insertResult.error) {
    throw new Error(insertResult.error.message || "Не удалось сохранить реакцию.");
  }
}

export function subscribeToConversation(
  client: SupabaseClient,
  conversationId: string,
  callback: () => void,
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = client
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => callback(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => callback(),
      )
      .subscribe();
  } catch (error) {
    console.error("subscribeToConversation error:", error);
  }

  return () => {
    if (channel) {
      void client.removeChannel(channel);
    }
  };
}