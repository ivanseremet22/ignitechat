import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

type AppAvatarProps = {
  initials: string;
  accent: string;
  imageUrl?: string;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
};

export default function AppAvatar({
  initials,
  accent,
  imageUrl,
  className,
  fallbackClassName,
  imageClassName,
}: AppAvatarProps) {
  return (
    <Avatar className={className}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={initials}
          className={["h-full w-full object-cover", imageClassName].filter(Boolean).join(" ")}
        />
      ) : (
        <AvatarFallback className={[`bg-gradient-to-br ${accent}`, fallbackClassName].filter(Boolean).join(" ")}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
