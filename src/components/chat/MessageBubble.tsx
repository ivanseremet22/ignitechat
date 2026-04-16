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
    ? `${groupedWithPrev ? "rounded-tr-lg" : "rounded-tr-3xl"} ${
        groupedWithNext ? "rounded-br-lg" : "rounded-br-3xl"
      } rounded-tl-3xl rounded-bl-3xl`
    : `${groupedWithPrev ? "rounded-tl-lg" : "rounded-tl-3xl"} ${
        groupedWithNext ? "rounded-bl-lg" : "rounded-bl-3xl"
      } rounded-tr-3xl rounded-br-3xl`;

  const showActions = hoveredMsg === message.id;

  const StatusIcon = () => {
    if (!mine) return null;
    if (message.status === "error") return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (message.status === "sending") return <Clock className="h-3 w-3 text-white/20 animate-pulse" />;
    if (message.status === "seen" || message.seen) return <CheckCheck className="h-3 w-3 text-white" />;
    return <Check className="h-3 w-3 text-white/40" />;
  };

  const [lastClickTime, setLastClickTime] = React.useState(0);
  const clickTimeoutRef = React.useRef<number | null>(null);

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const diff = now - lastClickTime;

    if (diff < 300) {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      onReaction(message.id, "like");
      setHoveredMsg(null);
      setLastClickTime(0);
    } else {
      setLastClickTime(now);
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = window.setTimeout(() => {
        setHoveredMsg(isMenuOpen ? null : message.id);
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  return (
    <div
      className={`${mine ? "flex justify-end" : "flex justify-start"} ${groupedWithPrev ? "mt-1" : "mt-6"} group relative ${message.reactions.length > 0 ? "mb-4" : ""}`}
    >
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHoveredMsg(message.id);
        }}
        onClick={handleBubbleClick}
        className={`message-bubble relative max-w-[min(85%,600px)] cursor-pointer px-5 py-4 transition-all duration-300 ${
          isMenuOpen ? (mine ? "-translate-x-2 scale-[0.98]" : "translate-x-2 scale-[0.98]") : ""
        } ${radiusClass} ${
          mine
            ? "bg-white text-black shadow-xl"
            : "glass-panel text-white"
        }`}
      >
        {replyTarget && (
          <div
            className={
              "mb-3 rounded-2xl border-l-2 px-4 py-2 text-[11px] font-medium " +
              (mine
                ? "border-black/10 bg-black/5 text-black/60"
                : "border-white/20 bg-white/5 text-white/60")
            }
          >
            <div className="truncate font-bold">
              {replyTarget.voice ? `Voice message` : replyTarget.text}
            </div>
          </div>
        )}

        {message.voice ? (
          <div className="flex min-w-[200px] items-center gap-4">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleVoicePlay(message.id);
              }}
              className={
                mine
                  ? "flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg"
                  : "flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg"
              }
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>

            <div className="flex flex-1 items-end gap-1 h-6">
              {wave.map((height, index) => (
                <div
                  key={`${message.id}-bar-${index}`}
                  className={`w-0.5 rounded-full ${mine ? "bg-black/10" : "bg-white/10"}`}
                  style={{
                    height: `${(height / 22) * 100}%`,
                    animationDelay: `${index * 0.05}s`,
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                />
              ))}
            </div>

            <span className={`text-[10px] font-bold ${mine ? 'text-black/30' : 'text-white/30'}`}>{message.voice}s</span>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed font-medium tracking-tight whitespace-pre-wrap break-words">{message.text}</div>
        )}

        <div className={"mt-1.5 flex justify-end gap-2 text-[10px] font-bold " + (mine ? "text-black/30" : "text-white/20")}>
          <div className="flex items-center gap-1.5">
            <span>{timeLabel}</span>
            {message.updatedAt && <span>(edited)</span>}
            <StatusIcon />
          </div>
        </div>

        {message.reactions.length > 0 && (
          <div className={`absolute -bottom-3 ${mine ? "right-2" : "left-2"} z-10 flex flex-wrap items-center gap-1`}>
            {message.reactions.map((reaction) => (
              <div
                key={`${message.id}-${reaction.userId}-${reaction.type}`}
                className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white px-2 py-1 text-[13px] text-black shadow-lg ring-1 ring-black/5 hover:scale-110 transition-transform"
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
              className={`absolute bottom-full z-[60] mb-3 flex flex-col gap-1 rounded-3xl border border-white/10 bg-black/90 p-2 shadow-2xl backdrop-blur-3xl ${
                mine ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-1.5 px-1.5">
                {["like", "love", "fire"].map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReaction(message.id, type as any);
                      setHoveredMsg(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl transition hover:bg-white/10 hover:scale-110 active:scale-90"
                  >
                    <span className="text-xl">{reactionEmoji(type as any)}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <MenuAction
                  icon={<Reply size={16} />}
                  label="Reply"
                  onClick={() => {
                    onReply(message.id);
                    setHoveredMsg(null);
                  }}
                />
                <MenuAction
                  icon={<Copy size={16} />}
                  label="Copy"
                  onClick={handleCopy}
                />
                {mine && onEdit && (
                  <MenuAction
                    icon={<Pencil size={16} />}
                    label="Edit"
                    onClick={() => {
                      onEdit(message.id, message.text);
                      setHoveredMsg(null);
                    }}
                  />
                )}
                {mine && onDelete && (
                  <MenuAction
                    icon={<Trash2 size={16} className="text-red-400" />}
                    label="Delete"
                    danger
                    onClick={() => {
                      onDelete(message.id);
                      setHoveredMsg(null);
                    }}
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
        danger 
          ? "text-red-400 hover:bg-red-500/10" 
          : "text-white/80 hover:bg-white/10"
      }`}
    >
      <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
      <span className="opacity-40">{icon}</span>
    </button>
  );
}

export default memo(MessageBubble);
