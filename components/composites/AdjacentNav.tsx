import Image from "next/image";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon, { categoryIcon } from "@/components/ui/Icon";

interface AdjacentLink {
  href: string;
  title: string;
  /** Used by the quiet "previous" step-back link. */
  hint?: string;
  /** Recommendations carry their kind so insights (accent) read apart from
   *  case studies (neutral + a category icon). */
  kind?: "Insight" | "Case study";
  /** Case-study category, for the type icon. */
  category?: string;
  description?: string;
  image?: string;
}

interface AdjacentNavProps {
  previous?: AdjacentLink;
  recommendations?: AdjacentLink[];
}

/** An editorial recommendation rail plus a quieter way to step backward.
 *  Insights and case studies get the same grey-vs-gold split as the home
 *  page: insights are accent-led; case studies are neutral with a type icon. */
export default function AdjacentNav({ previous, recommendations = [] }: AdjacentNavProps) {
  if (!previous && recommendations.length === 0) return null;
  const [featured, ...more] = recommendations;
  const featuredIsCase = featured?.kind === "Case study";

  return (
    <nav aria-label="Keep exploring" className="mt-16 border-t border-line/60 pt-9">
      <div data-nosnippet>
        <Eyebrow>Keep exploring</Eyebrow>

        {featured && (
          <Link
            href={featured.href}
            className={`group mt-4 grid overflow-hidden rounded-2xl border border-line/70 bg-panel/45 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:grid-cols-[minmax(0,1fr)_13rem] ${
              featuredIsCase
                ? "hover:border-line hover:bg-panel/65"
                : "hover:border-accent/50 hover:bg-panel/70"
            }`}
          >
            <span className="flex min-w-0 flex-col justify-center p-6 sm:p-8">
              <span
                className={`inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  featuredIsCase ? "text-muted" : "text-accent"
                }`}
              >
                {featuredIsCase && (
                  <Icon
                    name={categoryIcon(featured.category ?? "systems")}
                    size={14}
                  />
                )}
                {featured.kind ?? featured.hint}
              </span>
              <span className="mt-3 block font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
                {featured.title}
              </span>
              {featured.description && (
                <span className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                  {featured.description}
                </span>
              )}
              <span
                className={`mt-5 inline-flex items-center gap-2 text-sm font-medium ${
                  featuredIsCase ? "text-ink" : "text-accent"
                }`}
              >
                {featuredIsCase ? "Read the case study" : "Read the write-up"}
                <span
                  aria-hidden
                  className={`transition-transform group-hover:translate-x-1 ${
                    featuredIsCase ? "text-accent" : ""
                  }`}
                >
                  →
                </span>
              </span>
            </span>

            {/* On mobile the image leads as a top banner (order-first); on
                desktop it sits in the right column. */}
            <span className="relative order-first min-h-40 overflow-hidden border-b border-line/60 bg-surface sm:order-0 sm:min-h-full sm:border-b-0 sm:border-l">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(min-width: 640px) 208px, 100vw"
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.35),transparent_35%),radial-gradient(circle_at_70%_65%,rgba(167,139,250,0.3),transparent_40%)] transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-panel/35 to-transparent sm:bg-gradient-to-l"
              />
            </span>
          </Link>
        )}

        {more.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {more.map((item) => {
              const isCase = item.kind === "Case study";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group grid min-h-32 grid-cols-1 overflow-hidden rounded-xl border border-line/60 bg-panel/30 transition duration-300 hover:-translate-y-0.5 hover:bg-panel/60 sm:grid-cols-[7rem_minmax(0,1fr)] ${
                    isCase ? "hover:border-line" : "hover:border-accent/40"
                  }`}
                >
                  {/* Thumbnails crop the detailed diagrams into an unreadable
                      sliver at 7rem, so drop them on mobile for clean text
                      rows — same as the home page's mobile cards. */}
                  <span className="relative hidden overflow-hidden border-r border-line/60 bg-surface sm:block">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="112px"
                        className="object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(96,165,250,0.32),transparent_38%),radial-gradient(circle_at_70%_70%,rgba(167,139,250,0.28),transparent_42%)]"
                      />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col justify-center p-4">
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${
                        isCase ? "text-muted" : "text-accent"
                      }`}
                    >
                      {isCase && (
                        <Icon
                          name={categoryIcon(item.category ?? "systems")}
                          size={12}
                        />
                      )}
                      {item.kind}
                    </span>
                    <span className="mt-2 line-clamp-3 font-display text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="mt-2 text-xs text-muted">
                      {isCase ? "Read the case study" : "Read the write-up"} →
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {previous && (
          <Link
            href={previous.href}
            className="group mt-5 inline-flex max-w-full items-center gap-3 text-sm text-muted transition-colors hover:text-ink"
          >
            <span
              aria-hidden
              className="text-accent transition-transform group-hover:-translate-x-1"
            >
              ←
            </span>
            <span className="shrink-0">{previous.hint}</span>
            <span aria-hidden className="h-px w-6 shrink-0 bg-line" />
            <span className="truncate font-medium text-ink">{previous.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
