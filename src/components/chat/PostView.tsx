import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { X, MoreHorizontal, Check, Camera, PencilLine, Save, HelpCircle, LogOut, Settings, User as UserIcon, Flame, Bell, Share2, Grid, Image as ImageIcon, Layout, Download, Hash, Calendar, MapPin, Heart, MessageCircle, Send } from "lucide-react";
import { UserProfile, ProfileDraft, Post, PostComment } from "../../chat-types";

type ProfileViewProps = {
  myProfile: UserProfile | null;
  draft: ProfileDraft;
  posts: Post[];
  onAddPost: (content: string, imageUrl?: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onUpdateDraft: (field: keyof ProfileDraft, value: string) => void;
  onSaveProfile: () => Promise<void>;
  onSignOut?: () => void;
  setShowBottomNav?: (show: boolean) => void;
};

export default function ProfileView({ myProfile, draft, posts, onAddPost, onToggleLike, onAddComment, onUpdateDraft, onSaveProfile, onSignOut, setShowBottomNav }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Лента");
  const [showMenu, setShowMenu] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({
    container: containerRef
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setShowBottomNav?.(false);
    } else {
      setShowBottomNav?.(true);
    }
  });

  const smoothScrollY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
    restDelta: 0.001
  });

  // Animations based on scroll
  const headerOpacity = useTransform(smoothScrollY, [100, 200], [0, 1]);
  const coverScale = useTransform(smoothScrollY, [-100, 0], [1.2, 1]);

  // Initialize draft
  useEffect(() => {
    if (myProfile) {
      const fields: (keyof ProfileDraft)[] = [
        "name", "username", "bio", "email", "phone", "location", "statusText", "avatarDataUrl"
      ];
      fields.forEach(field => {
        const val = (myProfile as any)[field] || (myProfile as any)[field === 'statusText' ? 'status' : ''];
        if (val && !draft[field]) {
          onUpdateDraft(field, val);
        }
      });
    }
    
    return () => {
      setShowBottomNav?.(true);
    };
  }, [myProfile, onUpdateDraft, setShowBottomNav]);

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateDraft("coverDataUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (newPostContent.trim() || newPostImage) {
      onAddPost(newPostContent, newPostImage || undefined);
      setNewPostContent("");
      setNewPostImage(null);
      setShowCreatePost(false);
    }
  };

  const handleSave = async () => {
    await onSaveProfile();
    setIsEditing(false);
  };

  const avatarPreview = draft.avatarDataUrl || myProfile?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop';
  const coverPreview = draft.coverDataUrl || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1000&auto=format&fit=crop'; // Use draft cover if exists

  const tabs = [
    { id: "Лента", icon: Layout, label: "Feed" },
    { id: "Вызовы", icon: UserIcon, label: "Challenge" },
    { id: "Значки", icon: ImageIcon, label: "Badge" }
  ];

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Только что";
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black font-sans no-scrollbar select-none text-white">
      {/* Sticky Header for scroll */}
      <motion.div 
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-[120] bg-black/80 backdrop-blur-xl h-16 flex items-center px-6 pointer-events-none"
      >
        <p className="font-bold text-sm truncate">{draft.name || myProfile?.name}</p>
      </motion.div>

      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="relative z-20 h-full overflow-y-auto no-scrollbar scroll-smooth"
      >
        {/* Cover Section */}
        <div className="relative h-64 w-full overflow-hidden bg-[#111]">
          <motion.div 
            style={{ scale: coverScale }}
            className="h-full w-full"
          >
            <img 
              src={coverPreview} 
              className="h-full w-full object-cover opacity-60"
              alt="Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
          </motion.div>

          {/* Edit Cover Overlay */}
          {isEditing && (
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[2px] hover:bg-black/50 transition-all group z-[30] pb-12"
            >
              <div className="flex flex-col items-center gap-2">
                <Camera size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Сменить обложку</span>
              </div>
            </button>
          )}

          {/* Top Buttons on Cover */}
          <div className="absolute top-10 right-6 flex items-center gap-2 z-40">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`h-9 w-9 rounded-full ${isEditing ? 'bg-lime-400 text-black' : 'bg-black/40 text-white'} backdrop-blur-md border border-white/10 flex items-center justify-center hover:opacity-90 transition-all`}
            >
              {isEditing ? <Check size={18} /> : <PencilLine size={18} />}
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="relative px-6 pb-32 bg-black">
          {/* Layout: Avatar, then Name & Status directly below */}
          <div className="flex flex-col items-start relative z-50">
            {/* Overlapping Avatar */}
            <div className="relative -mt-24 mb-4">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhotoClick();
                }}
                className={`h-32 w-32 rounded-full border-4 border-black overflow-hidden bg-[#111] shadow-2xl relative ${isEditing ? 'cursor-pointer group z-50' : ''}`}
              >
                <img 
                  src={avatarPreview} 
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  alt="Profile"
                />
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} />
                  </div>
                )}
              </div>
            </div>

            {/* Name & Editable Status Area */}
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-4xl font-extrabold tracking-tight uppercase leading-none">
                    {draft.name || myProfile?.name || "БЕЗ ИМЕНИ"}
                  </h2>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="text-white/20 hover:text-lime-400 transition-colors"
                    >
                      <PencilLine size={16} />
                    </button>
                  )}
                </div>

                {/* Followers/Following Count Row */}
                {!isEditing && (
                  <div className="flex items-center gap-5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-sm tracking-tight">1.2K</span>
                      <span className="text-white/40 text-[11px] font-medium tracking-wide">подписчиков</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-sm tracking-tight">480</span>
                      <span className="text-white/40 text-[11px] font-medium tracking-wide">подписок</span>
                    </div>
                  </div>
                )}

                {/* Editable Status Line */}
                <div className="relative group pt-2">
                  {isEditing ? (
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Имя</label>
                        <input 
                          value={draft.name}
                          onChange={(e) => onUpdateDraft("name", e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-sm font-bold focus:outline-none focus:border-lime-400 transition-colors"
                          placeholder="Ваше имя..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Статус</label>
                        <textarea 
                          value={draft.bio}
                          onChange={(e) => onUpdateDraft("bio", e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-lime-400 transition-colors resize-none h-20"
                          placeholder="Ваш статус..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSave}
                          className="flex-1 h-12 bg-lime-400 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.3)] active:scale-95 transition-all uppercase text-xs"
                        >
                          Сохранить
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 h-12 bg-white/5 text-white font-black rounded-2xl border border-white/10 active:scale-95 transition-all uppercase text-xs"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[80%]">
                        {draft.bio || myProfile?.bio || "Установить статус..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pill Tabs */}
          <div className="flex items-center justify-center gap-2 mt-10 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isActive ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tab.id}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="mt-10 space-y-6">
             {/* Create Post UI */}
             <div className="rounded-[32px] bg-white/[0.03] border border-white/[0.08] p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                   <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={avatarPreview} className="h-full w-full object-cover" />
                   </div>
                   <div className="flex-1 space-y-3">
                      <textarea 
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Что у вас нового?"
                        className="w-full bg-transparent border-none text-sm font-medium focus:outline-none resize-none min-h-[40px] pt-2 placeholder:text-white/20"
                      />
                      
                      {newPostImage && (
                        <div className="relative rounded-[20px] overflow-hidden aspect-video border border-white/10 group">
                           <img src={newPostImage} className="h-full w-full object-cover" />
                           <button 
                             onClick={() => setNewPostImage(null)}
                             className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                           >
                             <X size={14} />
                           </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                         <button 
                           onClick={() => postImageInputRef.current?.click()}
                           className="flex items-center gap-2 text-white/30 hover:text-lime-400 transition-colors"
                         >
                            <ImageIcon size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Фото</span>
                         </button>
                         <button 
                           onClick={handleCreatePost}
                           disabled={!newPostContent.trim() && !newPostImage}
                           className="px-5 py-2 bg-lime-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                         >
                            Опубликовать
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             {/* Posts List */}
             {posts.length > 0 ? (
               posts.map((post) => (
                 <div key={post.id} className="rounded-[40px] bg-white/[0.03] border border-white/[0.08] overflow-hidden backdrop-blur-md">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
                          <img src={post.userAvatar} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-tight">{post.userName}</p>
                          <p className="text-[10px] text-white/20 font-bold uppercase">{formatPostDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <MoreHorizontal size={18} className="text-white/20" />
                    </div>
                    <div className="px-5 pb-5">
                      {post.content && (
                        <p className="text-sm font-medium mb-4 leading-relaxed">{post.content}</p>
                      )}
                      {post.imageUrl && (
                        <div className="rounded-[28px] overflow-hidden aspect-video bg-white/5 border border-white/5">
                          <img 
                            src={post.imageUrl} 
                            className="h-full w-full object-cover"
                            alt="Post content"
                          />
                        </div>
                      )}

                      {/* Post Interactions */}
                      <div className="flex items-center gap-6 mt-5 pt-1">
                        <button 
                          onClick={() => onToggleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors group ${post.likes.includes(myProfile?.id || "") ? "text-red-500" : "text-white/20 hover:text-red-500"}`}
                        >
                           <Heart size={20} className={`${post.likes.includes(myProfile?.id || "") ? "fill-current scale-110" : "group-active:scale-125"} transition-transform`} />
                           <span className="text-[11px] font-bold">{post.likes.length}</span>
                        </button>
                        <button 
                          onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                          className={`flex items-center gap-2 transition-colors ${commentingPostId === post.id ? "text-blue-400" : "text-white/20 hover:text-blue-400"}`}
                        >
                           <MessageCircle size={20} />
                           <span className="text-[11px] font-bold">{post.comments.length}</span>
                        </button>
                        <button className="flex items-center gap-2 text-white/20 hover:text-lime-400 transition-colors">
                           <Send size={18} />
                        </button>
                      </div>

                      {/* Comments Section */}
                      <AnimatePresence>
                        {commentingPostId === post.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-6 space-y-4">
                              <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                  <img src={avatarPreview} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 flex gap-2">
                                  <input 
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Оставьте комментарий..."
                                    className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-white/10"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        onAddComment(post.id, newCommentText);
                                        setNewCommentText("");
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      onAddComment(post.id, newCommentText);
                                      setNewCommentText("");
                                    }}
                                    className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase transition-colors"
                                  >
                                    OK
                                  </button>
                                </div>
                              </div>

                              {post.comments.length > 0 && (
                                <div className="space-y-4 pl-11">
                                  {post.comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <div className="h-6 w-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                                        <img src={comment.userAvatar} className="h-full w-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-white/40">{comment.userName}</span>
                                          <span className="text-[8px] font-medium text-white/10 uppercase">{formatPostDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-white/70 leading-relaxed">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-20 text-center">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Пока нет постов</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[140] bg-[#111] rounded-t-[40px] p-8 pb-12 border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="space-y-3">
                <button className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-white/5 hover:bg-white/10 transition-colors font-bold uppercase text-[10px] tracking-widest">
                  <Settings size={20} className="text-lime-400" /> Настройки
                </button>
                <button className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-white/5 hover:bg-white/10 transition-colors font-bold uppercase text-[10px] tracking-widest">
                  <Share2 size={20} className="text-blue-400" /> Поделиться
                </button>
                <div className="h-px bg-white/5 my-4" />
                <button 
                  onClick={() => onSignOut?.()}
                  className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-red-500/10 hover:bg-red-500/20 transition-colors font-bold uppercase text-[10px] tracking-widest text-red-400"
                >
                  <LogOut size={20} /> Выйти
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
      <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={handlePostImageChange} />
    </div>
  );
}
