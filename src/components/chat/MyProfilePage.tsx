import React from "react";
import { ArrowLeft, AtSign, Mic, PencilLine, Save, X } from "lucide-react";
import AppAvatar from "./AppAvatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type DraftProfile = {
  name: string;
  username: string;
  bio: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  statusText?: string;
  avatarDataUrl?: string;
};

type Profile = {
  name: string;
  username: string;
  bio: string;
  status: string;
  phone: string;
  location: string;
  joinedAt: string;
  role: string;
  accent: string;
  avatar: string;
  avatarUrl?: string;
};

type ActivityMessage = {
  id: string;
  text: string;
  createdAt: string;
  voice?: number;
  reactions: { type: string; userId: string }[];
};

type MyProfilePageProps = {
  myProfile: Profile;
  editingMyProfile: boolean;
  myProfileDraft: DraftProfile;
  authEmail?: string;
  panelMessages: ActivityMessage[];
  onBack: () => void;
  onSignOut: () => void | Promise<void>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void | Promise<void>;
  onDraftChange: <K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) => void;
  onTriggerAvatarPicker: () => void;
  onRemoveAvatarPhoto: () => void;
  onAvatarInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  profileAvatarInputRef: React.RefObject<HTMLInputElement>;
  formatMessageMeta: (date: string) => string;
};

export default function MyProfilePage({
  myProfile,
  editingMyProfile,
  myProfileDraft,
  authEmail,
  panelMessages,
  onBack,
  onSignOut,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDraftChange,
  onTriggerAvatarPicker,
  onRemoveAvatarPhoto,
  onAvatarInputChange,
  profileAvatarInputRef,
  formatMessageMeta,
}: MyProfilePageProps) {
  return (
    <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 pb-32">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="glass-panel-heavy mb-8 flex items-center justify-between gap-4 rounded-[40px] p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full glass-panel text-white/60 hover:text-white"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Settings</div>
              <div className="text-xl font-bold text-white">
                {editingMyProfile ? "Edit Profile" : "My Account"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!editingMyProfile && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-full glass-panel px-6 text-sm font-bold text-white/80 hover:text-white"
                  onClick={onStartEdit}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-full glass-panel px-6 text-sm font-bold text-red-400 hover:bg-red-500/10"
                  onClick={onSignOut}
                >
                  Logout
                </Button>
              </>
            )}
            {editingMyProfile && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-full glass-panel px-6 text-sm font-bold text-white/40 hover:text-white"
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  className="h-12 rounded-full bg-white px-8 text-sm font-bold text-black hover:bg-white/90 shadow-lg" 
                  onClick={onSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="glass-panel space-y-8 rounded-[40px] p-8 shadow-2xl">
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="flex flex-col items-center gap-4 md:items-start">
                <AppAvatar
                  className="h-32 w-32 rounded-3xl border-2 border-white/10 shadow-2xl"
                  initials={myProfile.avatar}
                  imageUrl={myProfileDraft.avatarDataUrl || myProfile.avatarUrl}
                  accent={myProfile.accent}
                  fallbackClassName="text-4xl font-bold text-white"
                />
                {editingMyProfile && (
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      ref={profileAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarInputChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full rounded-2xl glass-panel text-xs font-bold text-white/60 hover:text-white"
                      onClick={onTriggerAvatarPicker}
                    >
                      Change Photo
                    </Button>
                    {myProfileDraft.avatarDataUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-full rounded-2xl glass-panel text-xs font-bold text-red-400 hover:bg-red-500/10"
                        onClick={onRemoveAvatarPhoto}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-6">
                {editingMyProfile ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Display Name</label>
                      <Input
                        value={myProfileDraft.name}
                        onChange={(e) => onDraftChange("name", e.target.value)}
                        className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-white font-bold placeholder:text-white/20 focus:border-white/20 outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Username</label>
                      <Input
                        value={myProfileDraft.username}
                        onChange={(e) => onDraftChange("username", e.target.value)}
                        className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-white font-bold placeholder:text-white/20 focus:border-white/20 outline-none"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Status</label>
                      <Input
                        value={myProfileDraft.statusText || ""}
                        onChange={(e) => onDraftChange("statusText", e.target.value)}
                        className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-white font-bold placeholder:text-white/20 focus:border-white/20 outline-none"
                        placeholder="What's up?"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">{myProfile.name}</h1>
                    <div className="mt-2 flex items-center gap-2 text-white/40">
                      <AtSign className="h-4 w-4" />
                      <span className="font-medium">@{myProfile.username}</span>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {myProfile.status}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Bio</label>
              {editingMyProfile ? (
                <Textarea
                  value={myProfileDraft.bio}
                  onChange={(e) => onDraftChange("bio", e.target.value)}
                  className="min-h-[140px] rounded-3xl border-white/5 bg-white/5 p-6 text-white font-medium placeholder:text-white/10 focus:border-white/20 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="rounded-3xl glass-panel p-6 text-sm leading-relaxed text-white/70">
                  {myProfile.bio || "No bio yet."}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl glass-panel p-4 text-center">
                <div className="text-lg font-bold text-white">{panelMessages.length}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Messages</div>
              </div>
              <div className="rounded-2xl glass-panel p-4 text-center">
                <div className="text-lg font-bold text-white">{panelMessages.filter((m) => m.voice).length}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Voices</div>
              </div>
              <div className="rounded-2xl glass-panel p-4 text-center">
                <div className="text-lg font-bold text-white">
                  {panelMessages.reduce((sum, m) => sum + m.reactions.length, 0)}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-white/20">Reactions</div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Location</label>
                {editingMyProfile ? (
                  <Input
                    value={myProfileDraft.location || ""}
                    onChange={(e) => onDraftChange("location", e.target.value)}
                    className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-white font-bold placeholder:text-white/20 focus:border-white/20 outline-none"
                    placeholder="City"
                  />
                ) : (
                  <div className="rounded-2xl glass-panel px-6 py-4 text-sm font-medium text-white/80">{myProfile.location || "—"}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Phone</label>
                {editingMyProfile ? (
                  <Input
                    value={myProfileDraft.phone || ""}
                    onChange={(e) => onDraftChange("phone", e.target.value)}
                    className="h-14 rounded-2xl border-white/5 bg-white/5 px-6 text-white font-bold placeholder:text-white/20 focus:border-white/20 outline-none"
                    placeholder="+1..."
                  />
                ) : (
                  <div className="rounded-2xl glass-panel px-6 py-4 text-sm font-medium text-white/80">{myProfile.phone || "—"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel flex flex-col gap-6 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Recent Activity</h3>
            <div className="space-y-4 flex-1">
              {panelMessages.slice().reverse().slice(0, 4).map((message) => (
                <div
                  key={message.id}
                  className="rounded-3xl glass-panel p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="text-[9px] font-bold text-white/20 mb-2">{formatMessageMeta(message.createdAt)}</div>
                  <div className="text-sm font-medium text-white/80 line-clamp-2">
                    {message.voice ? `Voice message` : message.text || "Media message"}
                  </div>
                </div>
              ))}
              {panelMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-20">
                  <Mic className="h-8 w-8 mb-4" />
                  <div className="text-[10px] font-bold uppercase tracking-widest">No activity</div>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#7C3AED]/10 p-6 border border-[#7C3AED]/20">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] mb-3">Premium Status</div>
              <p className="text-xs font-medium text-white/60 leading-relaxed">
                Your account is verified and secure. Enjoy full access to all premium features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
