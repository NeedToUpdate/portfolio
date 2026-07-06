import Icon from "@/components/ui/Icon";
import Text from "@/components/ui/Text";
import { site } from "@/lib/site";

const socials = [
  { icon: "mail" as const, label: "Email", href: `mailto:${site.email}` },
  { icon: "github" as const, label: "GitHub", href: site.github },
  { icon: "linkedin" as const, label: "LinkedIn", href: site.linkedin },
];

export default function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-5 py-10 md:px-8">
        <Text variant="small" className="min-w-0">
          {site.name} · {site.location}
        </Text>
        <ul className="flex items-center gap-5">
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                aria-label={social.label}
                className="text-muted transition-colors hover:text-ink"
                {...(social.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon name={social.icon} size={18} className="icon-glow" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
