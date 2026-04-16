import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users, Home, BarChart2, MessageCircle, UserPlus, Grid } from "lucide-react";

type BottomNavBarProps = {
  activeTab: "chats" | "discover" | "profile" | "stats" | "groups" | "post";
  setActiveTab: (tab: "chats" | "discover" | "profile" | "stats" | "groups" | "post") => void;
  unreadCount?: number;
};

export default function BottomNavBar({ activeTab, setActiveTab, unreadCount }: BottomNavBarProps) {
  const tabs = [
    { id: "groups", icon: UserPlus },
    { id: "chats", icon: MessageSquare },
    { id: "post", icon: Home, isMain: true },
    { id: "stats", icon: BarChart2 },
    { id: "profile", icon: MessageCircle, hasBadge: (unreadCount ?? 0) > 0 },
  ] as const;

  return (
    <div className="fixed bottom-10 left-1/2 z-[100] w-full max-w-[360px] -translate-x-1/2 px-4 pointer-events-none">
      <div className="nav-blur pointer-events-auto flex items-center justify-between rounded-[36px] px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isMain) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-500 ${
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-[0_0_25px_rgba(124,58,237,0.6)] scale-110"
                    : "bg-[#7C3AED]/20 text-white/40 hover:bg-[#7C3AED]/40"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-full bg-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? "text-white scale-110" : "text-white/30 group-hover:text-white/60"}`} />
                {tab.hasBadge && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-[#121212]">
                    {unreadCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
