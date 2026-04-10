import React from "react";
import { cn } from "./utils";

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
