import React from "react";
import { motion } from "framer-motion";
import {
  Menu,
  MoreVertical,
  Phone,
  Search,
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import AppAvatar from "./AppAvatar";
import MessageBubble from "./MessageBubble";
import type { Message, User, UserProfile, Reaction, Chat } from "../../chat-types";

type ChatViewProps = {
  activeChat: Chat;
  activeProfile: UserProfile | null;
  activePeer: User | null;
  myProfile: UserProfile | null;
  showTyping: boolean;
  error: string | null;
  loadingMessages: boolean;
  activeMessages: Message[];
  currentUserId: string;
  hoveredMsg: string | null;
  setHoveredMsg: (value: string | null) => void;
  setReplyTo: (messageId: string | null) => void;
  addReaction: (messageId: string, type: Reaction["type"]) => void;
  findMessageById: (messages: Message[], id?: string) => Message | null;
  toggleVoicePlay: (messageId: string) => void;
  playingVoiceId: string | null;
  isTouch: boolean;
  formatDayLabel: (value: string) => string;
  sameDay: (left: string, right: string) => boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
  replyPreview: Message | null;
  pendingVoiceSeconds: number | null;
  setPendingVoiceSeconds: (value: number | null) => void;
  draft: string;
  setDraft: (value: string) => void;
  handleSend: () => Promise<void> | void;
  sending: boolean;
  sendPulse: boolean;
  recording: boolean;
  startRecord: () => void;
  stopRecord: () => void;
  openMyProfile: () => void;
  openPeerProfile: () => void;
  setMobileSidebarOpen: (value: boolean) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
};

export default function ChatView({
  activeChat,
  activeProfile,
  activePeer,
  myProfile,
  showTyping,
  error,
  loadingMessages,
  activeMessages,
  currentUserId,
  hoveredMsg,
  setHoveredMsg,
  setReplyTo,
  addReaction,
  findMessageById,
  toggleVoicePlay,
  playingVoiceId,
  isTouch,
  formatDayLabel,
  sameDay,
  bottomRef,
  replyPreview,
  pendingVoiceSeconds,
  setPendingVoiceSeconds,
  draft,
  setDraft,
  handleSend,
  sending,
  sendPulse,
  recording,
  startRecord,
  stopRecord,
  openMyProfile,
  openPeerProfile,
  setMobileSidebarOpen,
  onEditMessage,
  onDeleteMessage,
  editingMessageId,
  setEditingMessageId,
}: ChatViewProps) {
  const messageById = React.useMemo(
    () => new Map(activeMessages.map((message) => [message.id, message])),
    [activeMessages],
  );

  return (
    <>
      <header
        className="chat-header-shell relative z-20 px-6 py-6"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="glass-panel-heavy flex items-center gap-4 rounded-[32px] px-4 py-3 shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full glass-panel text-white/60 hover:text-white md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            type="button"
            onClick={openPeerProfile}
            className="group flex min-w-0 items-center gap-3 rounded-2xl p-1 transition hover:bg-white/5"
          >
            <div className="relative">
                <Avatar className="h-10 w-10 rounded-xl border border-white/10 shadow-lg">
                  <AvatarFallback className="bg-[#7C3AED] text-white font-bold">
                    {activeChat.avatar}
                  </AvatarFallback>
                </Avatar>
                {activePeer?.status === "в сети" && (
                    <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-black bg-emerald-500" />
                )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-bold text-white">{activeChat.title}</div>
              <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
                {showTyping ? (
                  <span className="text-[#7C3AED] animate-pulse">typing…</span>
                ) : (
                  <span className="truncate">{activePeer?.status || "в сети"}</span>
                )}
              </div>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full glass-panel text-white/40 hover:text-white"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 shadow-lg"
              onClick={openMyProfile}
            >
              <UserRound className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 backdrop-blur-xl">
          {error}
        </div>
      )}

      <ScrollArea className="chat-scroll relative z-10 flex-1 px-4 py-6 md:px-8">
        <div className="w-full space-y-6">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <div className="rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 backdrop-blur-xl shadow-2xl">
                Loading encrypted messages...
              </div>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-white/5 border border-white/10 text-white/20">
                <Send className="h-8 w-8" />
              </div>
              <div className="max-w-[240px] text-xs font-bold uppercase tracking-widest text-white/20">
                No messages yet. Start the conversation.
              </div>
            </div>
          ) : (
            activeMessages.map((message, index) => {
              const previousMessage = activeMessages[index - 1];
              const nextMessage = activeMessages[index + 1];
              const showDayDivider =
                !previousMessage || !sameDay(previousMessage.createdAt, message.createdAt);

              return (
                <React.Fragment key={message.id}>
                  {showDayDivider && (
                    <div className="my-8 flex justify-center">
                      <div className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 backdrop-blur-md">
                        {formatDayLabel(message.createdAt)}
                      </div>
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    previousMessage={previousMessage}
                    nextMessage={nextMessage}
                    currentUserId={currentUserId}
                    hoveredMsg={hoveredMsg}
                    setHoveredMsg={setHoveredMsg}
                    onReply={setReplyTo}
                    onReaction={addReaction}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    replyTarget={message.replyTo ? messageById.get(message.replyTo) ?? null : null}
                    onToggleVoicePlay={toggleVoicePlay}
                    playingVoiceId={playingVoiceId}
                    isTouch={isTouch}
                  />
                </React.Fragment>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <footer
        className="composer-shell relative z-20 px-6 py-8"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-4xl">
          {(replyPreview || pendingVoiceSeconds !== null || editingMessageId) && (
            <div className="glass-panel-heavy mb-4 rounded-3xl border border-white/10 px-6 py-4 shadow-2xl">
              {editingMessageId && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-10 w-1 rounded-full bg-[#7C3AED]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Editing</div>
                    <div className="mt-1 truncate text-sm text-white/80">
                      {findMessageById(activeMessages, editingMessageId)?.text || "Message"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessageId(null);
                      setDraft("");
                    }}
                    className="rounded-full p-2 text-white/20 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {replyPreview && !editingMessageId && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-10 w-1 rounded-full bg-white/40" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Reply to</div>
                    <div className="mt-1 truncate text-sm font-medium text-white/80">
                      {replyPreview.voice
                        ? `Voice • ${replyPreview.voice}s`
                        : replyPreview.text || "Media"}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="rounded-full p-2 text-white/20 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {pendingVoiceSeconds !== null && (
                <div className={replyPreview ? "mt-4 pt-4 border-t border-white/5" : ""}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-lg">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Voice message</div>
                      <div className="mt-1 text-sm font-bold text-white">{pendingVoiceSeconds}s</div>
                    </div>
                    <button
                      onClick={() => setPendingVoiceSeconds(null)}
                      className="rounded-full p-2 text-white/20 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <motion.div
            animate={sendPulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-panel-heavy flex items-end gap-2 rounded-[32px] p-2 shadow-2xl md:gap-3"
          >
            <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-full glass-panel text-white/40 hover:text-white transition-colors">
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="relative min-w-0 flex-1 py-1">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Message..."
                rows={1}
                className="max-h-40 min-h-[44px] resize-none rounded-2xl border-transparent bg-transparent px-2 py-2.5 text-base font-medium text-white placeholder:text-white/20 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              {draft.trim() || pendingVoiceSeconds !== null ? (
                <motion.div
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Button
                    onClick={() => void handleSend()}
                    disabled={sending}
                    className="h-12 w-12 shrink-0 rounded-full bg-white text-black p-0 shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.88, opacity: 0 }}
                >
                  <Button
                    onClick={recording ? stopRecord : startRecord}
                    className={`h-12 w-12 shrink-0 rounded-full p-0 shadow-lg transition-all duration-300 ${
                      recording
                        ? "bg-red-500 text-white animate-pulse"
                        : "glass-panel text-white/40 hover:text-white"
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </footer>
    </>
  );
}
