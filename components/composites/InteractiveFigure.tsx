import { ReactNode } from "react";
import Panel from "@/components/ui/Panel";
import Icon from "@/components/ui/Icon";

interface InteractiveFigureProps {
  children: ReactNode;
  caption: string;
  /**
   * The action the reader takes, e.g. "click a node". Keep it to two or
   * three words: it renders on one line inside a fixed tab, so a long value
   * would push the tab out of shape. Optional; every interactive figure
   * gets the tab automatically through this wrapper, so there is nothing to
   * remember per demo. Pass this only to replace the generic invite.
   */
  prompt?: string;
}

/**
 * The frame every interactive element in an insight sits in. It draws its
 * own tab in the button's accent colour, so a live figure reads as
 * "operable" at a glance and never as a screenshot. The tab hangs off the
 * top-right corner on narrow screens and out into the right margin on wide
 * ones, where there is room. Wrapping a demo in it is all any component
 * has to do.
 */
export default function InteractiveFigure({
  children,
  caption,
  prompt = "try it",
}: InteractiveFigureProps) {
  return (
    <figure className="relative my-8">
      <span className="absolute -top-5 right-4 z-10 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-accent-ink shadow-md lg:-top-3 lg:left-full lg:right-auto lg:ml-4">
        <Icon name="pointer" size={16} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wider text-accent-ink/60">
            Interactive
          </span>
          {/* max-w + truncate is a backstop: prompts should be short, but a
              long one degrades to an ellipsis instead of breaking layout. */}
          <span className="max-w-44 truncate text-sm font-semibold">{prompt}</span>
        </span>
      </span>
      {/* Extra top padding on mobile clears the corner tab, which sits in
          the right margin (not over the card) once there is room at lg. */}
      <Panel className="pt-9 lg:pt-5">{children}</Panel>
      <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
