import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, CalendarDays, Camera, MessageSquare, UserPlus, Users, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import AppAvatar from "./AppAvatar";
import type { Chat, UserProfile } from "../../chat-types";

type GroupProfilePanelProps = {
  chat: Chat;
  members: UserProfile[];
  isDesktop: boolean;
  open: boolean;
  onClose: () => void;
  onTriggerAvatarPicker?: () => void;
};

export default function GroupProfilePanel({
  chat,
  members,
  isDesktop,
  open,
  onClose,
  onTriggerAvatarPicker,
}: GroupProfilePanelProps) {
  const accent = "from-indigo-400 to-purple-400";

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
                <div className={`absolute inset-x-0 top-0 h-44 bg-gradient-to-br ${accent} opacity-90`} />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    {!isDesktop && <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300/80" />}
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                      Информация о группе
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

                <div className="relative mt-4 flex items-center gap-4">
                  <div className="relative group">
                    <AppAvatar
                      className="h-24 w-24 ring-4 ring-white/90 shadow-[0_18px_38px_rgba(15,23,42,0.16)]"
                      fallbackClassName="text-2xl font-semibold text-slate-900"
                      initials={chat.avatar}
                      imageUrl={chat.avatarUrl}
                      accent={accent}
                    />
                    {onTriggerAvatarPicker && (
                      <button 
                        onClick={onTriggerAvatarPicker}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition duration-200"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                      {chat.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Users className="h-4 w-4" />
                      <span>{members.length} участников</span>
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                    <div className="text-base font-semibold text-slate-900">{members.length}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">members</div>
                  </div>
                  <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                    <div className="text-base font-semibold text-slate-900">1</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">online</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-5">
                <div className="space-y-5">
                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-4">Участники</div>
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 group">
                          <AppAvatar
                            className="h-10 w-10 shrink-0"
                            initials={member.avatar}
                            imageUrl={member.avatarUrl}
                            accent={member.accent}
                            fallbackClassName="text-sm font-medium text-slate-900"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-slate-900">{member.name}</div>
                            <div className="truncate text-xs text-slate-500">@{member.username}</div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MessageSquare className="h-4 w-4" />
                             </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button className="mt-4 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-amber-600 transition hover:bg-amber-50">
                      <UserPlus className="h-4 w-4" />
                      Добавить участников
                    </button>
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Настройки</div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>Создана сегодня</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <button className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm text-red-500 transition hover:bg-red-50">
                      <span>Выйти из группы</span>
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
