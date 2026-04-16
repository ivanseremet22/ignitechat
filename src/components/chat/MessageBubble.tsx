import React, { memo, useMemo } from "react";
import { Check, CheckCheck, Clock, AlertCircle, Flame, Heart, MessageCircle, Pause, Play, ThumbsUp, Pencil, Trash2, Copy, Reply, Forward } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Message, Reaction } from "../../chat-types";

type MessageBubbleProps = {
  message: Message;
  previousMessage?: Message;
  nextMessage?: Message;
  currentUserId: string;
  hoveredMsg: string | null;
  setHoveredMsg: (id: string | null) => void;
  onReply: (id: string) => void;
  onReaction: (id: string, type: Reaction["type"]) => void;
  onEdit?: (messageId: string, text: string) => void;
  onDelete?: (messageId: string) => void;
  replyTarget: Message | null;
  onToggleVoicePlay: (id: string) => void;
  playingVoiceId: string | null;
  isTouch: boolean;
};

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function buildWave(seed: number, bars = 22) {
  return Array.from({ length: bars }, (_, index) => 6 + ((index * 17 + seed * 13) % 22));
}

function reactionEmoji(type: Reaction["type"]) {
  if (type === "like") return "👍";
  if (type === "love") return "❤️";
  return "🔥";
}

