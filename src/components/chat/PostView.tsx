import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MoreHorizontal, Check, ChevronDown, Camera, PencilLine, Save } from "lucide-react";
import { UserProfile, ProfileDraft } from "../../chat-types";

type ProfileViewProps = {
  myProfile: UserProfile | null;
  draft: ProfileDraft;
  onUpdateDraft: (field: string, value: string) => void;
  onSaveProfile: () => Promise<void>;
};

export default function ProfileView({ myProfile, draft, onUpdateDraft, onSaveProfile }: ProfileViewProps) {
  const [status, setStatus] = useState<"going" | "not" | "maybe">("going");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize draft if it's empty and we have a profile
  useEffect(() => {
    if (myProfile && !draft.name) {
      onUpdateDraft("name", myProfile.name);
    }
    if (myProfile && !draft.bio) {
      onUpdateDraft("bio", myProfile.bio || "");
    }
  }, [myProfile, draft.name, draft.bio, onUpdateDraft]);

  const handlePhotoClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateDraft("avatarDataUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await onSaveProfile();
    setIsEditing(false);
  };

  const avatarPreview = draft.avatarDataUrl || myProfile?.avatarUrl;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Background Image - User's Profile Photo */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-400 ${isEditing ? 'scale-110 blur-sm' : ''}`}
        style={{ 
          backgroundImage: `url('${avatarPreview || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop'}')`,
          filter: isEditing ? 'brightness(0.5)' : 'brightness(0.7) contrast(1.1)'
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/90" />

      {/* Top Bar */}
      <div className="relative z-20 flex min-h-[100px] items-center px-6 pt-12">
        {/* Absolute centering container */}
        <div className="absolute inset-x-0 top-12 flex items-center justify-center px-20">
          <div className="w-full max-w-[280px]">
            {isEditing ? (
              <input
                value={draft.name}
                onChange={(e) => onUpdateDraft("name", e.target.value)}
                className="text-glow w-full bg-transparent text-center text-2xl font-bold tracking-tight text-white outline-none border-b border-white/20"
                autoFocus
              />
            ) : (
              <h1 className="text-glow truncate text-center text-2xl font-bold tracking-tight text-white">
                {draft.name || myProfile?.name || "Profile"}
              </h1>
            )}
          </div>
        </div>

        {/* Buttons remain in flow but outside the centered name */}
        <button className="relative z-30 flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white">
          <X size={20} />
        </button>

        <div className="relative z-30 ml-auto flex gap-2">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-xs shadow-xl"
            >
              <Save size={16} /> Save
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white"
            >
              <PencilLine size={20} />
            </button>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col justify-end pb-32 px-6">
        <div className="mb-8 text-center">
          <div className="space-y-1 text-sm font-medium text-white/70">
            <p>19 September, 12 pm</p>
            <p>1559 Audubon Ave</p>
            <p>New York, NY</p>
          </div>
        </div>

        {/* Toggle Buttons with smooth animation */}
        <div className="glass-surface relative mb-8 flex h-14 w-full items-center rounded-2xl p-1.5 overflow-hidden">
          <div className="absolute inset-1.5 flex w-[calc(100%-12px)] pointer-events-none">
            <motion.div
              layoutId="profileStatusGlow"
              className="h-full rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              initial={false}
              animate={{
                x: status === "going" ? "0%" : status === "not" ? "100%" : "200%",
                width: "33.333%"
              }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
            />
          </div>

          <button 
            onClick={() => setStatus("going")}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 h-full transition-colors duration-200 ${status === "going" ? "text-green-600" : "text-white/60"}`}
          >
            {status === "going" && <Check size={14} strokeWidth={3} />}
            <span className="text-xs font-bold">Going</span>
          </button>
          <button 
            onClick={() => setStatus("not")}
            className={`relative z-10 flex flex-1 items-center justify-center h-full transition-colors duration-300 ${status === "not" ? "text-red-500" : "text-white/60"}`}
          >
             <span className="text-xs font-bold">Not Going</span>
          </button>
          <button 
            onClick={() => setStatus("maybe")}
            className={`relative z-10 flex flex-1 items-center justify-center h-full transition-colors duration-300 ${status === "maybe" ? "text-gray-800" : "text-white/60"}`}
          >
             <span className="text-xs font-bold">Maybe</span>
          </button>
        </div>

        {/* Profile Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-dark relative rounded-[32px] p-6 text-center group"
        >
          {isEditing && (
            <div 
              onClick={handlePhotoClick}
              className="absolute inset-0 z-30 flex items-center justify-center rounded-[32px] bg-black/40 cursor-pointer"
            >
              <Camera size={32} className="text-white animate-pulse" />
            </div>
          )}

          <div className="mb-4 flex justify-center">
             <img 
               src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=Andre"} 
               alt="Host" 
               className="h-10 w-10 rounded-full border border-white/20"
             />
          </div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">
            Hosted by {(draft.name || myProfile?.name || "User").split(' ')[0]}
          </h3>
          
          {isEditing ? (
            <textarea
              value={draft.bio}
              onChange={(e) => onUpdateDraft("bio", e.target.value)}
              className="mb-4 w-full bg-transparent text-center text-xs font-medium leading-relaxed text-white/70 outline-none border-b border-white/10 resize-none h-20"
            />
          ) : (
            <p className="mb-4 text-xs font-medium leading-relaxed text-white/70 whitespace-pre-line">
              {draft.bio || myProfile?.bio || "No bio yet."}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-white/40">
            We'll have light refreshments, drinks and<br />
            BBQing in the evening. Stop by to hang<br />
            out, catch up and friends meet friends!
          </p>
        </motion.div>

        <button className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
           Scroll Down to see full post
           <ChevronDown size={14} className="rounded-full border border-white/20 p-0.5" />
        </button>
      </div>
    </div>
  );
}
