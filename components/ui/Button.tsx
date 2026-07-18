import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "solid" | "outline" | "outline-strong";
export type ButtonShape = "rounded" | "pill";

const variantClasses: Record<ButtonVariant, string> = {
  solid:
    "bg-accent text-accent-ink font-semibold transition-opacity hover:opacity-90 disabled:opacity-40",
  outline:
    "border border-line text-muted transition-colors hover:border-accent/60 hover:text-ink disabled:opacity-40",
  // Reads as clearly interactive rather than disabled: full-ink label, and
  // both border and text move to accent on hover.
  "outline-strong":
    "border border-line text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40",
};

const shapeClasses: Record<ButtonShape, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

/** The class string shared by Button and ButtonLink, so an anchor styled as
 *  a button stays visually identical to the real thing. */
export function buttonClasses(
  variant: ButtonVariant = "solid",
  shape: ButtonShape = "rounded",
  className = "",
): string {
  return `px-4 py-1.5 text-sm ${variantClasses[variant]} ${shapeClasses[shape]} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  shape?: ButtonShape;
}

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
    <button type={type} className={buttonClasses(variant, shape, className)} {...rest}>
      {children}
    </button>
  );
}
