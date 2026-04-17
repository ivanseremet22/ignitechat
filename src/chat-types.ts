export type EditableAuthProfile = {
  name: string;
  username: string;
  bio: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  statusText?: string;
  avatarDataUrl?: string;
  coverDataUrl?: string;
};

export type ProfileDraft = EditableAuthProfile;

export type User = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  status: string;
};

export type UserProfile = User & {
  username: string;
  bio: string;
  phone: string;
  location: string;
  joinedAt: string;
  role: string;
  accent: string;
  interests: string[];
  avatarUrl?: string;
  lastSeen?: string;
};

export type Reaction = {
  type: "like" | "love" | "fire";
  userId: string;
};

export type MessageStatus = "sending" | "sent" | "delivered" | "seen" | "error";

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  reactions: Reaction[];
  replyTo?: string;
  voice?: number;
  voiceUrl?: string | null;
  status?: MessageStatus;
  seen?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  avatar: string;
  preview: string;
  peerId?: string;
  peerReadAt?: string | null;
  pinned?: boolean;
  unread?: number;
  updatedAt: string;
  isGroup?: boolean;
  avatarUrl?: string;
};

export type PostComment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
};

export type Post = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: string[]; // User IDs who liked the post
  comments: PostComment[];
};
