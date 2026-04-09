import React from "react";
import { cn } from "./utils";

type Variant = "default" | "ghost";
type Size = "default" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center border border-slate-200 text-slate-700 transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" && "bg-white hover:bg-slate-50",
        variant === "ghost" && "bg-transparent hover:bg-slate-100",
        size === "default" && "rounded-2xl px-4 py-2",
        size === "icon" && "h-10 w-10 rounded-full",
        className,
      )}
      {...props}
    />
  );
}
