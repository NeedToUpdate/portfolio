import Heading from "@/components/ui/Heading";
import type { CaseComment } from "@/lib/types";

interface CaseCommentsProps {
  comments: CaseComment[];
}

/** A gold editorial placard: Art's transferable judgment beside the project evidence. */
export default function CaseComments({ comments }: CaseCommentsProps) {
  if (comments.length === 0) return null;

  return (
    <aside
      aria-labelledby="arts-comments"
      data-nebula-shape="spark"
      className="relative overflow-hidden rounded-2xl border border-amber-300/45 bg-[linear-gradient(145deg,rgba(113,76,20,0.38),rgba(30,24,14,0.92)_48%,rgba(18,17,15,0.96))] p-px shadow-[0_22px_65px_rgba(0,0,0,0.28),0_0_45px_rgba(217,164,65,0.08)] lg:sticky lg:top-28"
    >
      <div className="rounded-[calc(1rem-1px)] border border-amber-100/10 bg-base/45 px-5 py-6 backdrop-blur-sm sm:px-6">
        <div className="mb-6 border-b border-amber-200/20 pb-5">
          <h2
            id="arts-comments"
            className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-amber-200/70"
          >
            Art&rsquo;s Comments
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-50/60">
            Questions that came out of the work.
          </p>
        </div>

        <div className="space-y-7">
          {comments.map((comment) => (
            <section key={comment.question}>
              <Heading as="h3" size="small" className="!text-amber-50">
                {comment.question}
              </Heading>
              <p className="mt-3 text-sm leading-relaxed text-amber-50/75">
                {comment.answer}
              </p>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
