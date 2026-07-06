import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prose from "@/components/ui/Prose";

interface MarkdownProps {
  children: string;
  className?: string;
}

/** Renders plain markdown content (case studies, static copy) inside Prose. */
export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <Prose className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </Prose>
  );
}
