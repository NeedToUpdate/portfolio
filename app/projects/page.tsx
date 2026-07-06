import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import SectionHeading from "@/components/composites/SectionHeading";
import ProjectCard from "@/components/composites/ProjectCard";
import { getProjectsByEra } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Personal projects, past and present. Current work built with AI in the toolchain, and an archive of hardware, games, and tools built entirely by hand.",
};

export default function ProjectsPage() {
  const postAi = getProjectsByEra("post-ai");
  const preAi = getProjectsByEra("pre-ai");

  return (
    <PageShell>
      {postAi.length > 0 && (
        <section aria-labelledby="projects-current" className="mb-20">
          <SectionHeading
            eyebrow="Built with AI"
            title="Current projects"
            description="Current work, built with AI in the toolchain."
            id="projects-current"
            asPageTitle
          />
          <div className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
            {postAi.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="projects-archive">
        <SectionHeading
          eyebrow="The pre-AI archive"
          title="Things I built by hand"
          description="Everything below predates AI-assisted development. A CPU on breadboards, a neural network library from scratch, games, robots, and tools. They stay here because they show how I learn: pick something hard, build it, ship it."
          id="projects-archive"
        />
        <div className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
          {preAi.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
