import type { MDXComponents } from "mdx/types";
import FloatImage from "./FloatImage";
import Note from "./Note";
import RequestPathExplorer from "./RequestPathExplorer";
import StarfieldDemo from "./StarfieldDemo";
import MinWidthDemo from "./MinWidthDemo";
import BrainRouterDemo from "./BrainRouterDemo";
import HomelabDiagram from "./HomelabDiagram";
import ShapeMorphButtons from "./ShapeMorphButtons";

/**
 * Components available inside every MDX insight without imports.
 * Add a component here and every insight can use it immediately.
 */
export const mdxComponents: MDXComponents = {
  FloatImage,
  Note,
  RequestPathExplorer,
  StarfieldDemo,
  MinWidthDemo,
  BrainRouterDemo,
  HomelabDiagram,
  ShapeMorphButtons,
};
