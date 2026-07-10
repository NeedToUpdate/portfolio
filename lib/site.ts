/**
 * Single source of truth for site identity.
 * Change the domain, name, or socials here and every page follows.
 */
export const site = {
  name: "Art Nikitin",
  role: "Engineering Director & Hands-on Architect",
  domain: "artnikitin.dev",
  url: process.env.SITE_URL || "https://artnikitin.dev",
  email: "hello@artnikitin.dev",
  location: "Toronto, Canada",
  github: "https://github.com/NeedToUpdate",
  linkedin: "https://linkedin.com/in/art-nikitin-dev",
  description:
    "Engineering director and hands-on architect. I design the systems enterprises run on and lead the teams that build them.",
} as const;

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
}

export const navItems: NavItem[] = [
  { label: "Work", href: "/work" },
  { label: "Insights", href: "/insights" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
