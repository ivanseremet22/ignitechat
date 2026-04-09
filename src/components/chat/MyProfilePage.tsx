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
    <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 md:px-5 md:py-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[28px] border border-white/70 bg-white/80 px-3 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Личный профиль</div>
              <div className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                {editingMyProfile ? "Редактирование профиля" : "Мой профиль"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingMyProfile && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={onStartEdit}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Редактировать
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={onSignOut}
                >
                  Сменить аккаунт
                </Button>
              </>
            )}
            {editingMyProfile && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={onCancelEdit}
                >
                  Отмена
                </Button>
                <Button type="button" className="rounded-full bg-slate-900 text-white hover:bg-slate-800" onClick={onSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.90))] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex w-full flex-col items-start gap-3 md:w-[220px]">
                <AppAvatar
                  className="h-24 w-24 md:h-28 md:w-28"
                  initials={myProfile.avatar}
                  imageUrl={myProfileDraft.avatarDataUrl || myProfile.avatarUrl}
                  accent={myProfile.accent}
                  fallbackClassName="text-3xl font-semibold text-slate-900"
                />
                {editingMyProfile && (
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="rounded-full border border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
                      onClick={onTriggerAvatarPicker}
                    >
                      Загрузить фото
                    </Button>
                    {myProfileDraft.avatarDataUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={onRemoveAvatarPhoto}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Удалить
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-1">
                {editingMyProfile ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Имя</label>
                      <Input
                        value={myProfileDraft.name}
                        onChange={(e) => onDraftChange("name", e.target.value)}
                        className="h-12 rounded-2xl border-slate-200 bg-white/90"
                        placeholder="Ваше имя"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Username</label>
                      <Input
                        value={myProfileDraft.username}
                        onChange={(e) => onDraftChange("username", e.target.value)}
                        className="h-12 rounded-2xl border-slate-200 bg-white/90"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Статус</label>
                      <Input
                        value={myProfileDraft.statusText || ""}
                        onChange={(e) => onDraftChange("statusText", e.target.value)}
                        className="h-12 rounded-2xl border-slate-200 bg-white/90"
                        placeholder="Что у вас нового?"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="truncate text-3xl font-semibold tracking-tight text-slate-900">{myProfile.name}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <AtSign className="h-4 w-4" />
                      <span>@{myProfile.username}</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {myProfile.status}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="relative mt-5">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">О себе</label>
              {editingMyProfile ? (
                <Textarea
                  value={myProfileDraft.bio}
                  onChange={(e) => onDraftChange("bio", e.target.value)}
                  className="min-h-[120px] rounded-[24px] border-slate-200 bg-white/90"
                  placeholder="Расскажите о себе"
                />
              ) : (
                <div className="rounded-[24px] border border-white/70 bg-white/75 px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                  {myProfile.bio}
                </div>
              )}
            </div>

            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                <div className="text-base font-semibold text-slate-900">{panelMessages.length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">messages</div>
              </div>
              <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                <div className="text-base font-semibold text-slate-900">{panelMessages.filter((message) => message.voice).length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">voice</div>
              </div>
              <div className="rounded-2xl bg-white/82 px-3 py-3 text-center shadow-sm ring-1 ring-white/70">
                <div className="text-base font-semibold text-slate-900">
                  {panelMessages.reduce((sum, message) => sum + message.reactions.length, 0)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">reactions</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Локация</label>
                {editingMyProfile ? (
                  <Input
                    value={myProfileDraft.location || ""}
                    onChange={(e) => onDraftChange("location", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white"
                    placeholder="Ваш город"
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">{myProfile.location}</div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Телефон</label>
                {editingMyProfile ? (
                  <Input
                    value={myProfileDraft.phone || ""}
                    onChange={(e) => onDraftChange("phone", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white"
                    placeholder="+7..."
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">{myProfile.phone}</div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Email</label>
                {editingMyProfile ? (
                  <Input
                    value={myProfileDraft.email}
                    onChange={(e) => onDraftChange("email", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-white"
                    placeholder="email@example.com"
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">{authEmail || "—"}</div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Роль</label>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {myProfile.role} • {myProfile.joinedAt}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Активность</div>
            <div className="space-y-3">
              {panelMessages.slice().reverse().slice(0, 5).map((message) => (
                <div
                  key={message.id}
                  className="rounded-[22px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] px-4 py-3"
                >
                  <div className="text-xs text-slate-400">{formatMessageMeta(message.createdAt)}</div>
                  <div className="mt-1 text-sm text-slate-700">
                    {message.voice ? `Голосовое • ${message.voice} c` : message.text || "Сообщение без текста"}
                  </div>
                </div>
              ))}
              {panelMessages.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Пока нет активности для отображения.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Рефакторинг состояния</div>
              <div className="space-y-2">
                <div>• Sidebar всегда остаётся слева и не исчезает при открытии профиля.</div>
                <div>• Центральная колонка переключается между чатом и страницей профиля.</div>
                <div>• Правая панель по-прежнему отвечает только за профиль собеседника.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
