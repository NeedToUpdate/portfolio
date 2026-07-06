import { ReactNode } from "react";
import Panel from "@/components/ui/Panel";

interface InteractiveFigureProps {
  children: ReactNode;
  caption: string;
}

/** The frame every interactive element in a post sits in. */
export default function InteractiveFigure({ children, caption }: InteractiveFigureProps) {
  return (
    <figure className="my-8">
      <Panel>{children}</Panel>
      <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
