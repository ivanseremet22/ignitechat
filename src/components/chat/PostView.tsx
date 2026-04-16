import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { X, MoreHorizontal, Check, ChevronDown, Camera, PencilLine, Save, HelpCircle } from "lucide-react";
import { UserProfile, ProfileDraft } from "../../chat-types";

type ProfileViewProps = {
  myProfile: UserProfile | null;
  draft: ProfileDraft;
  onUpdateDraft: (field: string, value: string) => void;
  onSaveProfile: () => Promise<void>;
};

export default function ProfileView({ myProfile, draft, onUpdateDraft, onSaveProfile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Going");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({
    container: containerRef
  });

  const smoothScrollY = useSpring(scrollY, {
    stiffness: 70, // More weighted feel
    damping: 40,   // More control, less bounce
    mass: 1,
    restDelta: 0.001
  });

  // Background Blur/Scale on Scroll
  const bgBlur = useTransform(smoothScrollY, [0, 200], ["0px", "10px"]);
  const bgScale = useTransform(smoothScrollY, [0, 300], [1, 1.05]);
  
  // Content Fade on Scroll
  const initialTextOpacity = useTransform(smoothScrollY, [0, 100], [1, 0]);
  
  // Bottom Card Expansion - Using absolute positioning for better control
  const cardYPos = useTransform(smoothScrollY, [0, 500], ["85vh", "0vh"]); 
  const cardHeight = useTransform(smoothScrollY, [0, 500], ["15vh", "100vh"]);
  const cardRadius = useTransform(smoothScrollY, [0, 500], ["40px", "0px"]); 

  // Initialize draft
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

  const avatarPreview = draft.avatarDataUrl || myProfile?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop';

  return (
    <div className="relative h-full w-full overflow-hidden bg-black font-sans no-scrollbar">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <motion.div 
          style={{ 
            backgroundImage: `url('${avatarPreview}')`,
            filter: `brightness(0.7) blur(${bgBlur})`,
            scale: bgScale
          }}
          className="h-full w-full bg-cover bg-center"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/95 pointer-events-none" />
      </div>

      {/* Top Header Buttons */}
      <div className="relative z-[110] flex items-center justify-between px-6 pt-12">
        <button className="relative z-30 flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>

        {/* Centered Name Header */}
        <div className="absolute inset-x-0 top-12 flex items-center justify-center px-20">
          <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-xl truncate max-w-[200px]">
            {draft.name || myProfile?.name || "Profile"}
          </h1>
        </div>
        
        <div className="relative z-30 flex items-center gap-2">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-full bg-white text-black font-bold text-xs shadow-xl hover:bg-white/90 transition-colors"
            >
              <Save size={16} /> Save
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white hover:bg-white/10 transition-colors"
            >
              <PencilLine size={18} />
            </button>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-full glass-surface text-white hover:bg-white/10 transition-colors">
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

      {/* Scrollable Content Container */}
      <div 
        ref={containerRef}
        className="relative z-20 h-full overflow-y-auto no-scrollbar pt-[25vh]"
      >
        <div className="h-[1200px] w-full flex flex-col items-center">
          {/* Central Information Section */}
          <motion.div 
            style={{ opacity: initialTextOpacity }}
            className="flex flex-col items-center text-center px-8"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white mb-6 drop-shadow-2xl">
              Housewarming Party
            </h1>
            <div className="space-y-1 text-base font-medium text-white/70">
              <p>19 September, 12 pm</p>
              <p>1559 Audubon Ave</p>
              <p>New York, NY</p>
            </div>

            {/* Segmented Control Tabs */}
            <div className="mt-10 flex w-[320px] items-center gap-1 rounded-[24px] bg-black/30 p-1 backdrop-blur-xl border border-white/10">
              <button
                onClick={() => setActiveTab("Going")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] py-3 text-xs font-bold transition-all duration-300 ${
                  activeTab === "Going" ? "bg-white text-green-600 shadow-xl" : "text-white/40"
                }`}
              >
                <Check size={14} className={activeTab === "Going" ? "text-green-600" : "text-white/40"} />
                Going
              </button>
              <button
                onClick={() => setActiveTab("Not Going")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] py-3 text-xs font-bold transition-all duration-300 ${
                  activeTab === "Not Going" ? "bg-white text-red-600 shadow-xl" : "text-white/40"
                }`}
              >
                <X size={14} className={activeTab === "Not Going" ? "text-red-600" : "text-white/40"} />
                Not Going
              </button>
              <button
                onClick={() => setActiveTab("Maybe")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] py-3 text-xs font-bold transition-all duration-300 ${
                  activeTab === "Maybe" ? "bg-white text-blue-600 shadow-xl" : "text-white/40"
                }`}
              >
                <HelpCircle size={14} className={activeTab === "Maybe" ? "text-blue-600" : "text-white/40"} />
                Maybe
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Card Container - Peeks from the bottom and expands */}
       <motion.div 
         style={{ 
           y: cardYPos,
           height: cardHeight,
           borderRadius: cardRadius,
         }}
         className="fixed left-0 right-0 top-0 z-30 glass-card-dark overflow-y-auto no-scrollbar p-8 shadow-2xl backdrop-blur-3xl px-6 sm:px-12 pointer-events-auto"
       >
        {/* Scroll Indicator Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />

        <div className="flex flex-col items-center text-center mt-2 pb-24">
          <div className="mb-4 flex justify-center">
            <img 
              src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=Andre"} 
              alt="Host" 
              className="h-10 w-10 rounded-full border-2 border-white/20 shadow-xl"
            />
          </div>
          
          <h3 className="mb-2 text-sm font-bold text-blue-400">
            Hosted by {draft.name || myProfile?.name || "Andre Lorico"}
          </h3>
          
          <div className="w-full space-y-4 px-4">
            <p className="text-sm font-medium leading-relaxed text-white/90">
              We've just moved to New York!<br />
              And warmer weather means<br />
              housewarming!
            </p>
            <p className="text-xs font-medium leading-relaxed text-white/50">
              We'll have light refreshments, drinks and<br />
              BBQing in the evening. Stop by to hang<br />
              out, catch up and friends meet friends!
            </p>
            {/* Added more content to test scrolling within the card */}
            <p className="text-xs font-medium leading-relaxed text-white/40">
              Join us for a wonderful evening filled with music and laughter.
            </p>
          </div>
        </div>

        {isEditing && (
          <div 
            onClick={handlePhotoClick}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 cursor-pointer"
          >
            <Camera size={32} className="text-white animate-pulse" />
          </div>
        )}
      </motion.div>

      {/* Floating Scroll Indicator Pill */}
      <motion.div 
        style={{ opacity: initialTextOpacity }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/40 px-6 py-3 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-xl pointer-events-none"
      >
         Scroll Down to see full post
         <ChevronDown size={14} className="animate-bounce" />
      </motion.div>

      {/* Profile Edit Toggle Button */}
      <div className="fixed top-12 right-20 z-[110]">
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
            <PencilLine size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
