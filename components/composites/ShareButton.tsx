"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

interface ShareButtonProps {
  /** Content title, used for the native share sheet and email subject. */
  title: string;
  /** Canonical path, e.g. "/insights/ziggy". The share id is appended to it. */
  path: string;
  /** Which collection this is, recorded on the share event. */
  contentType: "insight" | "case-study";
  className?: string;
}

const ID_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Short, URL-safe, opaque share id, minted fresh per share. It carries
 * no meaning on its own: the sharer, channel, and content are recorded on
 * the share_created event, and the id is only the join key that ties that
 * event to the pageviews the shared link later produces. ~10 base62 chars
 * is 62^10 (about 8e17) values, far past any collision concern here.
 */
function makeShareId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i += 1) {
    id += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return id;
}

type Channel = "native" | "copy" | "linkedin" | "email";

export default function ShareButton({
  title,
  path,
  contentType,
  className = "mt-12",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // navigator.share is undefined on the server and on most desktops, so
  // decide after mount to keep the server and first client render equal.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // A fresh id per click: every share is its own attributable event. The
  // origin comes from the live page, so dev and staging shares point at
  // their own host, and the canonical path drops any existing query string.
  function mint(): { id: string; url: string } {
    const id = makeShareId();
    return { id, url: `${window.location.origin}${path}?s=${id}` };
  }

  function record(channel: Channel, id: string) {
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      // send_instantly bypasses PostHog's batch queue. Copy-link on mobile
      // doesn't navigate, so the user taps it and immediately switches apps
      // to paste — freezing the page before the batch flushes (and iOS
      // doesn't reliably fire pagehide on app-switch), which silently drops
      // the queued event. The other channels navigate away and flush on the
      // way out, so this only bit copy. Ship it on the tap, every channel.
      posthog.capture(
        "share_created",
        {
          share_id: id,
          channel,
          content_type: contentType,
          path,
        },
        { send_instantly: true },
      );
    }
  }

  async function onNative() {
    const { id, url } = mint();
    record("native", id);
    try {
      await navigator.share({ title, url });
    } catch {
      // The user dismissed the share sheet; nothing to do.
    }
  }

  async function onCopy() {
    const { id, url } = mint();
    record("copy", id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission); the
      // event still fired, so attribution holds even when the copy fails.
    }
  }

  function onLinkedIn() {
    const { id, url } = mint();
    record("linkedin", id);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function onEmail() {
    const { id, url } = mint();
    record("email", id);
    const body = `Thought you'd find this useful:\n\n${title}\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}`;
  }

  // On mobile the buttons form a clean two-column grid: full-width cells with
  // comfortable tap targets, so nothing wraps into an orphaned, misaligned row
  // against the busy background. From sm up they flow back to the inline pill
  // row. The shared classes keep every button consistent across both layouts.
  const buttonClass =
    "inline-flex w-full items-center justify-center gap-2 py-2 sm:w-auto sm:justify-start sm:py-1.5";

  return (
    <section data-nosnippet aria-label="Share this page" className={className}>
      <span className="mb-3 block text-sm text-muted">Share this</span>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {canNativeShare && (
          <Button
            variant="outline-strong"
            shape="pill"
            onClick={onNative}
            data-nebula-shape="nodes"
            className={buttonClass}
          >
            <Icon name="share" size={15} />
            Share
          </Button>
        )}

        <Button
          variant="outline-strong"
          shape="pill"
          onClick={onCopy}
          data-nebula-shape="link"
          className={buttonClass}
          aria-label={copied ? "Link copied" : "Copy link"}
        >
          <Icon name={copied ? "check" : "link"} size={15} />
          {copied ? "Copied" : "Copy link"}
        </Button>

        <Button
          variant="outline-strong"
          shape="pill"
          onClick={onLinkedIn}
          data-nebula-shape="linkedin"
          className={buttonClass}
        >
          <Icon name="linkedin" size={15} />
          LinkedIn
        </Button>

        <Button
          variant="outline-strong"
          shape="pill"
          onClick={onEmail}
          data-nebula-shape="email"
          className={buttonClass}
        >
          <Icon name="mail" size={15} />
          Email
        </Button>
      </div>
    </section>
  );
}
