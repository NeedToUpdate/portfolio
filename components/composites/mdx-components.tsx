import type { MDXComponents } from "mdx/types";
import Note from "./Note";
import Card from "./Card";
import RequestPathExplorer from "./RequestPathExplorer";
import StarfieldDemo from "./StarfieldDemo";
import MinWidthDemo from "./MinWidthDemo";
import BrainRouterDemo from "./BrainRouterDemo";
import HomelabDiagram from "./HomelabDiagram";
import ShapeMorphButtons from "./ShapeMorphButtons";
import AIWorkflowTimeline from "./AIWorkflowTimeline";
import HumanReviewLab from "./HumanReviewLab";
import TeamGame from "./TeamGame";
import ReleaseTrain from "./ReleaseTrain";
import VideoFigure from "./VideoFigure";
import MediaRow from "./MediaRow";
import ProjectLink from "./ProjectLink";
import NowWithAI from "./NowWithAI";
import TextLink from "@/components/ui/TextLink";

function MdxLink({ href = "", children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <TextLink href={href} nebulaShape={href.startsWith("mailto:") ? "email" : undefined}>
      {children}
    </TextLink>
  );
}

/**
 * Components available inside every MDX article without imports.
 * Add a component here and every article can use it immediately; the
 * type below then requires its markdown form in lib/agent-markdown.ts.
 */
export const mdxComponents = {
  a: MdxLink,
  Note,
  Card,
  RequestPathExplorer,
  StarfieldDemo,
  MinWidthDemo,
  BrainRouterDemo,
  HomelabDiagram,
  ShapeMorphButtons,
  AIWorkflowTimeline,
  HumanReviewLab,
  TeamGame,
  ReleaseTrain,
  VideoFigure,
  MediaRow,
  ProjectLink,
  NowWithAI,
} satisfies MDXComponents;

/** Every component an MDX article can use by name. */
export type MdxComponentName = Exclude<keyof typeof mdxComponents, "a">;
