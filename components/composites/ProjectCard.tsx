import Image from "next/image";
import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TagList from "./TagList";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // When a write-up exists it is the card's main destination; the
  // project url moves to the small link below. Otherwise the url is
  // the destination — some point at the write-up itself and get
  // internal client-side routing rather than a new tab, same rule
  // TextLink uses.
  const hasWriteup = Boolean(project.insightSlug);
  const external = project.url.startsWith("http");
  const isGithub = project.url.includes("github.com");

  const content = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line/40">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-raised">
            <span className="font-display text-4xl font-semibold text-accent/50">
              {project.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* The title is the card's small nebula trigger. */}
        <span data-nebula-shape={project.nebulaShape ?? "spark"} className="w-fit">
          <Heading size="small" className="transition-colors group-hover:text-accent">
            {project.title}
          </Heading>
        </span>
        <Text variant="small" className="flex-1">
          {project.description}
        </Text>
        <TagList tags={project.techs} limit={3} className="pt-1" />
      </div>
    </>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line/50 bg-surface transition-colors hover:border-line">
      {/* The card's main click target. The repo link below is a
          second, small, deliberate target, kept out of this anchor
          since anchors cannot nest. */}
      {hasWriteup ? (
        <Link href={`/insights/${project.insightSlug}`} className="group flex flex-1 flex-col">
          {content}
        </Link>
      ) : external ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-1 flex-col"
        >
          {content}
        </a>
      ) : (
        <Link href={project.url} className="group flex flex-1 flex-col">
          {content}
        </Link>
      )}
      {hasWriteup && external && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          data-nebula-shape={isGithub ? "github" : "spark"}
          className="border-t border-line/40 px-5 py-2.5 text-xs text-muted transition-colors hover:text-accent"
        >
          {isGithub ? "Check out the code →" : "Visit the project →"}
        </a>
      )}
    </div>
  );
}
