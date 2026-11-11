import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Prose from "@/components/ui/Prose";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders plain markdown (case studies) inside Prose. The same renderer
 * as MdxContent in markdown mode: no JSX, no components, so a stray "<"
 * or "{" in a case study stays text.
 */
export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <Prose className={className}>
      <MDXRemote
        source={children}
        options={{ mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } }}
      />
    </Prose>
  );
}
