import Tag from "@/components/ui/Tag";

interface TagListProps {
  tags: string[];
  /** Cap how many render; omit for all. */
  limit?: number;
  className?: string;
}

/** A wrapping row of tags. */
export default function TagList({ tags, limit, className = "" }: TagListProps) {
  const shown = limit ? tags.slice(0, limit) : tags;
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`}>
      {shown.map((tag) => (
        <Tag key={tag} label={tag} />
      ))}
    </div>
  );
}
