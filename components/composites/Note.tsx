import { ReactNode } from "react";

interface NoteProps {
  children: ReactNode;
}

/** A callout aside for MDX posts. */
export default function Note({ children }: NoteProps) {
  return (
    <aside className="my-6 rounded-r-lg border-l-2 border-accent/70 bg-surface px-5 py-4 text-[0.95rem] text-ink/90">
      {children}
    </aside>
  );
}
