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
        className="chat-header-shell mobile-no-blur relative z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,249,240,0.92))] px-2.5 py-2.5 md:px-5 lg:px-6"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            type="button"
            onClick={openPeerProfile}
            className="group flex min-w-0 items-center gap-2.5 rounded-2xl transition hover:bg-white/70 md:gap-3"
          >
            <Avatar className="h-10 w-10 md:h-11 md:w-11">
              <AvatarFallback className={`bg-gradient-to-br ${activeProfile?.accent || "from-amber-400 to-orange-300"} text-slate-900`}>
                {activeChat.avatar}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-semibold md:text-[15px]">{activeChat.title}</div>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-amber-600">
                {showTyping ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-amber-500 md:h-1.5 md:w-1.5" />
                    typing…
                  </span>
                ) : (
                  <span className="truncate">{activePeer?.status || "в сети"}</span>
                )}
              </div>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={openMyProfile}
              className="h-9 w-9 overflow-hidden rounded-full border border-slate-200/80 bg-white/90 p-0 shadow-sm hover:bg-white md:h-10 md:w-10"
            >
              {myProfile ? (
                <AppAvatar
                  className="h-full w-full"
                  initials={myProfile.avatar}
                  imageUrl={myProfile.avatarUrl}
                  accent={myProfile.accent}
                  fallbackClassName="text-slate-900 text-xs"
                />
              ) : (
                <UserRound className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden lg:inline-flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-3 mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-5">
          {error}
        </div>
      )}

      <ScrollArea className="chat-scroll relative z-10 flex-1 px-2.5 py-3 md:px-5 lg:px-6">
        <div className="w-full space-y-1">
          {loadingMessages ? (
            <div className="flex justify-center py-10">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                Загрузка сообщений...
              </div>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 text-sm text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                В этом чате пока нет сообщений.
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
                    <div className="my-4 flex justify-center">
                      <div className="rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
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
        className="composer-shell mobile-no-blur relative z-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.99),rgba(255,249,241,0.92)_58%,rgba(250,251,253,0.96))] px-2.5 py-3 md:px-4 lg:px-6"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {(replyPreview || pendingVoiceSeconds !== null || editingMessageId) && (
          <div className="mb-3 rounded-[26px] border border-slate-200/80 bg-white/90 px-4 py-3 mobile-lite-shadow shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            {editingMessageId && (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Редактирование</div>
                  <div className="mt-1 truncate text-sm text-slate-700">
                    {findMessageById(activeMessages, editingMessageId)?.text || "Сообщение"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingMessageId(null);
                    setDraft("");
                  }}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {replyPreview && !editingMessageId && (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Ответ на сообщение</div>
                  <div className="mt-1 truncate text-sm text-slate-700">
                    {replyPreview.voice
                      ? `Голосовое • ${replyPreview.voice} сек`
                      : replyPreview.text || "Сообщение без текста"}
                  </div>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {pendingVoiceSeconds !== null && (
              <div className={replyPreview ? "mt-3" : ""}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-300 text-slate-900">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Голосовое готово</div>
                    <div className="mt-1 text-sm text-slate-700">Длительность: {pendingVoiceSeconds} сек</div>
                  </div>
                  <button
                    onClick={() => setPendingVoiceSeconds(null)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <motion.div
          animate={sendPulse ? { scale: [1, 1.01, 1] } : { scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="mobile-lite-shadow flex items-end gap-1 rounded-[28px] border border-white/80 bg-white/96 px-1.5 py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:gap-1.5 md:px-2 md:py-2"
        >
          <Button variant="ghost" size="icon" className="hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex md:h-11 md:w-11">
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="relative min-w-0 flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Сообщение"
              rows={1}
              className="max-h-36 min-h-[40px] resize-none rounded-[20px] border-transparent bg-transparent px-2 py-2 text-[16px] leading-6 shadow-none focus-visible:ring-0 md:min-h-[44px] md:px-2.5 md:py-2.5 md:text-[15px]"
            />
          </div>

          <div className="flex items-center gap-0.5 md:gap-1">
            <Button variant="ghost" size="icon" className="hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex md:h-11 md:w-11">
              <Smile className="h-5 w-5" />
            </Button>

            {draft.trim() || pendingVoiceSeconds !== null ? (
              <motion.div
                key="send"
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
              >
                <Button
                  onClick={() => void handleSend()}
                  disabled={sending}
                  className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 p-0 text-slate-900 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 md:h-11 md:w-11"
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
                  className={`h-10 w-10 shrink-0 rounded-full p-0 shadow-lg transition-all duration-300 md:h-11 md:w-11 ${
                    recording
                      ? "bg-red-500 text-white animate-pulse shadow-red-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </footer>
    </>
  );
}
