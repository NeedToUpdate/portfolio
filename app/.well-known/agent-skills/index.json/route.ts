import { getSkillDigest, skillDescription, skillName } from "@/lib/agent-skills";
import { site } from "@/lib/site";

/**
 * Agent Skills Discovery index (v0.2.0,
 * github.com/cloudflare/agent-skills-discovery-rfc). Lists the
 * skills this site publishes; the digest is computed from the same
 * source the SKILL.md route serves.
 */
export function GET() {
  return Response.json({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: skillName,
        type: "skill-md",
        description: skillDescription,
        url: `${site.url}/.well-known/agent-skills/${skillName}/SKILL.md`,
        digest: getSkillDigest(),
      },
    ],
  });
}
