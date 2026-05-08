"use client";

import { colors } from "@/lib/theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantColors: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: "#B85C5C",
    ghost: "transparent",
  };

  const baseStyles = "rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseStyles} ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: variant === "ghost" ? "transparent" : variantColors[variant],
        color: variant === "ghost" ? colors.text : "#FFFFFF",
        border: variant === "ghost" ? `1px solid ${colors.border}` : "none",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
