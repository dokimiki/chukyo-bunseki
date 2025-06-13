// UI コンポーネントライブラリ - 型定義のみ
export interface ButtonProps {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}
