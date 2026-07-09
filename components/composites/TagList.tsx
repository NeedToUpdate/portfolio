import Tag from "@/components/ui/Tag";

type TagListVariant = "text" | "pill";

interface TagListProps {
  tags: string[];
  /** Cap how many render; omit for all. */
  limit?: number;
  variant?: TagListVariant;
  className?: string;
}

const gapClasses: Record<TagListVariant, string> = {
  text: "gap-x-3 gap-y-1",
  pill: "gap-2",
};

/** A wrapping row of tags. */
export default function TagList({ tags, limit, variant = "text", className = "" }: TagListProps) {
  const shown = limit ? tags.slice(0, limit) : tags;
  return (
    <div className={`flex flex-wrap ${gapClasses[variant]} ${className}`}>
      {shown.map((tag) => (
        <Tag key={tag} label={tag} variant={variant} />
      ))}
    </div>
  );
}
