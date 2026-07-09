import type { Metadata } from "next";
import Image from "next/image";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import TextLink from "@/components/ui/TextLink";
import Icon, { IconName } from "@/components/ui/Icon";
import Text from "@/components/ui/Text";
import { site, socialChannels, SocialChannel } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Art Nikitin: email, LinkedIn, and GitHub.",
};

/** Channel data lives in lib/site.ts; only the icon choice is local. */
const channelIcons: Record<SocialChannel["key"], IconName> = {
  email: "mail",
  linkedin: "linkedin",
  github: "github",
};

export default function ContactPage() {
  return (
    <PageShell>
      {/* Channels fill the left column; the lower-right stays open
          below the portrait. */}
      <NebulaBackground variant="mini" corner="bottom-right" miniShape="crab" color="solar" />
      <div className="grid gap-12 lg:grid-cols-[1fr_minmax(16rem,24rem)]">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="Contact"
            title="Tell me about the system you are wrestling with."
            description="Modernization work, architecture questions, speaking, or something that does not fit a category. Short messages are fine."
            asPageTitle
          />

          <ul className="mt-12 space-y-8">
            {socialChannels.map((channel) => (
              <li key={channel.key} className="group flex items-start gap-4">
                <span className="mt-1 text-muted">
                  <Icon name={channelIcons[channel.key]} size={20} className="icon-glow" />
                </span>
                <div className="min-w-0">
                  <Text variant="small">{channel.label}</Text>
                  <TextLink
                    href={channel.href}
                    className="text-lg font-semibold"
                    nebulaShape={channel.shape}
                  >
                    {channel.value}
                  </TextLink>
                  <Text variant="small" className="mt-1">
                    {channel.note}
                  </Text>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 border-t border-line/60 pt-8">
            {/* w-fit keeps the nebula trigger the size of the line itself. */}
            <span data-nebula-shape="pin" className="flex w-fit items-center gap-3">
              <Icon name="location" size={16} className="text-muted" />
              <Text variant="small" as="span">
                {site.location}. Eastern time, usually responsive within a day.
              </Text>
            </span>
          </div>
        </div>

        <div className="relative hidden aspect-[4/5] w-full overflow-hidden rounded-xl border border-line/50 lg:block">
          <Image
            src="/images/portrait.webp"
            alt={site.name}
            fill
            sizes="24rem"
            className="object-cover"
          />
        </div>
      </div>
    </PageShell>
  );
}
