"use client";

import { Button as ShadcnButton } from "@/components/ui/button";

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
  // Map our custom sizes to Shadcn sizes
  const sizeMap: Record<string, "default" | "sm" | "lg"> = {
    sm: "sm",
    md: "default",
    lg: "lg",
  };

  // Map our custom variants to Shadcn variants
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "ghost"> = {
    primary: "default",
    secondary: "secondary",
    danger: "destructive",
    ghost: "ghost",
  };

  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={className}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}
