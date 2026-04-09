import React from "react";
import { cn } from "./utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none transition",
        "focus:border-amber-400",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
