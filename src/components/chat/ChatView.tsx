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
}: ChatViewProps) {
  const messageById = React.useMemo(
    () => new Map(activeMessages.map((message) => [message.id, message])),
    [activeMessages],
  );

  return (
    <>
      <header
        className="chat-header-shell mobile-no-blur relative z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,249,240,0.92))] px-3 py-3 md:px-5 lg:px-6"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            type="button"
            onClick={openPeerProfile}
            className="group flex min-w-0 items-center gap-3 rounded-2xl transition hover:bg-white/70 hover:px-1.5 hover:py-1"
          >
            <Avatar className="h-11 w-11">
              <AvatarFallback className={`bg-gradient-to-br ${activeProfile?.accent || "from-amber-400 to-orange-300"} text-slate-900`}>
                {activeChat.avatar}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[15px] font-medium">{activeChat.title}</div>
              <div className="flex items-center gap-2 text-xs text-amber-600">
                {showTyping ? (
                  <span className="inline-flex items-center gap-2 text-amber-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    отправка / bot loop…
                  </span>
                ) : (
                  <span>{activePeer?.status || "в сети"}</span>
                )}
              </div>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={openMyProfile}
              className="overflow-hidden rounded-full border border-slate-200/80 bg-white/90 p-0 shadow-sm hover:bg-white"
            >
              {myProfile ? (
                <AppAvatar
                  className="h-10 w-10"
                  initials={myProfile.avatar}
                  imageUrl={myProfile.avatarUrl}
                  accent={myProfile.accent}
                  fallbackClassName="text-slate-900"
                />
              ) : (
                <UserRound className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
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
        {(replyPreview || pendingVoiceSeconds !== null) && (
          <div className="mb-3 rounded-[26px] border border-slate-200/80 bg-white/90 px-4 py-3 mobile-lite-shadow shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            {replyPreview && (
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
          className="mobile-lite-shadow flex items-end gap-1.5 rounded-[28px] border border-white/80 bg-white/96 px-2 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
        >
          <Button variant="ghost" size="icon" className="hidden h-11 w-11 rounded-full sm:inline-flex">
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
              className="max-h-36 min-h-[44px] resize-none rounded-[20px] border-transparent bg-transparent px-2.5 py-2.5 text-[15px] leading-6 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="hidden h-11 w-11 rounded-full sm:inline-flex">
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
                  className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 via-orange-300 to-amber-200 text-slate-900 shadow-[0_10px_24px_rgba(245,158,11,0.18)] transition disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </motion.div>
            ) : (
              <Button
                onMouseDown={startRecord}
                onMouseUp={stopRecord}
                onMouseLeave={() => recording && stopRecord()}
                onTouchStart={startRecord}
                onTouchEnd={stopRecord}
                className={
                  "h-11 w-11 rounded-full transition " +
                  (recording
                    ? "bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.18)]"
                    : "bg-gradient-to-br from-amber-400 via-orange-300 to-amber-200 text-slate-900 shadow-[0_10px_24px_rgba(245,158,11,0.18)]")
                }
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </motion.div>
      </footer>
    </>
  );
}
