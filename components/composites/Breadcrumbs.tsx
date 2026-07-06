import TextLink from "@/components/ui/TextLink";

interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

/** Page breadcrumb trail. The last item is the current page and truncates. */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-sm text-muted">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.label} className={`flex min-w-0 items-center gap-2 ${last ? "" : "shrink-0"}`}>
            {item.href && !last ? (
              <TextLink href={item.href} variant="quiet">
                {item.label}
              </TextLink>
            ) : (
              <span className="min-w-0 truncate text-ink">{item.label}</span>
            )}
            {!last && <span aria-hidden>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
