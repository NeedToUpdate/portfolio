interface TagProps {
  label: string;
}

export default function Tag({ label }: TagProps) {
  return <span className="inline-block text-xs tracking-wide text-muted">{label}</span>;
}
