import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, BellOff, CalendarDays, ChevronRight, MapPin, ShieldAlert, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import AppAvatar from "./AppAvatar";
import type { Message, UserProfile } from "../../chat-types";

type PeerProfilePanelProps = {
  profile: UserProfile;
  sharedMessages: Message[];
  isDesktop: boolean;
  open: boolean;
  onClose: () => void;
  title?: string;
  formatMessageMeta: (value: string) => string;
};

function countSharedStats(messages: Message[]) {
  return {
    total: messages.length,
    voice: messages.filter((message) => !!message.voice).length,
    reactions: messages.reduce((total, message) => total + message.reactions.length, 0),
  };
}

export default function PeerProfilePanel({
  profile,
  sharedMessages,
  isDesktop,
  open,
  onClose,
  title = "Профиль",
  formatMessageMeta,
}: PeerProfilePanelProps) {
  const stats = countSharedStats(sharedMessages);
  const highlights = sharedMessages.filter((message) => message.text || message.voice).slice(-4).reverse();

  return (
    <AnimatePresence>
      {open && (
        <>
          {!isDesktop && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-slate-900/25 backdrop-blur-sm"
              onClick={onClose}
            />
          )}

          <motion.aside
            initial={isDesktop ? { x: 32, opacity: 0 } : { y: "100%" }}
            animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { x: 32, opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className={
              isDesktop
                ? "relative z-30 h-full w-[360px] shrink-0 border-l border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,248,241,0.92))] shadow-[-16px_0_40px_rgba(15,23,42,0.06)]"
                : "absolute inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,241,0.96))] shadow-[0_-20px_50px_rgba(15,23,42,0.16)]"
            }
          >
            <div className="flex h-full flex-col">
              <div className="relative overflow-hidden border-b border-slate-200/70 px-5 pb-5 pt-4">
                <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-br ${profile.accent} opacity-90`} />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    {!isDesktop && <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300/80" />}
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                      {title}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/80 text-slate-600 shadow-sm hover:bg-white"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative mt-4 flex items-start gap-4">
                  <AppAvatar
                    className="h-24 w-24 ring-4 ring-white/90 shadow-[0_18px_38px_rgba(15,23,42,0.16)]"
                    fallbackClassName="text-2xl font-semibold text-slate-900"
                    initials={profile.avatar}
                    imageUrl={profile.avatarUrl}
                    accent={profile.accent}
                  />

                  <div className="min-w-0 flex-1 pt-2">
                    <div className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                      {profile.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <AtSign className="h-4 w-4" />
                      <span>@{profile.username}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                      <span className={`h-2 w-2 rounded-full ${profile.online ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {profile.online ? "online" : profile.status}
                    </div>
                  </div>
                </div>

                <p className="relative mt-4 text-sm leading-6 text-slate-600">{profile.bio}</p>

                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                    <div className="text-base font-semibold text-slate-900">{stats.total}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">messages</div>
                  </div>
                  <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                    <div className="text-base font-semibold text-slate-900">{stats.voice}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">voice</div>
                  </div>
                  <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                    <div className="text-base font-semibold text-slate-900">{stats.reactions}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">reactions</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-5">
                <div className="space-y-5">
                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Информация</div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>В IgniteChat с {profile.joinedAt}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <BellOff className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>{profile.phone}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Последние диалоги</div>
                      <div className="text-xs text-slate-400">{highlights.length}</div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {highlights.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          Пока нет общих сообщений.
                        </div>
                      ) : (
                        highlights.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm"
                          >
                            <div className="text-sm text-slate-700">
                              {message.voice ? `Голосовое сообщение · ${message.voice} сек` : message.text}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">{formatMessageMeta(message.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <button className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm text-red-500 transition hover:bg-red-50">
                      <span className="inline-flex items-center gap-3">
                        <ShieldAlert className="h-4 w-4" />
                        Пожаловаться или заблокировать
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
