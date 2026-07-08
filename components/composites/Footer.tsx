import SocialIcon from "@/components/composites/SocialIcon";
import Text from "@/components/ui/Text";
import { site } from "@/lib/site";

// Each icon doubles as a nebula-shape trigger: small, deliberate targets.
const socials = [
  { icon: "email" as const, label: "Email", href: `mailto:${site.email}`, shape: "plane" },
  { icon: "github" as const, label: "GitHub", href: site.github, shape: "hex" },
  { icon: "linkedin" as const, label: "LinkedIn", href: site.linkedin, shape: "spark" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-5 py-10 md:px-8">
        <Text variant="small" className="min-w-0">
          {site.name} · {site.location}
        </Text>
        <ul className="flex items-center gap-4">
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                aria-label={social.label}
                data-nebula-shape={social.shape}
                className="block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                {...(social.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <SocialIcon name={social.icon} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
