"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const colors = {
  primary: "#D4A5A5",
  secondary: "#C9B1B1",
  danger: "#B85C5C",
  ghost: "transparent",
};

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

  const baseStyles = "rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseStyles} ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: variant === "ghost" ? "transparent" : colors[variant],
        color: variant === "ghost" ? "#3D2929" : "#FFFFFF",
        border: variant === "ghost" ? "1px solid #E8C4C4" : "none",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
