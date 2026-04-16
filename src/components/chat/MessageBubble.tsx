import React, { memo, useMemo } from "react";
import { Flame, Heart, MessageCircle, Pause, Play, ThumbsUp } from "lucide-react";
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

function MessageBubble({
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

  const statusTone = mine
    ? message.status === "error"
      ? "bg-rose-400 shadow-[0_0_0_1px_rgba(251,113,133,0.18),0_0_14px_rgba(251,113,133,0.32)]"
      : message.status === "seen" || message.seen
        ? "bg-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.16),0_0_16px_rgba(56,189,248,0.3)]"
        : "bg-rose-300 shadow-[0_0_0_1px_rgba(251,113,133,0.16),0_0_14px_rgba(251,113,133,0.24)]"
    : "";

  const showActions = hoveredMsg === message.id;

  return (
    <div
      className={`${mine ? "flex justify-end" : "flex justify-start"} ${groupedWithPrev ? "mt-1" : "mt-4"}`}
      onMouseEnter={() => !isTouch && setHoveredMsg(message.id)}
      onMouseLeave={() => !isTouch && setHoveredMsg(null)}
      onClick={() => isTouch && setHoveredMsg(showActions ? null : message.id)}
    >
      <div
        className={`message-bubble relative max-w-[min(98%,1120px)] px-3.5 py-3 md:max-w-[min(92%,1280px)] lg:max-w-[min(86%,1480px)] ${radiusClass} ${
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

        <div className={"mt-1.5 flex justify-between gap-4 text-[11px] " + (mine ? "text-slate-500" : "text-slate-400")}>
          <div className="flex flex-wrap items-center gap-2">
            <span>{timeLabel}</span>
            {mine && <span className={`message-status-indicator ${statusTone}`} />}
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

        {showActions && (
          <div
            className={
              "absolute bottom-full mb-2 flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.08)] " +
              (mine ? "right-0" : "left-0")
            }
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                onReply(message.id);
              }}
              className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <MessageCircle size={14} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onReaction(message.id, "like");
              }}
              className="rounded-full p-1.5 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onReaction(message.id, "love");
              }}
              className="rounded-full p-1.5 text-pink-500 transition hover:bg-pink-50 hover:text-pink-600"
            >
              <Heart size={14} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onReaction(message.id, "fire");
              }}
              className="rounded-full p-1.5 text-orange-500 transition hover:bg-orange-100 hover:text-orange-600"
            >
              <Flame size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble);
