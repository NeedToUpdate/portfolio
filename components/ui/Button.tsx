import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "solid" | "outline";
type ButtonShape = "rounded" | "pill";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  shape?: ButtonShape;
}

const variantClasses: Record<ButtonVariant, string> = {
  solid:
    "bg-accent text-accent-ink font-semibold transition-opacity hover:opacity-90 disabled:opacity-40",
  outline:
    "border border-line text-muted transition-colors hover:border-accent/60 hover:text-ink disabled:opacity-40",
};

const shapeClasses: Record<ButtonShape, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

/** The button. Every button on the site is one of these. */
export default function Button({
  variant = "solid",
  shape = "rounded",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`px-4 py-1.5 text-sm ${variantClasses[variant]} ${shapeClasses[shape]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
