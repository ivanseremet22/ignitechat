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
  formatTime,
}: SidebarProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <motion.aside
      initial={false}
      animate={isDesktop || mobileSidebarOpen ? { x: 0 } : { x: -360 }}
      transition={isDesktop ? { duration: 0.16 } : { type: "tween", ease: "easeOut", duration: 0.18 }}
      className="absolute left-0 top-0 z-40 flex h-full w-[84vw] max-w-[320px] flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98)_18%,rgba(244,247,251,0.99))] shadow-[8px_0_22px_rgba(15,23,42,0.06)] md:static md:z-0 md:flex md:w-[320px] md:max-w-none md:translate-x-0 md:shadow-none xl:w-[336px]"
    >
      <div className="relative px-4 py-4">
        <div className="pointer-events-none absolute inset-x-3 top-2 h-28 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_58%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_46%)]" />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 text-slate-900 shadow-[0_12px_24px_rgba(245,158,11,0.12)]">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-slate-900">IgniteChat</div>
              <div className="text-xs text-slate-500">Реальные пользователи и реальные чаты</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={onCloseMobile}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,240,0.84))] px-3 py-2 text-xs text-slate-600 mobile-lite-shadow shadow-[0_8px_16px_rgba(15,23,42,0.03)]">
          <Database className="h-4 w-4 text-orange-500" />
          <span>{provider === "supabase" ? "Supabase datasource" : "Mock datasource"}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            {isLive ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-slate-400" />
            )}
            {isLive ? "Realtime on" : "Local mode"}
          </span>
        </div>

        {myProfile && (
          <button
            type="button"
            onClick={onOpenMyProfile}
            className="mb-4 flex w-full items-center gap-3 rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,240,0.84))] px-3.5 py-3 text-left mobile-lite-shadow shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:bg-white"
          >
            <AppAvatar
              className="h-12 w-12 shrink-0"
              initials={myProfile.avatar}
              imageUrl={myProfile.avatarUrl}
              accent={myProfile.accent}
              fallbackClassName="text-slate-900"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-[15px] font-semibold text-slate-900">{myProfile.name}</div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-700 shadow-sm">
                  you
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">@{myProfile.username}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm">
              <UserRound className="h-4 w-4" />
            </div>
          </button>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск чатов или @username"
            className="h-12 rounded-full border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] pl-11 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:border-orange-300 focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 py-3 pr-4">
        <div className="pointer-events-none absolute inset-x-3 top-0 h-10 rounded-t-[24px] bg-gradient-to-b from-slate-100/55 to-transparent" />

        {hasSearch && searchResults.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Люди
            </div>
            <div className="space-y-1">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => void onStartChat(profile.id)}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-slate-200/70 bg-white/90 px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  <AppAvatar
                    className="h-11 w-11 shrink-0"
                    initials={profile.avatar}
                    imageUrl={profile.avatarUrl}
                    accent={profile.accent}
                    fallbackClassName="text-slate-900"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{profile.name}</div>
                    <div className="truncate text-xs text-slate-500">@{profile.username}</div>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <MessageSquarePlus className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {loadingChats ? (
            <div className="rounded-2xl bg-white px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/80">
              Загрузка чатов...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/80">
              {hasSearch
                ? "Чатов по запросу нет. Найди человека выше и начни диалог."
                : "Чатов пока нет. Найди пользователя по username и создай первый диалог."}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const active = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-3 py-2.5 text-left box-border transition duration-200 hover:bg-slate-100/85 " +
                    (active
                      ? "bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(255,251,235,0.92))] ring-1 ring-amber-200/70 shadow-[0_10px_24px_rgba(251,146,60,0.10)]"
                      : "bg-transparent")
                  }
                >
                  {active && <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />}
                  <div className="z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-300 text-sm font-semibold text-slate-900">
                    {chat.avatar}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-[15px] font-medium">{chat.title}</div>
                      <div className="shrink-0 text-[11px] text-slate-400">{formatTime(chat.updatedAt)}</div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 truncate text-[13px] text-slate-500">{chat.preview}</div>
                      {!!chat.unread && chat.unread > 0 && (
                        <div className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-300 px-2 py-[2px] text-[10px] font-semibold text-slate-900 shadow">
                          {chat.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </motion.aside>
  );
}
