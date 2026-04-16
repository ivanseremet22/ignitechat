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
                ? "relative z-30 h-full w-[360px] shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-3xl"
                : "absolute inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[40px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-3xl"
            }
          >
            <div className="flex h-full flex-col">
              <div className="relative overflow-hidden px-6 pb-6 pt-8">
                <div className={`absolute inset-x-0 top-0 h-48 bg-gradient-to-br ${accent} opacity-10 blur-3xl`} />
                
                <div className="relative flex items-center justify-between">
                  <div>
                    {!isDesktop && <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10" />}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      Group Info
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
                  <div className="relative group mb-6">
                    <AppAvatar
                      className="h-32 w-32 rounded-[40px] border-2 border-white/10 shadow-2xl"
                      fallbackClassName="text-4xl font-bold text-white"
                      initials={chat.avatar}
                      imageUrl={chat.avatarUrl}
                      accent={accent}
                    />
                    {onTriggerAvatarPicker && (
                      <button 
                        onClick={onTriggerAvatarPicker}
                        className="absolute inset-0 flex items-center justify-center rounded-[40px] bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200"
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-3xl font-bold tracking-tight text-white">
                      {chat.title}
                    </h2>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-white/40 font-medium">
                      <Users className="h-4 w-4" />
                      <span>{members.length} members</span>
                    </div>
                  </div>
                </div>

                <div className="relative mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-3xl glass-panel px-3 py-4 text-center">
                    <div className="text-lg font-bold text-white">{members.length}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Total</div>
                  </div>
                  <div className="rounded-3xl glass-panel px-3 py-4 text-center">
                    <div className="text-lg font-bold text-white">1</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Active</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 py-6">
                <div className="space-y-6">
                  <div className="rounded-[32px] glass-panel p-6 shadow-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-6">Members</div>
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4 group">
                          <AppAvatar
                            className="h-10 w-10 shrink-0 rounded-xl"
                            initials={member.avatar}
                            imageUrl={member.avatarUrl}
                            accent={member.accent}
                            fallbackClassName="text-sm font-bold text-white"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">{member.name}</div>
                            <div className="truncate text-[10px] font-medium text-white/30 uppercase tracking-wider">@{member.username}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full glass-panel text-white/40 opacity-0 group-hover:opacity-100 transition-all">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl glass-panel py-3 text-xs font-bold uppercase tracking-widest text-[#7C3AED] transition hover:bg-[#7C3AED]/10">
                      <UserPlus className="h-4 w-4" />
                      Add Members
                    </button>
                  </div>

                  <div className="rounded-[32px] glass-panel p-6 shadow-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-4">Settings</div>
                    <div className="flex items-center gap-4 text-xs font-medium text-white/60">
                      <CalendarDays className="h-4 w-4 text-white/20" />
                      <span>Created today</span>
                    </div>
                  </div>

                  <div className="rounded-[32px] glass-panel p-2 shadow-2xl mb-12">
                    <button className="flex w-full items-center justify-center rounded-2xl py-4 text-xs font-bold uppercase tracking-widest text-red-400 transition hover:bg-red-500/10">
                      Leave Group
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
