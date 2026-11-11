interface ScrollCueProps {
  className: string;
  /** Heading ids of the insights and case-study sections below the fold. */
  insightsId: string;
  workId: string;
}

/** Bouncing arrow at the fold that names the two sections below it. */
export default function ScrollCue({ className, insightsId, workId }: ScrollCueProps) {
  return (
    <div className={className}>
      <span aria-hidden className="animate-bounce text-accent">
        ↓
      </span>
      <a href={`#${insightsId}`} className="hover:text-ink">
        Insights
      </a>
      <span aria-hidden>·</span>
      <a href={`#${workId}`} className="hover:text-ink">
        Case studies
      </a>
    </div>
  );
}
