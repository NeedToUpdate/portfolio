import type { MDXComponents } from "mdx/types";
import FloatImage from "./FloatImage";
import Note from "./Note";
import RequestPathExplorer from "./RequestPathExplorer";
import StarfieldDemo from "./StarfieldDemo";
import MinWidthDemo from "./MinWidthDemo";
import BrainRouterDemo from "./BrainRouterDemo";
import HomelabDiagram from "./HomelabDiagram";
import ShapeMorphButtons from "./ShapeMorphButtons";
import AIWorkflowTimeline from "./AIWorkflowTimeline";
import TextLink from "@/components/ui/TextLink";

function MdxLink({ href = "", children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <TextLink href={href} nebulaShape={href.startsWith("mailto:") ? "email" : undefined}>
      {children}
    </TextLink>
  );
}

/**
 * Components available inside every MDX insight without imports.
 * Add a component here and every insight can use it immediately.
 */
export const mdxComponents: MDXComponents = {
  a: MdxLink,
  FloatImage,
  Note,
  RequestPathExplorer,
  StarfieldDemo,
  MinWidthDemo,
  BrainRouterDemo,
  HomelabDiagram,
  ShapeMorphButtons,
  AIWorkflowTimeline,
};
