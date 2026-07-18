/**
 * Single source of truth for site identity.
 * Change the domain, name, or socials here and every page follows.
 */
export const site = {
  name: "Art Nikitin",
  // Actual job title: feeds structured data (jobTitle) and llms.txt,
  // where accuracy matters more than how it reads on a page.
  role: "Engineering Director & Hands-on Architect",
  // Public-facing headline: everywhere a title/preview is shown to a
  // reader (page title, OG/twitter cards, opengraph-image alt). Kept
  // separate from `role` so those surfaces can drop the job title.
  tagline: "Architecture & engineering leadership",
  domain: "artnikitin.dev",
  url: process.env.SITE_URL || "https://artnikitin.dev",
  email: "hello@artnikitin.dev",
  location: "Toronto, Canada",
  github: "https://github.com/NeedToUpdate",
  linkedin: "https://linkedin.com/in/art-nikitin-dev",
  description:
    "I design the systems enterprises run on and lead the teams that build them.",
} as const;

/**
 * Builds a mailto: link with an optional pre-filled subject and body.
 * encodeURIComponent (not URLSearchParams) so spaces become %20 and
 * newlines %0A, which every mail client decodes; the `+` that
 * URLSearchParams emits is left literal by some clients.
 */
export function mailtoUrl({
  subject,
  body,
}: { subject?: string; body?: string } = {}): string {
  const parts: string[] = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${site.email}${parts.length ? `?${parts.join("&")}` : ""}`;
}

export interface SocialChannel {
  key: "email" | "github" | "linkedin";
  label: string;
  /** Handle or address shown to the reader. */
  value: string;
  href: string;
  /** One line on when to use this channel. Shown on the contact page. */
  note: string;
  /** Nebula glyph the background condenses into while hovered. */
  shape: string;
}

/** Every social link on the site (footer, contact page) renders from this list. */
export const socialChannels: SocialChannel[] = [
  {
    key: "email",
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    note: "The fastest way to reach me. I read everything.",
    shape: "email",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    value: "art-nikitin-dev",
    href: site.linkedin,
    note: "For introductions and professional context.",
    shape: "linkedin",
  },
  {
    key: "github",
    label: "GitHub",
    value: "NeedToUpdate",
    href: site.github,
    note: "Code, experiments, and this site's source.",
    shape: "github",
  },
];

export interface NavItem {
  label: string;
  href: string;
  /** Nebula glyph used when the navigation item is hovered or focused. */
  shape: string;
}

export const navItems: NavItem[] = [
  { label: "Work", href: "/work", shape: "hex" },
  { label: "Insights", href: "/insights", shape: "article" },
  { label: "Projects", href: "/projects", shape: "branch" },
  { label: "About", href: "/about", shape: "profile" },
  { label: "Contact", href: "/contact", shape: "plane" },
];
