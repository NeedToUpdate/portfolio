"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, site } from "@/lib/site";

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-base/85 backdrop-blur">
      {/* Narrow phones: the text and gaps shrink with the viewport
          (clamp) so everything holds one row; the sizes cap at text-sm
          from ~470px up. Wrapping stays as the last resort so nothing
          ever scrolls off-screen invisibly. */}
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-14 max-w-content flex-wrap items-center justify-between gap-x-4 px-5 py-2 md:gap-x-6 md:px-8"
      >
        <Link
          href="/"
          className="inline-flex min-h-6 shrink-0 items-center font-display text-[clamp(0.6875rem,3vw,0.875rem)] font-semibold tracking-tight text-ink hover:text-accent"
        >
          {site.name.split(" ").at(0)}
        </Link>
        <ul className="flex min-w-0 flex-wrap items-center gap-x-[clamp(0.625rem,2.6vw,1rem)] gap-y-1 md:gap-x-7">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-nebula-shape={item.shape}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-6 items-center text-[clamp(0.6875rem,3vw,0.875rem)] transition-colors ${
                    active ? "text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
