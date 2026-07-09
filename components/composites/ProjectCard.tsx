import Image from "next/image";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import TagList from "./TagList";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-line/50 bg-surface transition-colors hover:border-line"
    >
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
    </a>
  );
}
