import type { Metadata } from "next";
import PageShell from "@/components/composites/PageShell";
import NebulaBackground from "@/components/composites/NebulaBackground";
import SectionHeading from "@/components/composites/SectionHeading";
import Breadcrumbs from "@/components/composites/Breadcrumbs";
import ProjectCard from "@/components/composites/ProjectCard";
import PreAiDoor from "@/components/composites/PreAiDoor";
import JsonLd from "@/components/ui/JsonLd";
import { getPageCopy, getProjectsByEra, sectionCopy } from "@/lib/content";
import { pageMetadata, breadcrumbSchema } from "@/lib/seo";

const copy = getPageCopy("projects");

export const metadata: Metadata = pageMetadata({
  title: copy.seoTitle,
  description: copy.seoDescription,
  path: "/projects",
});

export default function ProjectsPage() {
  const postAi = getProjectsByEra("post-ai");
  const preAi = getProjectsByEra("pre-ai");
  const current = sectionCopy(copy, "current");
  const archive = sectionCopy(copy, "archive");

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
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          asPageTitle
        />
      </div>
      {postAi.length > 0 && (
        <section aria-labelledby="projects-current" className="mb-20">
          <SectionHeading
            eyebrow={current.eyebrow}
            title={current.title}
            description={current.description}
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
          eyebrow={
            <span>
              The <PreAiDoor /> archive
            </span>
          }
          title={archive.title}
          description={archive.description}
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
