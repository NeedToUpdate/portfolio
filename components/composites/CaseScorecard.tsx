import Eyebrow from "@/components/ui/Eyebrow";
import Text from "@/components/ui/Text";
import TagList from "./TagList";
import { ScorecardEntry } from "@/lib/types";

interface CaseScorecardProps {
  /** Context rows from the study's frontmatter: client, scale, environment. */
  entries: ScorecardEntry[];
  techs: string[];
  role?: string;
}

/**
 * The consulting-style fact block at the top of a case study: who the
 * client was, at what scale, my role, and the stack. The kind of
 * scorecard an RFP response opens with.
 */
export default function CaseScorecard({ entries, techs, role }: CaseScorecardProps) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-line/60 py-5 sm:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.term} className="min-w-0">
          <dt>
            <Eyebrow>{entry.term}</Eyebrow>
          </dt>
          <Text variant="small" as="dd" className="mt-1.5 text-ink">
            {entry.value}
          </Text>
        </div>
      ))}
      {role && (
        <div className="min-w-0">
          <dt>
            <Eyebrow>Role</Eyebrow>
          </dt>
          <Text variant="small" as="dd" className="mt-1.5 text-ink">
            {role}
          </Text>
        </div>
      )}
      <div className="col-span-2 min-w-0 sm:col-span-3">
        <dt>
          <Eyebrow>Stack</Eyebrow>
        </dt>
        <dd className="mt-1.5">
          <TagList tags={techs} />
        </dd>
      </div>
    </dl>
  );
}
