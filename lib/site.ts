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
