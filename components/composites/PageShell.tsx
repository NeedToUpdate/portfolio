import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  /** Constrain content to reading width instead of full content width. */
  narrow?: boolean;
}

/** Consistent page container: width, gutters, and vertical rhythm. */
export default function PageShell({ children, narrow = false }: PageShellProps) {
  return (
    <div
      className={`mx-auto w-full px-5 py-8 md:px-8 md:py-20 ${
        narrow ? "max-w-prose" : "max-w-content 2xl:max-w-[90rem]"
      }`}
    >
      {children}
    </div>
  );
}
