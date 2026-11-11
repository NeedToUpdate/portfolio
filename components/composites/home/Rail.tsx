import { ReactNode } from "react";

// Shared glass-card shell for the horizontal rails. A fixed width lets the
// next card peek, which is the whole "swipe me" signal.
export const railCard =
  "flex w-[82%] shrink-0 snap-start flex-col rounded-lg border border-white/10 bg-glass/60 p-4 shadow-2xl shadow-black/30 ring-1 ring-white/5";
// Horizontal rail: full-bleed to the screen edges, snap points, no scrollbar.
const rail =
  "mt-5 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scroll-px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface RailProps {
  children: ReactNode;
}

/** The sideways-swiped strip of cards on the mobile home page. */
export default function Rail({ children }: RailProps) {
  return <div className={rail}>{children}</div>;
}
