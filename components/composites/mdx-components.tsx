import type { MDXComponents } from "mdx/types";
import FloatImage from "./FloatImage";
import Note from "./Note";
import SuccessorPlayground from "./SuccessorPlayground";
import PeanoAdditionStepper from "./PeanoAdditionStepper";

/**
 * Components available inside every MDX insight without imports.
 * Add a component here and every insight can use it immediately.
 */
export const mdxComponents: MDXComponents = {
  FloatImage,
  Note,
  SuccessorPlayground,
  PeanoAdditionStepper,
};
