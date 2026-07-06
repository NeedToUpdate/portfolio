import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import { PostMeta } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface PostListItemProps {
  post: PostMeta;
}

/** One entry in a writing list: date, title, one-line description. */
export default function PostListItem({ post }: PostListItemProps) {
  return (
    <Link href={`/writing/${post.slug}`} className="group block py-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <time dateTime={post.date} className="shrink-0 text-sm tabular-nums text-muted sm:w-32">
          {formatDate(post.date)}
        </time>
        <div className="min-w-0">
          <Heading size="item" className="transition-colors group-hover:text-accent">
            {post.title}
          </Heading>
          <Text variant="muted" className="mt-1.5 max-w-prose">
            {post.description}
          </Text>
        </div>
      </div>
    </Link>
  );
}
