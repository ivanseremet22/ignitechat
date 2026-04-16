import React from "react";
import { motion } from "framer-motion";
import { Database, Flame, MessageSquarePlus, Search, UserRound, Wifi, WifiOff, X } from "lucide-react";
import AppAvatar from "./AppAvatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Chat, UserProfile } from "../../chat-types";

type SidebarProps = {
  isDesktop: boolean;
  mobileSidebarOpen: boolean;
  onCloseMobile: () => void;
  provider: "mock" | "supabase";
  isLive: boolean;
  myProfile: UserProfile | null;
  onOpenMyProfile: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  loadingChats: boolean;
  filteredChats: Chat[];
  searchResults: UserProfile[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onStartChat: (userId: string) => void | Promise<void>;
  onCreateGroup: () => void;
  formatTime: (date: string) => string;
};

export default function Sidebar({
  isDesktop,
  mobileSidebarOpen,
  onCloseMobile,
  provider,
  isLive,
  myProfile,
  onOpenMyProfile,
  search,
  onSearchChange,
  loadingChats,
  filteredChats,
  searchResults,
  activeChatId,
  onSelectChat,
  onStartChat,
  onCreateGroup,
  formatTime,
}: SidebarProps) {
  const hasSearch = search.trim().length > 0;
  const newChatSuggestions = hasSearch
    ? searchResults.filter((profile) => profile.status !== "Чат уже есть")
    : [];

  const hasVisibleContent = filteredChats.length > 0 || newChatSuggestions.length > 0;

  return (
    <motion.aside
      initial={isDesktop ? { x: 0 } : { x: "-100%" }}
      animate={{ x: 0 }}
      className={`fixed inset-y-0 left-0 z-40 flex w-full flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl md:relative md:z-0 md:w-[320px] lg:w-[360px] ${
        !isDesktop && !mobileSidebarOpen ? "pointer-events-none" : ""
      }`}
    >
      <div className="relative px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white">Adverse</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Premium</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full glass-surface text-white/60 hover:text-white"
            onClick={onCreateGroup}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative group mb-8">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 group-focus-within:text-[#7C3AED] transition-colors" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search messages..."
            className="h-12 rounded-2xl border-white/5 bg-white/5 pl-12 text-sm text-white placeholder:text-white/20 focus-visible:border-[#7C3AED]/50 focus-visible:ring-0 transition-all"
          />
        </div>

        {myProfile && (
          <button
            type="button"
            onClick={onOpenMyProfile}
            className="glass-surface flex w-full items-center gap-3 rounded-[24px] p-3 text-left transition hover:bg-white/10 group"
          >
            <AppAvatar
              className="h-12 w-12 shrink-0 rounded-2xl border border-white/10"
              initials={myProfile.avatar}
              imageUrl={myProfile.avatarUrl}
              accent={myProfile.accent}
              fallbackClassName="text-white"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">{myProfile.name}</div>
              <div className="truncate text-[10px] font-medium text-white/30 uppercase tracking-wider">@{myProfile.username}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 group-hover:text-white transition-colors">
              <UserRound className="h-4 w-4" />
            </div>
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        <div className="mb-6 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
          <span>{hasSearch ? "Results" : "Recent"}</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="space-y-4">
          {loadingChats ? (
            <div className="glass-surface rounded-3xl px-6 py-12 text-center text-xs font-medium text-white/20">
              Loading...
            </div>
          ) : !hasVisibleContent ? (
            <div className="glass-surface rounded-3xl px-6 py-12 text-center text-xs font-medium text-white/20">
              {hasSearch ? "No results" : "Start a conversation"}
            </div>
          ) : (
            <>
              {filteredChats.map((chat) => {
                const active = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={
                      "group relative flex w-full items-center gap-4 rounded-[28px] p-4 text-left transition-all duration-300 " +
                      (active
                        ? "glass-surface bg-white/10 scale-[1.02] shadow-xl"
                        : "hover:bg-white/5")
                    }
                  >
                    {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#7C3AED] rounded-r-full" />
                    )}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-base shadow-lg ${active ? 'bg-[#7C3AED] text-white' : 'glass-surface text-white/60'}`}>
                      {chat.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className={`truncate text-sm font-bold ${active ? 'text-white' : 'text-white/80'}`}>{chat.title}</div>
                        <div className="shrink-0 text-[10px] font-medium text-white/20">{formatTime(chat.updatedAt)}</div>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 truncate text-xs text-white/40">{chat.preview}</div>
                        {!!chat.unread && chat.unread > 0 && (
                          <div className="shrink-0 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white">
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
