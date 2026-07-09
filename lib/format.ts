/** Formats an ISO date string as "July 5, 2026". */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Splits markdown at the first line matching a heading exactly, so a
 * page can slot an element between sections (e.g. the architecture
 * exhibit between "The solution" and "The result"). If the heading is
 * missing, everything lands in "before".
 */
export function splitAtHeading(markdown: string, heading: string): { before: string; after: string } {
  const lines = markdown.split("\n");
  const index = lines.findIndex((line) => line.trim() === heading);
  if (index === -1) return { before: markdown, after: "" };
  return {
    before: lines.slice(0, index).join("\n").trim(),
    after: lines.slice(index).join("\n").trim(),
  };
}
