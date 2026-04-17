import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users, Home, BarChart2, MessageCircle, UserPlus, Grid, User as UserIcon } from "lucide-react";

type BottomNavBarProps = {
  activeTab: "chats" | "discover" | "profile" | "stats" | "groups" | "post";
  setActiveTab: (tab: "chats" | "discover" | "profile" | "stats" | "groups" | "post") => void;
  unreadCount?: number;
};

export default function BottomNavBar({ activeTab, setActiveTab, unreadCount }: BottomNavBarProps) {
  const tabs = [
    { id: "groups", icon: UserPlus, isMain: false, hasBadge: false },
    { id: "chats", icon: MessageSquare, isMain: false, hasBadge: false },
    { id: "post", icon: UserIcon, isMain: true, hasBadge: false },
    { id: "stats", icon: BarChart2, isMain: false, hasBadge: false },
    { id: "profile", icon: MessageCircle, isMain: false, hasBadge: (unreadCount ?? 0) > 0 },
  ] as const;

  return (
    <div className="fixed bottom-2 left-1/2 z-[100] w-full max-w-[340px] -translate-x-1/2 px-4 pointer-events-none">
      <div className="bg-white/[0.03] backdrop-blur-[40px] pointer-events-auto flex items-center justify-between rounded-[22px] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/[0.05] relative">
        
        {/* Animated Background Indicator */}
        <div className="absolute inset-1 flex items-center justify-between z-0 pointer-events-none">
          {tabs.map((tab) => (
            <div key={`spacer-${tab.id}`} className="flex-1 flex justify-center">
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav-indicator-new"
                  className="h-9 w-9 bg-lime-400/20 backdrop-blur-md border border-lime-400/30 rounded-[16px] shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>
          ))}
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative z-10 flex-1 flex h-9 items-center justify-center transition-all duration-300 group"
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`h-[18px] w-[22px] transition-all duration-300 ${
                  isActive 
                    ? "text-lime-400 scale-100" 
                    : "text-white/25 group-hover:text-white/50"
                }`} />
                {tab.hasBadge && (
                  <div className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-black/20">
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
