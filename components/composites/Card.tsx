import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

/** A bordered summary card for MDX insights. */
export default function Card({ children }: CardProps) {
  return (
    <div className="my-8 rounded-xl border border-line bg-surface px-6 py-5 sm:px-8 sm:py-6">
      {children}
    </div>
  );
}
