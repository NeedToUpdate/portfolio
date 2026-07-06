import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Prose from "@/components/ui/Prose";
import { mdxComponents } from "./mdx-components";

interface MdxContentProps {
  /** Raw MDX source, frontmatter already stripped. */
  source: string;
}

/** Server-side MDX renderer for blog posts. */
export default function MdxContent({ source }: MdxContentProps) {
  return (
    <Prose>
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </Prose>
  );
}
