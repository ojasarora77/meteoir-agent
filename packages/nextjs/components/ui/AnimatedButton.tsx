"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  children: ReactNode;
}

export const AnimatedButton = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  isLoading = false,
  children,
  className = "",
  ...props
}: AnimatedButtonProps) => {
  const baseClasses = "btn transition-all duration-300 hover:scale-105 active:scale-95";

  const variantClasses = {
    primary: "btn-primary shadow-lg hover:shadow-xl",
    secondary: "btn-secondary",
    outline: "btn-outline hover:bg-primary hover:border-primary",
    ghost: "btn-ghost hover:bg-base-200",
  };

  const sizeClasses = {
    sm: "btn-sm px-4 py-2",
    md: "btn-md px-6 py-3",
    lg: "btn-lg px-8 py-4",
  };

  const iconClasses = "w-5 h-5";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}

      {icon && iconPosition === "left" && !isLoading && <span className={`${iconClasses} mr-2`}>{icon}</span>}

      {children}

      {icon && iconPosition === "right" && !isLoading && <span className={`${iconClasses} ml-2`}>{icon}</span>}
    </button>
  );
};

export default AnimatedButton;
