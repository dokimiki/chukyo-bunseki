import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
};

export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "#4ecdc4",
}) => {
  return (
    <div className={`spinner spinner-${size}`} style={{ color }}>
      <div className="spinner-circle"></div>
    </div>
  );
};
