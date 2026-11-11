import Link from "next/link";
import Heading from "@/components/ui/Heading";
import { railCard } from "./Rail";

interface RailEndCardProps {
  href: string;
  title: string;
  nebulaShape: string;
}

/** The trailing "see all" card that closes a mobile rail. */
export default function RailEndCard({ href, title, nebulaShape }: RailEndCardProps) {
  return (
    <Link
      href={href}
      className={`${railCard} items-start justify-center !bg-glass/40`}
    >
      <Heading size="item">{title}</Heading>
      <span
        data-nebula-shape={nebulaShape}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent"
      >
        Open the archive <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
