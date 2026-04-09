import React from "react";
import { cn } from "./utils";

type AvatarProps = React.HTMLAttributes<HTMLDivElement>;

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      className={cn("relative flex overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

type AvatarFallbackProps = React.HTMLAttributes<HTMLDivElement>;

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center text-sm font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
}
