import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import ProjectCard from "@/components/composites/ProjectCard";
import JsonLd from "@/components/ui/JsonLd";
import { getProjectsByEra } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Personal projects, hardware to AI builds",
  description:
    "Personal projects, past and present. Current work built with AI in the toolchain, and an archive of hardware, games, and tools built entirely by hand.",
  path: "/projects",
});

export default function ProjectsPage() {
  const postAi = getProjectsByEra("post-ai");
  const preAi = getProjectsByEra("pre-ai");

  return (
    <PageShell>
      {/* The heading block is left-aligned; the upper-right is open
          before the card grid begins. */}
      <NebulaBackground variant="mini" corner="top-right" miniShape="crab" color="frost" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Projects" }]} />

      <div className="mb-12">
        <SectionHeading
          eyebrow="Projects"
          title="I still have the itch to build."
          description="I lead teams for a living. Building is my hobby, and it keeps my technical judgment current. When a board discussion turns technical, I speak from recent hands-on work. These are the projects I build on weekends."
          asPageTitle
        />
      </div>
      {postAi.length > 0 && (
        <section aria-labelledby="projects-current" className="mb-20">
          <SectionHeading
            eyebrow="Built with AI"
            title="Current projects"
            description="Current work, built with AI in the toolchain."
            id="projects-current"
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