function MessageBubble({
  message,
  previousMessage,
  nextMessage,
  currentUserId,
  hoveredMsg,
  setHoveredMsg,
  onReply,
  onReaction,
  onEdit,
  onDelete,
  replyTarget,
  onToggleVoicePlay,
  playingVoiceId,
  isTouch,
}: MessageBubbleProps) {
  const mine = message.senderId === currentUserId;
  const isMenuOpen = hoveredMsg === message.id;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message.text);
    setHoveredMsg(null);
  };

  const groupedWithPrev =
    !!previousMessage &&
    previousMessage.senderId === message.senderId &&
    sameDay(previousMessage.createdAt, message.createdAt);

  const groupedWithNext =
    !!nextMessage &&
    nextMessage.senderId === message.senderId &&
    sameDay(nextMessage.createdAt, message.createdAt);

  const isPlaying = playingVoiceId === message.id;
  const wave = useMemo(() => buildWave(Number(message.id.replace(/\D/g, "")) || 1), [message.id]);

  const timeLabel = useMemo(
    () =>
      new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.createdAt],
  );

  const radiusClass = mine
    ? `${groupedWithPrev ? "rounded-tr-xl" : "rounded-tr-[22px]"} ${
        groupedWithNext ? "rounded-br-xl" : "rounded-br-[22px]"
      } rounded-tl-[22px] rounded-bl-[22px]`
    : `${groupedWithPrev ? "rounded-tl-xl" : "rounded-tl-[22px]"} ${
        groupedWithNext ? "rounded-bl-xl" : "rounded-bl-[22px]"
      } rounded-tr-[22px] rounded-br-[22px]`;

  const showActions = hoveredMsg === message.id;

  const StatusIcon = () => {
    if (!mine) return null;
    if (message.status === "error") return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    if (message.status === "sending") return <Clock className="h-3.5 w-3.5 text-slate-400 animate-pulse" />;
    if (message.status === "seen" || message.seen) return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    return <Check className="h-3.5 w-3.5 text-slate-400" />;
  };

  return (
    <div
      className={`${mine ? "flex justify-end" : "flex justify-start"} ${groupedWithPrev ? "mt-1" : "mt-4"} group relative ${message.reactions.length > 0 ? "mb-3" : ""}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setHoveredMsg(message.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setHoveredMsg(isMenuOpen ? null : message.id);
      }}
    >
      <div
        className={`message-bubble relative max-w-[min(98%,1120px)] px-3.5 py-3 transition-transform duration-200 ${
          isMenuOpen ? (mine ? "-translate-x-2" : "translate-x-2") : ""
        } ${radiusClass} ${
          mine
            ? "border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,244,223,0.98),rgba(255,239,205,0.94))] text-slate-900 shadow-[0_4px_10px_rgba(245,158,11,0.04)]"
            : "border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] text-slate-800 shadow-[0_4px_10px_rgba(15,23,42,0.025)]"
        }`}
      >
        {replyTarget && (
          <div
            className={
              "mb-2 rounded-xl border-l-2 px-3 py-2 text-xs " +
              (mine
                ? "border-amber-800/25 bg-white/35 text-slate-700"
                : "border-amber-300 bg-amber-50 text-slate-600")
            }
          >
            <div className="font-medium">Ответ</div>
            <div className="truncate">
              {replyTarget.voice ? `Голосовое · ${replyTarget.voice}s` : replyTarget.text}
            </div>
          </div>
        )}

        {message.voice ? (
          <div className="flex min-w-[200px] items-center gap-3 overflow-hidden">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleVoicePlay(message.id);
              }}
              className={
                mine
                  ? "rounded-full bg-white/80 p-2 transition hover:bg-white"
                  : "rounded-full bg-slate-100 p-2 transition hover:bg-slate-200"
              }
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <div className="flex flex-1 items-end gap-1">
              {wave.map((height, index) => (
                <div
                  key={`${message.id}-bar-${index}`}
                  className={mine ? "voice-bar voice-bar-mine" : "voice-bar voice-bar-peer"}
                  style={{
                    height,
                    animationDelay: `${index * 0.03}s`,
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                />
              ))}
            </div>

            <span className="text-xs">{message.voice}s</span>
          </div>
        ) : (
          <div className="text-[15px] leading-6">{message.text}</div>
        )}

        <div className={"mt-1 flex justify-between gap-4 text-[11px] " + (mine ? "text-slate-500" : "text-slate-400")}>
          <div className="flex flex-wrap items-center gap-2">
            <span>{timeLabel}</span>
            {message.updatedAt && <span className="opacity-70">(изм.)</span>}
            <StatusIcon />
          </div>
        </div>

        {message.reactions.length > 0 && (
          <div className={`absolute -bottom-2.5 ${mine ? "right-2" : "left-2"} z-10 flex flex-wrap items-center gap-1`}>
            {message.reactions.map((reaction) => (
              <div
                key={`${message.id}-${reaction.userId}-${reaction.type}`}
                className="rounded-full bg-white px-1.5 py-0.5 text-[13px] shadow-sm ring-1 ring-black/5 flex items-center justify-center min-w-[24px] h-[24px]"
              >
                {reactionEmoji(reaction.type)}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={`absolute bottom-full z-[60] mb-2 flex flex-col gap-1 rounded-2xl border border-white/40 bg-white/80 p-1.5 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl ${
                mine ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5 mb-1 px-1">
                {["like", "love", "fire"].map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReaction(message.id, type as any);
                      setHoveredMsg(null);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-amber-100/50 hover:scale-110 active:scale-95"
                  >
                    <span className="text-lg">{reactionEmoji(type as any)}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-0.5">
                <MenuAction
                  icon={<Reply size={16} />}
                  label="Ответить"
                  onClick={(e: any) => { e.stopPropagation(); onReply(message.id); setHoveredMsg(null); }}
                />
                <MenuAction
                  icon={<Copy size={16} />}
                  label="Копировать"
                  onClick={handleCopy}
                />
                {mine && (
                  <MenuAction
                    icon={<Pencil size={16} />}
                    label="Изменить"
                    onClick={(e: any) => { e.stopPropagation(); onEdit?.(message.id, message.text); setHoveredMsg(null); }}
                  />
                )}
                {mine && (
                  <MenuAction
                    icon={<Trash2 size={16} className="text-red-500" />}
                    label="Удалить"
                    danger
                    onClick={(e: any) => { e.stopPropagation(); onDelete?.(message.id); setHoveredMsg(null); }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuAction({ icon, label, onClick, danger }: { icon: any, label: string, onClick: any, danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-8 rounded-xl px-3 py-2 text-sm transition ${
        danger ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100/80"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="opacity-60">{icon}</span>
    </button>
  );
}

export default memo(MessageBubble);
