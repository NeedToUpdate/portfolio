import SocialIcon from "@/components/composites/SocialIcon";
import Text from "@/components/ui/Text";
import { site, socialChannels } from "@/lib/site";
import { newTabProps } from "@/lib/links";

export default function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div data-nosnippet className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-5 py-10 md:px-8 2xl:max-w-[90rem]">
        <Text variant="small" className="min-w-0">
          {site.name} · {site.location}
        </Text>
        <ul className="flex items-center gap-4">
          {/* Each icon doubles as a nebula-shape trigger: small, deliberate targets. */}
          {socialChannels.map((channel) => (
            <li key={channel.key}>
              <a
                href={channel.href}
                aria-label={channel.label}
                data-nebula-shape={channel.shape}
                className="block rounded-full"
                {...newTabProps(channel.href)}
              >
                <SocialIcon name={channel.key} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
