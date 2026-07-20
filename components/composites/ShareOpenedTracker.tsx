"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Landing counterpart to ShareButton. A shared link carries an opaque
 * ?s=<id> minted on the share_created event; when someone opens that link
 * we fire share_opened with the same id, which is the join key that ties
 * an open back to the share that produced it.
 *
 * Renders nothing. Shared links are external entry points, so this runs on
 * the initial document load — the one moment window.location still holds
 * the id. After recording we strip s from the address bar with
 * replaceState (no navigation, no history entry, scroll untouched) so the
 * id never gets re-shared, bookmarked, or double-counted on refresh.
 */
export default function ShareOpenedTracker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const shareId = url.searchParams.get("s");
    if (!shareId) return;

    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.capture("share_opened", {
        share_id: shareId,
        path: url.pathname,
      });
    }

    url.searchParams.delete("s");
    const scrubbed = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", scrubbed);
  }, []);

  return null;
}
