import Link from "next/link";

/**
 * The easter egg on the projects page: the word "pre-AI" is a door to
 * /legacy. It looks like the text around it, down to the text cursor.
 * Only a hover that lingers gives it away: the word pulls apart around
 * its hyphen and warms to the accent colour. The hyphen itself keeps
 * its length. Keyboard users get it on focus, without the wait.
 */
export default function PreAiDoor() {
  return (
    <Link
      href="/legacy"
      prefetch={false}
      aria-label="pre-AI: the legacy archive"
      data-nebula-shape="document"
      className="cursor-text rounded-sm transition-colors duration-500 hover:text-accent hover:delay-700 focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent/60"
    >
      pre
      <span
        aria-hidden
        className="inline-block transition-[margin] duration-500 [a:focus-visible>&]:mx-1.5 [a:hover>&]:mx-1.5 [a:hover>&]:delay-700"
      >
        -
      </span>
      AI
    </Link>
  );
}
