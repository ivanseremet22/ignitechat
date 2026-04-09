import React from "react";
import { cn } from "./utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition",
      "focus:border-amber-400",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
