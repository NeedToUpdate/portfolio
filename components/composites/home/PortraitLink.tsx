import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

interface PortraitLinkProps {
  /** Frame shape and size; the image always fills it. */
  className: string;
  sizes: string;
}

/** Art's portrait, linking to the About page. */
export default function PortraitLink({ className, sizes }: PortraitLinkProps) {
  return (
    <Link href="/about" aria-label="About Art" className={className}>
      <Image
        src="/images/portrait.webp"
        alt={site.name}
        width={800}
        height={1000}
        loading="eager"
        sizes={sizes}
        className="h-full w-full object-cover"
      />
    </Link>
  );
}
