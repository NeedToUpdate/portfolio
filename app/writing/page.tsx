import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import SectionHeading from "@/components/composites/SectionHeading";
import DividedList from "@/components/composites/DividedList";
import PostListItem from "@/components/composites/PostListItem";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays and deep dives on systems, architecture, and engineering decisions. Some of them interactive.",
};

export default function WritingPage() {
  const posts = getPosts();

  return (
    <PageShell>
      <SectionHeading
        eyebrow="Writing"
        title="Notes on systems and decisions"
        description="Essays on systems, architecture, and decisions. Some include working models."
        asPageTitle
      />
      <DividedList borderTop className="mt-10">
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </DividedList>
    </PageShell>
  );
}
