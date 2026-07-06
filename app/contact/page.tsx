import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import SectionHeading from "@/components/composites/SectionHeading";
import GradientLink from "@/components/ui/GradientLink";
import Icon from "@/components/ui/Icon";
import Text from "@/components/ui/Text";
import PlaceholderImage from "@/components/ui/PlaceholderImage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Art Nikitin: email, LinkedIn, and GitHub.",
};

const channels = [
  {
    icon: "mail" as const,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    note: "The fastest way to reach me. I read everything.",
  },
  {
    icon: "linkedin" as const,
    label: "LinkedIn",
    value: "art-nikitin-dev",
    href: site.linkedin,
    note: "For introductions and professional context.",
  },
  {
    icon: "github" as const,
    label: "GitHub",
    value: "NeedToUpdate",
    href: site.github,
    note: "Code, experiments, and this site's source.",
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-[1fr_minmax(16rem,24rem)]">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="Contact"
            title="Tell me about the system you are wrestling with."
            description="Modernization work, architecture questions, speaking, or something that does not fit a category. Short messages are fine."
            asPageTitle
          />

          <ul className="mt-12 space-y-8">
            {channels.map((channel) => (
              <li key={channel.label} className="group flex items-start gap-4">
                <span className="mt-1 text-muted">
                  <Icon name={channel.icon} size={20} className="icon-glow" />
                </span>
                <div className="min-w-0">
                  <Text variant="small">{channel.label}</Text>
                  <GradientLink href={channel.href} className="text-lg">
                    {channel.value}
                  </GradientLink>
                  <Text variant="small" className="mt-1">
                    {channel.note}
                  </Text>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-3 border-t border-line/60 pt-8">
            <Icon name="location" size={16} className="text-muted" />
            <Text variant="small" as="span">
              {site.location}. Eastern time, usually responsive within a day.
            </Text>
          </div>
        </div>

        <div className="hidden lg:block">
          <PlaceholderImage label="Portrait" icon="systems" aspectClass="aspect-[4/5]" />
        </div>
      </div>
    </PageShell>
  );
}
