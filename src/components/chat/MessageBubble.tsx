import React from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { CheckCheck, Flame, Heart, MessageCircle, Pause, Play, ThumbsUp } from "lucide-react";
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

export default function MessageBubble({
  message,
  previousMessage,
  nextMessage,
  currentUserId,
  hoveredMsg,
  setHoveredMsg,
  onReply,
  onReaction,
  replyTarget,
  onToggleVoicePlay,
  playingVoiceId,
  isTouch,
}: MessageBubbleProps) {
  const mine = message.senderId === currentUserId;
  const x = useMotionValue(0);
  const groupedWithPrev =
    !!previousMessage &&
    previousMessage.senderId === message.senderId &&
    sameDay(previousMessage.createdAt, message.createdAt);
  const groupedWithNext =
    !!nextMessage &&
    nextMessage.senderId === message.senderId &&
    sameDay(nextMessage.createdAt, message.createdAt);
  const isPlaying = playingVoiceId === message.id;
  const wave = buildWave(Number(message.id.replace(/\D/g, "")) || 1);

  const radiusClass = mine
    ? `${groupedWithPrev ? "rounded-tr-xl" : "rounded-tr-[22px]"} ${
        groupedWithNext ? "rounded-br-xl" : "rounded-br-[22px]"
      } rounded-tl-[22px] rounded-bl-[22px]`
    : `${groupedWithPrev ? "rounded-tl-xl" : "rounded-tl-[22px]"} ${
        groupedWithNext ? "rounded-bl-xl" : "rounded-bl-[22px]"
      } rounded-tr-[22px] rounded-br-[22px]`;

  const statusLabel = mine
    ? message.status === "sending"
      ? "Отправка..."
      : message.status === "error"
        ? "Ошибка"
        : message.status === "seen" || message.seen
          ? "Просмотрено"
          : message.status === "delivered"
            ? "Доставлено"
            : "Отправлено"
    : "";

  return (
    <div
      className={`${mine ? "flex justify-end" : "flex justify-start"} ${
        groupedWithPrev ? "mt-1" : "mt-4"
      }`}
      onMouseEnter={() => !isTouch && setHoveredMsg(message.id)}
      onMouseLeave={() => !isTouch && setHoveredMsg(null)}
      onClick={() => isTouch && setHoveredMsg(hoveredMsg === message.id ? null : message.id)}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 92 }}
        style={{ x }}
        onDragEnd={() => {
          if (x.get() > 72) onReply(message.id);
          x.set(0);
        }}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className={`relative max-w-[min(96%,1120px)] px-4 py-3 md:max-w-[min(92%,1280px)] lg:max-w-[min(86%,1480px)] ${radiusClass} ${
          mine
            ? "border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,244,223,0.98),rgba(255,239,205,0.94))] text-slate-900 shadow-[0_8px_18px_rgba(245,158,11,0.08)]"
            : "border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[inherit] bg-gradient-to-b from-white/40 to-transparent" />
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
              onClick={(e) => {
                e.stopPropagation();
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
                <motion.div
                  key={`${message.id}-bar-${index}`}
                  animate={isPlaying ? { scaleY: [1, 1.4, 0.8, 1.2, 1] } : { scaleY: 1 }}
                  transition={
                    isPlaying
                      ? { duration: 0.8, repeat: Infinity, delay: index * 0.03 }
                      : { duration: 0.2 }
                  }
                  className={
                    mine ? "w-1 rounded-full bg-amber-500/70" : "w-1 rounded-full bg-slate-400/70"
                  }
                  style={{ height, transformOrigin: "center" }}
                />
              ))}
            </div>
            <span className="text-xs">{message.voice}s</span>
          </div>
        ) : (
          <div className="text-[15px] leading-6">{message.text}</div>
        )}

        <div
          className={
            "mt-1.5 flex justify-between gap-4 text-[11px] " + (mine ? "text-slate-500" : "text-slate-400")
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {mine && (
              <span className="inline-flex items-center gap-1">
                {statusLabel}
                {(message.status === "delivered" || message.status === "seen" || message.seen) && (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>

          {message.reactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {message.reactions.map((reaction) => (
                <div
                  key={`${message.id}-${reaction.userId}-${reaction.type}`}
                  className="rounded-full bg-white/75 px-2 py-1 text-xs shadow-sm ring-1 ring-black/5"
                >
                  {reactionEmoji(reaction.type)}
                </div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {(hoveredMsg === message.id || isTouch) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={
                "absolute bottom-full mb-2 flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.12)] " +
                (mine ? "right-0" : "left-0")
              }
            >
              <button
                onClick={() => onReply(message.id)}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={() => onReaction(message.id, "like")}
                className="rounded-full p-1.5 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => onReaction(message.id, "love")}
                className="rounded-full p-1.5 text-pink-500 transition hover:bg-pink-50 hover:text-pink-600"
              >
                <Heart size={14} />
              </button>
              <button
                onClick={() => onReaction(message.id, "fire")}
                className="rounded-full p-1.5 text-orange-500 transition hover:bg-orange-100 hover:text-orange-600"
              >
                <Flame size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
