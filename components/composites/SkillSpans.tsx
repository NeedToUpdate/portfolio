import { Skill, SkillDomain } from "@/lib/types";

interface SkillSpansProps {
  domains: SkillDomain[];
  className?: string;
}

const START_YEAR = 2014;
// Half a year past the current year so this year's bars have length.
const END_YEAR = 2026.5;
// Minor ticks only render at sm+; phones get every other year.
const TICKS = [
  { year: 2014, minor: false },
  { year: 2016, minor: true },
  { year: 2018, minor: false },
  { year: 2020, minor: true },
  { year: 2022, minor: false },
  { year: 2024, minor: true },
];

/**
 * Chart bar/dot color per domain slug, in content/skills/*.md order.
 * Darker steps of the site's flair hues, validated for the dark
 * surface (#080a10): OKLCH lightness band, chroma floor, adjacent-pair
 * CVD >= 12, and 3:1 contrast all pass. Keep color on the bar only;
 * text stays in text tokens. The nebula glyph itself is content
 * (domain.nebulaShape), not a design decision, so it lives in the CMS.
 */
const DOMAIN_COLOR: Record<string, string> = {
  ai: "#8f5fd6",
  cloud: "#5b87c9",
  data: "#b8893a",
  software: "#1ba4b0",
  architecture: "#c05f8f",
};

const pct = (year: number) => ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;

interface Row {
  skill: Skill;
  domain: SkillDomain;
}

/** Newest first: the top of the chart is the current wave, the bottom
 *  is the foundation. Same-year rows group by domain so color runs. */
function buildRows(domains: SkillDomain[]): Row[] {
  const domainIndex = new Map(domains.map((d, i) => [d.slug, i]));
  return domains
    .flatMap((domain) => domain.skills.map((skill) => ({ skill, domain })))
    .sort(
      (a, b) =>
        b.skill.since - a.skill.since ||
        (domainIndex.get(a.domain.slug) ?? 0) - (domainIndex.get(b.domain.slug) ?? 0) ||
        a.skill.name.localeCompare(b.skill.name)
    );
}

/**
 * Every skill as a span from the year it entered real work to now.
 * Reads top-down as a story: the recent AI wave stacked over a
 * decade-old foundation. Hover a row for the detail line.
 */
export default function SkillSpans({ domains, className = "" }: SkillSpansProps) {
  const rows = buildRows(domains);

  return (
    <figure className={className}>
      {/* Legend: identity also lives in each row's tooltip, so color is
          never alone. Each entry doubles as a small nebula trigger. */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {domains.map((domain) => (
          <span
            key={domain.slug}
            data-nebula-shape={domain.nebulaShape}
            className="flex items-center gap-2 text-xs text-muted"
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLOR[domain.slug] }}
            />
            {domain.title}
          </span>
        ))}
      </div>

      <div className="relative mt-6">
        {/* Year gridlines, aligned to the track column (label + gap). */}
        <div aria-hidden className="absolute inset-y-0 left-[9.25rem] right-0 sm:left-[10.25rem]">
          {TICKS.map((tick) => (
            <span
              key={tick.year}
              className={`absolute inset-y-0 w-px bg-line/40 ${tick.minor ? "hidden sm:block" : ""}`}
              style={{ left: `${pct(tick.year)}%` }}
            />
          ))}
        </div>

        {/* Axis row. */}
        <div aria-hidden className="flex items-center gap-3 pb-2">
          <span className="w-[8.5rem] shrink-0 sm:w-[9.5rem]" />
          <div className="relative h-4 min-w-0 flex-1 text-[11px] tabular-nums text-muted">
            {TICKS.map((tick) => (
              <span
                key={tick.year}
                className={`absolute -translate-x-1/2 ${tick.minor ? "hidden sm:block" : ""}`}
                style={{ left: `${pct(tick.year)}%` }}
              >
                {tick.year}
              </span>
            ))}
            <span className="absolute right-0">now</span>
          </div>
        </div>

        <div className="space-y-0.5">
          {rows.map(({ skill, domain }) => (
            <div
              key={`${domain.slug}-${skill.name}`}
              className="group relative flex items-center gap-3"
            >
              {/* Sized to fit the longest skill name in full; never truncates. */}
              <span className="w-[8.5rem] shrink-0 text-right text-[11px] leading-5 text-muted transition-colors group-hover:text-ink sm:w-[9.5rem] sm:text-xs">
                {skill.name}
                {/* Screen readers get the data without the hover layer. */}
                <span className="sr-only">
                  , {domain.title}, since {skill.since}
                  {skill.context ? `, ${skill.context}` : ""}
                </span>
              </span>
              <div className="relative h-5 min-w-0 flex-1">
                <span
                  aria-hidden
                  className="absolute right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ left: `${pct(skill.since)}%`, backgroundColor: DOMAIN_COLOR[domain.slug] }}
                />
                {/* Hover detail card. Anchored to the track's left edge and
                    allowed to wrap, so it can never widen the page. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-6 left-0 z-10 hidden max-w-full rounded-md border border-line/70 bg-surface px-3 py-1.5 shadow-lg shadow-black/40 group-hover:block"
                >
                  <p className="text-xs font-semibold text-ink">
                    {skill.name}
                    <span className="ml-2 font-normal text-muted">since {skill.since}</span>
                  </p>
                  <p className="text-[11px] text-muted">{skill.context ?? domain.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-muted">
        Every bar runs from first real use to today. Nothing on this chart is retired.
      </figcaption>
    </figure>
  );
}
