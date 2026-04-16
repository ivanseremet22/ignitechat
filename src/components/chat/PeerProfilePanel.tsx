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
                ? "relative z-30 h-full w-[360px] shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-3xl"
                : "absolute inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[40px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-3xl"
            }
          >
            <div className="flex h-full flex-col">
              <div className="relative overflow-hidden px-6 pb-6 pt-8">
                <div className={`absolute inset-x-0 top-0 h-48 bg-gradient-to-br ${profile.accent} opacity-10 blur-3xl`} />
                
                <div className="relative flex items-center justify-between">
                  <div>
                    {!isDesktop && <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10" />}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      {title}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full glass-panel text-white/40 hover:text-white"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative mt-8 flex flex-col items-center text-center">
                  <AppAvatar
                    className="h-32 w-32 rounded-[40px] border-2 border-white/10 shadow-2xl mb-6"
                    fallbackClassName="text-4xl font-bold text-white"
                    initials={profile.avatar}
                    imageUrl={profile.avatarUrl}
                    accent={profile.accent}
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-3xl font-bold tracking-tight text-white">
                      {profile.name}
                    </h2>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-white/40">
                      <AtSign className="h-4 w-4" />
                      <span className="font-medium">@{profile.username}</span>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 shadow-lg">
                      <span className={`h-2 w-2 rounded-full ${profile.online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
                      {profile.online ? "online" : profile.status}
                    </div>
                  </div>
                </div>

                <p className="relative mt-8 text-center text-sm font-medium leading-relaxed text-white/60">{profile.bio}</p>

                <div className="relative mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-3xl glass-panel px-3 py-4 text-center">
                    <div className="text-lg font-bold text-white">{stats.total}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Messages</div>
                  </div>
                  <div className="rounded-3xl glass-panel px-3 py-4 text-center">
                    <div className="text-lg font-bold text-white">{stats.voice}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Voices</div>
                  </div>
                  <div className="rounded-3xl glass-panel px-3 py-4 text-center">
                    <div className="text-lg font-bold text-white">{stats.reactions}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Reacts</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 py-6">
                <div className="space-y-6">
                  <div className="rounded-[32px] glass-panel p-6 shadow-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Details</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-xs font-medium text-white/60">
                        <MapPin className="h-4 w-4 text-white/20" />
                        <span>{profile.location || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-white/60">
                        <CalendarDays className="h-4 w-4 text-white/20" />
                        <span>Joined {profile.joinedAt}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-white/60">
                        <BellOff className="h-4 w-4 text-white/20" />
                        <span>{profile.phone || "—"}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full glass-panel px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] glass-panel p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Recent Activity</div>
                      <div className="text-[10px] font-bold text-white/40">{highlights.length}</div>
                    </div>

                    <div className="space-y-4">
                      {highlights.length === 0 ? (
                        <div className="rounded-2xl glass-panel px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                          No shared content
                        </div>
                      ) : (
                        highlights.map((message) => (
                          <div
                            key={message.id}
                            className="rounded-2xl glass-panel p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="text-sm font-medium text-white/80 line-clamp-2 leading-relaxed">
                              {message.voice ? `Voice message · ${message.voice}s` : message.text}
                            </div>
                            <div className="mt-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatMessageMeta(message.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[32px] glass-panel p-2 shadow-2xl mb-12">
                    <button className="flex w-full items-center justify-between rounded-2xl px-6 py-4 text-left transition hover:bg-red-500/10 group">
                      <span className="inline-flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-red-400">
                        <ShieldAlert className="h-4 w-4" />
                        Block & Report
                      </span>
                      <ChevronRight className="h-4 w-4 text-red-400 group-hover:translate-x-1 transition-transform" />
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
