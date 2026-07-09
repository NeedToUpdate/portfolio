"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, site } from "@/lib/site";

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-base/85 backdrop-blur">
      {/* min-height + wrapping: on narrow phones the links flow to a
          second row instead of scrolling off-screen invisibly. */}
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-14 max-w-content flex-wrap items-center justify-between gap-x-6 px-5 py-2 md:px-8"
      >
        <Link
          href="/"
          className="shrink-0 font-display text-sm font-semibold tracking-tight text-ink hover:text-accent"
        >
          {site.name}
        </Link>
        <ul className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 md:gap-x-7">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm transition-colors ${
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
