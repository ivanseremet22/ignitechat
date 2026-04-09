
import { motion } from "framer-motion";
import { Database, Flame, Search, UserRound, Wifi, WifiOff, X } from "lucide-react";
import { Chat, UserProfile } from "../../chat-types";
import AppAvatar from "./AppAvatar";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type ChatSidebarProps = {
  isDesktop: boolean;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (value: boolean) => void;
  provider: "mock" | "supabase";
  isLive: boolean;
  myProfile: UserProfile | null;
  openMyProfile: () => void;
  search: string;
  setSearch: (value: string) => void;
  loadingChats: boolean;
  filteredChats: Chat[];
  activeChatId: string;
  selectChat: (chatId: string) => void;
  formatTime: (value: string) => string;
  qaScenarios: string[];
};

export default function ChatSidebar({
  isDesktop,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  provider,
  isLive,
  myProfile,
  openMyProfile,
  search,
  setSearch,
  loadingChats,
  filteredChats,
  activeChatId,
  selectChat,
  formatTime,
  qaScenarios,
}: ChatSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={isDesktop || mobileSidebarOpen ? { x: 0 } : { x: -360 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute left-0 top-0 z-40 flex h-full w-[90vw] max-w-[352px] flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96)_18%,rgba(244,247,251,0.98))] shadow-[12px_0_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:static md:z-0 md:flex md:w-[336px] md:max-w-none md:translate-x-0 md:shadow-none xl:w-[344px]"
    >
      <div className="relative px-4 py-4">
        <div className="pointer-events-none absolute inset-x-3 top-2 h-28 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_58%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_46%)]" />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 text-slate-900 shadow-[0_16px_30px_rgba(245,158,11,0.18)]">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-slate-900">IgniteChat</div>
              <div className="text-xs text-slate-500">Supabase-ready MVP shell</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,240,0.84))] px-3 py-2 text-xs text-slate-600 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
          <Database className="h-4 w-4 text-orange-500" />
          <span>{provider === "supabase" ? "Supabase datasource" : "Mock datasource"}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            {isLive ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-slate-400" />}
            {isLive ? "Realtime on" : "Local mode"}
          </span>
        </div>

        {myProfile && (
          <button
            type="button"
            onClick={openMyProfile}
            className="mb-4 flex w-full items-center gap-3 rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,240,0.84))] px-3.5 py-3 text-left shadow-[0_14px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-white"
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск"
            className="h-12 rounded-full border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] pl-11 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:border-orange-300 focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 py-3 pr-4">
        <div className="pointer-events-none absolute inset-x-3 top-0 h-10 rounded-t-[24px] bg-gradient-to-b from-slate-100/55 to-transparent" />
        <div className="space-y-1">
          {loadingChats ? (
            <div className="rounded-2xl bg-white px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/80">
              Загрузка чатов...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/80">
              Ничего не найдено.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const active = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-3 py-2.5 text-left box-border transition duration-200 hover:bg-slate-100/85 " +
                    (active
                      ? "bg-[linear-gradient(135deg,rgba(255,247,237,0.98),rgba(255,251,235,0.92))] ring-1 ring-amber-200/70 shadow-[0_10px_24px_rgba(251,146,60,0.10)]"
                      : "bg-transparent")
                  }
                >
                  {active && <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />}
                  <Avatar className="z-[1] h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-300 text-slate-900">
                      {chat.avatar}
                    </AvatarFallback>
                  </Avatar>
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

        <div className="mt-5 rounded-[18px] bg-[linear-gradient(180deg,rgba(247,249,252,0.94),rgba(255,248,240,0.78))] p-3 ring-1 ring-slate-200/80">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Следующий слой</div>
          <div className="space-y-2">
            {qaScenarios.map((scenario) => (
              <div key={scenario} className="rounded-2xl bg-white/75 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200/60">
                {scenario}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
