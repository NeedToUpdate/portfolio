import { getSkillMarkdown } from "@/lib/agent-skills";

/** The SKILL.md artifact listed in /.well-known/agent-skills/index.json. */
export function GET() {
  return new Response(getSkillMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
