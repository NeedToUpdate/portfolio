"use client";

import "@/styles/globals.css";

/**
 * Last resort when the root layout itself fails. It replaces the whole
 * document, so it renders its own <html> and <body> and leans on
 * nothing but the global stylesheet.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-5 font-body">
        <main className="max-w-prose">
          <p className="font-mono text-sm text-accent">
            Error{error.digest ? ` · ${error.digest}` : ""}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            The site failed to load.
          </h1>
          <p className="mt-4 text-muted">Reload the page, or try again in a minute.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full border border-line px-4 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
