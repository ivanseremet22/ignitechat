import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chat, Message, Reaction, UserProfile } from "../chat-types";

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  avatar_url: string | null;
  online: boolean | null;
  status: string | null;
  phone: string | null;
  location: string | null;
  joined_at: string | null;
  role: string | null;
};

type ConversationRow = {
  id: string;
  updated_at: string;
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

function assertNoError<T>(result: { data: T; error: { message: string } | null }, fallback: string): T {
  if (result.error) {
    throw new Error(result.error.message || fallback);
  }
  return result.data;
}

function mapProfile(row: ProfileRow): UserProfile {
  const name = row.name?.trim() || row.username?.trim() || row.email?.split("@")[0] || "User";

  return {
    id: row.id,
    name,
    avatar: row.avatar?.trim() || getInitials(name),
    online: row.online ?? false,
    status: row.status?.trim() || "не в сети",
    username: row.username?.trim() || name.toLowerCase().replace(/\s+/g, "."),
    bio: row.bio?.trim() || "Пока без описания.",
    phone: row.phone?.trim() || "—",
    location: row.location?.trim() || "—",
    joinedAt: formatJoinedAt(row.joined_at),
    role: row.role?.trim() || "Member",
    accent: makeAccent(row.id),
    interests: ["Chat"],
    avatarUrl: row.avatar_url?.trim() || undefined,
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

export async function fetchCurrentProfile(client: SupabaseClient): Promise<UserProfile> {
  const userResult = await client.auth.getUser();
  const user = userResult.data.user;
  if (!user) {
    throw new Error("Сессия не найдена.");
  }

  const profileResult = await client
    .from("profiles")
    .select("id,email,name,username,bio,avatar,avatar_url,online,status,phone,location,joined_at,role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = assertNoError(profileResult, "Не удалось загрузить профиль.");

  if (!profile) {
    throw new Error("Профиль не найден. Выполни SQL-скрипт и войди заново.");
  }

  return mapProfile(profile as ProfileRow);
}

export async function fetchUsers(client: SupabaseClient, currentUserId: string): Promise<UserProfile[]> {
  const result = await client
    .from("profiles")
    .select("id,email,name,username,bio,avatar,avatar_url,online,status,phone,location,joined_at,role")
    .neq("id", currentUserId)
    .order("username", { ascending: true });

  const rows = assertNoError(result, "Не удалось загрузить список пользователей.");
  return (rows as ProfileRow[]).map(mapProfile);
}

export async function fetchChats(client: SupabaseClient, currentUserId: string): Promise<Chat[]> {
  const participantResult = await client
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .eq("user_id", currentUserId);

  const myParticipants = assertNoError(participantResult, "Не удалось загрузить чаты.") as ConversationParticipantRow[];
  const conversationIds = myParticipants.map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return [];
  }

  const conversationsResult = await client
    .from("conversations")
    .select("id,updated_at,last_message_preview")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  const participantsResult = await client
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .in("conversation_id", conversationIds);

  const conversations = assertNoError(conversationsResult, "Не удалось загрузить чаты.") as ConversationRow[];
  const allParticipants = assertNoError(participantsResult, "Не удалось загрузить участников.") as ConversationParticipantRow[];

  const otherUserIds = Array.from(
    new Set(
      allParticipants
        .filter((row) => row.user_id !== currentUserId)
        .map((row) => row.user_id),
    ),
  );

  const profilesMap = new Map<string, UserProfile>();

  if (otherUserIds.length > 0) {
    const profilesResult = await client
      .from("profiles")
      .select("id,email,name,username,bio,avatar,avatar_url,online,status,phone,location,joined_at,role")
      .in("id", otherUserIds);

    const profileRows = assertNoError(profilesResult, "Не удалось загрузить профили.") as ProfileRow[];
    for (const profile of profileRows) {
      profilesMap.set(profile.id, mapProfile(profile));
    }
  }

  return conversations.map((conversation) => {
    const peerParticipant = allParticipants.find(
      (participant) =>
        participant.conversation_id === conversation.id && participant.user_id !== currentUserId,
    );
    const peerProfile = peerParticipant ? profilesMap.get(peerParticipant.user_id) : null;

    return {
      id: conversation.id,
      title: peerProfile?.name || "Новый чат",
      avatar: peerProfile?.avatar || "CH",
      preview: conversation.last_message_preview?.trim() || "Сообщений пока нет",
      updatedAt: conversation.updated_at,
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

  const messageRows = assertNoError(messagesResult, "Не удалось загрузить сообщения.") as MessageRow[];

  if (messageRows.length === 0) {
    return [];
  }

  const reactionsResult = await client
    .from("message_reactions")
    .select("message_id,user_id,type")
    .in("message_id", messageRows.map((row) => row.id));

  const reactionRows = assertNoError(reactionsResult, "Не удалось загрузить реакции.") as ReactionRow[];
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

  const myRows = assertNoError(mineResult, "Не удалось найти чаты.") as ConversationParticipantRow[];
  const conversationIds = myRows.map((row) => row.conversation_id);

  if (conversationIds.length > 0) {
    const participantsResult = await client
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", conversationIds);

    const participants = assertNoError(participantsResult, "Не удалось проверить участников.") as ConversationParticipantRow[];

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

  const conversationInsert = await client
    .from("conversations")
    .insert({
      last_message_preview: null,
    })
    .select("id")
    .single();

  const conversation = assertNoError(conversationInsert, "Не удалось создать чат.") as { id: string };

  const participantInsert = await client
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: currentUserId },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);

  assertNoError(participantInsert, "Не удалось добавить участников.");
  return conversation.id;
}

export async function sendMessageToConversation(client: SupabaseClient, input: {
  conversationId: string;
  senderId: string;
  text: string;
  replyTo?: string;
  voice?: number;
}): Promise<void> {
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

  assertNoError(messageInsert, "Не удалось отправить сообщение.");

  const conversationUpdate = await client
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq("id", input.conversationId);

  assertNoError(conversationUpdate, "Не удалось обновить чат.");
}

export async function toggleMessageReaction(client: SupabaseClient, input: {
  messageId: string;
  userId: string;
  type: Reaction["type"];
}): Promise<void> {
  const existingResult = await client
    .from("message_reactions")
    .select("message_id,user_id,type")
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .eq("type", input.type)
    .maybeSingle();

  const existing = assertNoError(existingResult, "Не удалось проверить реакцию.");

  if (existing) {
    const removeResult = await client
      .from("message_reactions")
      .delete()
      .eq("message_id", input.messageId)
      .eq("user_id", input.userId)
      .eq("type", input.type);

    assertNoError(removeResult, "Не удалось убрать реакцию.");
    return;
  }

  const removeOtherTypes = await client
    .from("message_reactions")
    .delete()
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId);

  assertNoError(removeOtherTypes, "Не удалось обновить реакцию.");

  const insertResult = await client
    .from("message_reactions")
    .insert({
      message_id: input.messageId,
      user_id: input.userId,
      type: input.type,
    });

  assertNoError(insertResult, "Не удалось сохранить реакцию.");
}

export function subscribeToConversation(
  client: SupabaseClient,
  conversationId: string,
  callback: () => void,
): () => void {
  const channel = client
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      () => callback(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "message_reactions" },
      () => callback(),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
