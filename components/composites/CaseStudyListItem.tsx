import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Text from "@/components/ui/Text";
import Eyebrow from "@/components/ui/Eyebrow";
import { categoryIcon } from "@/components/ui/Icon";
import { CaseStudy } from "@/lib/types";

interface CaseStudyListItemProps {
  caseStudy: CaseStudy;
}

/** One entry in a work list. Typography and spacing carry the hierarchy. */
export default function CaseStudyListItem({ caseStudy }: CaseStudyListItemProps) {
  return (
    <Link href={`/work/${caseStudy.slug}`} className="group block py-6">
      <div className="flex items-baseline justify-between gap-4">
        <Heading size="item" className="min-w-0 transition-colors group-hover:text-accent">
          {caseStudy.title}
        </Heading>
        <Eyebrow icon={categoryIcon(caseStudy.category)} className="hidden shrink-0 sm:flex">
          {caseStudy.category}
        </Eyebrow>
      </div>
      <Text variant="muted" className="mt-2 max-w-prose">
        {caseStudy.impact}
      </Text>
    </Link>
  );
}
