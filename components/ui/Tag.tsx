type TagVariant = "text" | "pill";

interface TagProps {
  label: string;
  variant?: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  text: "inline-block text-xs tracking-wide text-muted",
  pill: "inline-block rounded-full border border-line/70 px-3 py-1 text-xs tracking-wide text-muted",
};

export default function Tag({ label, variant = "text" }: TagProps) {
  return <span className={variantClasses[variant]}>{label}</span>;
}
