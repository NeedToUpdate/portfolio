import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Prose from "@/components/ui/Prose";
import { mdxComponents } from "./mdx-components";

interface MdxContentProps {
  /** Raw MDX source, frontmatter already stripped. */
  source: string;
}

/** Server-side MDX renderer for insights. */
export default function MdxContent({ source }: MdxContentProps) {
  return (
    <Prose>
      <MDXRemote
        source={source}
        components={mdxComponents}
        // blockJS defaults to true in next-mdx-remote v6: a remark plugin
        // strips every JSX attribute whose value is an expression, so
        // width={3406} on a FloatImage silently vanishes and next/image
        // throws "missing required width". Our MDX is first-party content
        // from this repo, not user input, so that sandbox buys nothing and
        // costs us real props. blockDangerousJS stays on (its default), so
        // eval/Function/process and friends are still blocked.
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] }, blockJS: false }}
      />
    </Prose>
  );
}
