/**
 * Link classification shared by every link component. Internal paths
 * route through Next's <Link>; anything else is a plain anchor, and
 * links to other sites open in a new tab.
 */

/** A link to another site. Opens in a new tab. */
export function isOffsite(href: string): boolean {
  return href.startsWith("http");
}

/** A link Next's <Link> can't route: another site, or a mailto. */
export function isExternal(href: string): boolean {
  return isOffsite(href) || href.startsWith("mailto:");
}

/** target and rel for an offsite link; nothing for any other. */
export function newTabProps(href: string): { target?: "_blank"; rel?: string } {
  return isOffsite(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
