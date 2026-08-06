"use client";

import { useId, useState, type CSSProperties } from "react";
import InteractiveFigure from "./InteractiveFigure";

type FaderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  showAvailable?: boolean;
  onChange: (value: number) => void;
};

function Fader({ label, value, min, max, showAvailable = false, onChange }: FaderProps) {
  const id = useId();
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const progressStyle = { "--fader-progress": `${progress}%` } as CSSProperties;

  return (
    <div className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 sm:flex sm:flex-1 sm:flex-col sm:gap-3">
      <output htmlFor={id} className="col-start-3 row-start-1 text-right font-mono text-xs font-semibold text-ink sm:col-auto sm:row-auto sm:text-center sm:text-sm">
        {value} days
      </output>
      <div className="relative col-start-2 row-start-1 flex h-11 w-full items-center justify-center sm:col-auto sm:row-auto sm:h-36 sm:w-10" style={progressStyle}>
        <div className="absolute h-1 w-full rounded-full bg-raised sm:h-full sm:w-1" />
        <div className="absolute left-0 h-1 w-[var(--fader-progress)] rounded-full bg-accent/70 sm:bottom-0 sm:left-auto sm:h-[var(--fader-progress)] sm:w-1" />
        <input
          id={id}
          aria-label={`${label}, ${value} days`}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute h-11 w-full cursor-pointer appearance-none bg-transparent accent-accent [direction:ltr] [writing-mode:horizontal-tb] sm:h-36 sm:w-10 sm:[direction:rtl] sm:[writing-mode:vertical-lr]"
        />
      </div>
      <label htmlFor={id} className="col-start-1 row-start-1 text-left text-[11px] leading-tight text-muted sm:col-auto sm:row-auto sm:min-h-8 sm:text-center sm:text-xs">
        {label}
        {showAvailable ? <span className="mt-1 block font-mono text-[10px]">{max}d available</span> : null}
      </label>
    </div>
  );
}

function days(value: number) {
  return `${value} day${value === 1 ? "" : "s"}`;
}

interface HumanReviewLabProps {
  description?: string;
}

export default function HumanReviewLab({ description }: HumanReviewLabProps) {
  const [businessDays, setBusinessDays] = useState(10);
  const [buildDays, setBuildDays] = useState(2);
  const [reviewDays, setReviewDays] = useState(0);
  const [qaDays, setQaDays] = useState(2);

  const changeBusinessDays = (value: number) => {
    setBusinessDays(value);
    const nextBuild = Math.min(buildDays, value);
    const nextReview = Math.min(reviewDays, Math.max(0, value - nextBuild));
    const nextQa = Math.min(qaDays, Math.max(0, value - nextBuild - nextReview));
    setBuildDays(nextBuild);
    setReviewDays(nextReview);
    setQaDays(nextQa);
  };

  const changeBuildDays = (value: number) => {
    const nextBuild = Math.min(value, businessDays);
    const nextReview = Math.min(reviewDays, Math.max(0, businessDays - nextBuild));
    setBuildDays(nextBuild);
    setReviewDays(nextReview);
    setQaDays(Math.min(qaDays, Math.max(0, businessDays - nextBuild - nextReview)));
  };

  const changeReviewDays = (value: number) => {
    const nextReview = Math.min(value, Math.max(0, businessDays - buildDays));
    setReviewDays(nextReview);
    setQaDays(Math.min(qaDays, Math.max(0, businessDays - buildDays - nextReview)));
  };

  const changeQaDays = (value: number) => {
    setQaDays(Math.min(value, Math.max(0, businessDays - buildDays - reviewDays)));
  };

  const releaseDays = buildDays + reviewDays + qaDays;
  // One AI coding day produces roughly ten traditional implementation days,
  // so larger business asks still require proportionally more AI coding time.
  const equivalentDays = buildDays * 10;
  const features = businessDays > 0 ? equivalentDays / businessDays : 0;
  const featureLabel = Number.isInteger(features) ? String(features) : features.toFixed(1);
  // Savings are measured against what the business requested, not against
  // extra scope the model happened to generate beyond that request.
  const timeSaved = businessDays - releaseDays;
  const missingScopeDays = Math.max(0, businessDays - equivalentDays);
  const meetsAsk = equivalentDays >= businessDays;
  const scopeMax = Math.max(1, businessDays, equivalentDays);
  const scheduleMax = Math.max(1, businessDays, releaseDays);
  const scopeWidth = (value: number) => `${(value / scopeMax) * 100}%`;
  const scheduleWidth = (value: number) => `${(value / scheduleMax) * 100}%`;
  const buildWidth = scheduleWidth(buildDays);
  const reviewWidth = scheduleWidth(reviewDays);
  const qaWidth = scheduleWidth(qaDays);

  // More generated scope creates more places for plausible-looking mistakes
  // and shortcuts. Review attacks both; QA can catch behaviour, not design debt.
  const generatedBugs = features > 0 ? Math.max(1, Math.round(features * 9)) : 0;
  // Two unreviewed feature-equivalents add five story points of debt.
  const generatedDebt = features > 0 ? Math.max(1, features * 2.5) : 0;
  const reviewCoverage = Math.min(1, reviewDays / Math.max(1, buildDays * 2));
  // QA is effective at finding observable failures, but its throughput falls
  // as the generated surface grows. Two QA days can inspect a two-day AI build
  // well; fifteen QA days cannot exhaustively cover fifteen days of generation.
  const qaScalePenalty = Math.max(1, buildDays / 2);
  const qaCapacity = (qaDays * 7) / qaScalePenalty;
  const escapedWithoutReview = Math.max(0, generatedBugs - qaCapacity);
  // Deliberately linear: review walks escaped bugs toward a one-bug floor;
  // QA is the only phase that can remove that final observable risk.
  const reviewedFloor = Math.max(0, Math.min(1, generatedBugs) - qaCapacity);
  const calculatedEscaped = Math.max(
    0,
    Math.round(escapedWithoutReview + (reviewedFloor - escapedWithoutReview) * reviewCoverage)
  );
  // QA cannot validate missing business context. Without human review, one
  // contextual bug always survives regardless of how much QA time is added.
  const escaped = reviewDays === 0 && generatedBugs > 0
    ? Math.max(1, calculatedEscaped)
    : calculatedEscaped;
  const caught = generatedBugs - escaped;
  // Even sustained review leaves some compromises behind by design.
  const techDebt = generatedDebt > 0
    ? Math.max(1, Math.round(generatedDebt + (1 - generatedDebt) * reviewCoverage))
    : 0;

  const scopePhrase = features < 1
    ? `complete ${Math.round(features * 100)}% of the requested scope`
    : features === 1
      ? "meet the requested scope"
      : features === 2
        ? "double the requested scope"
        : features === 3
          ? "triple the requested scope"
          : `produce ${featureLabel} times the requested scope`;

  let outcome: string;
  if (features < 1) {
    outcome = `The feature is still unfinished, with ${Math.round((1 - features) * 100)}% of the requested scope missing.`;
  } else if (timeSaved < 0) {
    outcome = `The scope is complete, but the work finishes ${days(Math.abs(timeSaved))} after the business deadline.`;
  } else if (escaped === 0 && techDebt === 1) {
    outcome = "Because of the review and QA time, there are no production bugs to deal with this month. The AI-written code still left a little technical debt, which is unavoidable, but now you have extra time to deal with it in the next sprint.";
  } else if (escaped === 0) {
    outcome = `You are now left with ${techDebt} story ${techDebt === 1 ? "point" : "points"} of technical debt.`;
  } else {
    const productionBugs = escaped === 1 && qaDays === 0
      ? "1 production bug to deal with this month, even though the feature worked perfectly fine on the developer's machine"
      : `${escaped} production ${escaped === 1 ? "bug" : "bugs"} to deal with this month`;
    outcome = `However, there ${techDebt === 1 ? "is" : "are"} now ${techDebt} story ${techDebt === 1 ? "point" : "points"} of technical debt, and ${productionBugs}.`;
  }

  // Easter egg: no business ask means every bar sits at zero.
  const allZero = businessDays === 0 && buildDays === 0 && reviewDays === 0 && qaDays === 0;

  const escapedContext = escaped === 1
    ? reviewDays === 0
      ? "The bug was caused by a difference between the non-production and production environments that the QA team did not know about."
      : ""
    : "";

  return (
    <InteractiveFigure
      prompt="change the schedule"
      accessibleDescription={description}
    >
      <div className="flex flex-col gap-4 sm:gap-7">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">The shipping equation</p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            This is a simplified scenario, but fairly accurate from experience. Add human review to see how it reduces technical debt and prevents production bugs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-4 sm:gap-4" data-testid="human-review-faders">
          <Fader label="Business ask" value={businessDays} min={0} max={30} onChange={changeBusinessDays} />
          <Fader label="AI coding" value={buildDays} min={0} max={businessDays} showAvailable onChange={changeBuildDays} />
          <Fader label="Human review" value={reviewDays} min={0} max={Math.max(0, businessDays - buildDays)} showAvailable onChange={changeReviewDays} />
          <Fader label="QA" value={qaDays} min={0} max={Math.max(0, businessDays - buildDays - reviewDays)} showAvailable onChange={changeQaDays} />
        </div>

        <div className="border-t border-line pt-4 sm:pt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-5 sm:gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                {meetsAsk ? "Implementation time saved" : "Scope still missing"}
              </p>
              <p className={`mt-1 font-mono text-2xl font-semibold sm:text-3xl ${meetsAsk && timeSaved >= 0 ? "text-accent" : "text-nebula"}`}>
                {meetsAsk
                  ? timeSaved >= 0
                    ? days(timeSaved)
                    : `${days(Math.abs(timeSaved))} late`
                  : `${days(missingScopeDays)} of work`}
              </p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-5" role="img" aria-label={meetsAsk
            ? `Business asked for one ${businessDays}-day feature. AI generated ${features.toFixed(1)} feature equivalents. The work takes ${releaseDays} days and saves ${Math.round(timeSaved)} days against the requested feature.`
            : `Business asked for one ${businessDays}-day feature. AI generated ${equivalentDays} days of equivalent scope, leaving ${missingScopeDays} days of scope incomplete.`
          }>
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Generated scope</span>
              </div>
              <div className="relative h-9 overflow-hidden rounded-md border border-line bg-raised">
                <div className="absolute inset-y-0 left-0 bg-ink/10" style={{ width: scopeWidth(businessDays) }} />
                <div className="absolute inset-y-0 w-px bg-ink/60" style={{ left: scopeWidth(businessDays) }} />
                <div className="relative flex h-full items-center bg-plasma/25 px-3 text-xs text-ink" style={{ width: scopeWidth(equivalentDays) }}>
                  <span className="truncate">
                    Business asked for <strong>1 feature</strong>. AI coded <strong>{featureLabel}</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Total time spent</span>
                <span className="font-mono">{releaseDays}d</span>
              </div>
              <div className="relative flex h-10 overflow-hidden rounded-md border border-line bg-raised sm:h-12">
                <div className="flex min-w-0 items-center justify-center bg-plasma/70 text-[10px] font-semibold text-base" style={{ width: buildWidth }} title={`AI build: ${buildDays} days`}>
                  <span className="truncate px-1">Build</span>
                </div>
                <div className="flex min-w-0 items-center justify-center bg-accent/85 text-[10px] font-semibold text-accent-ink" style={{ width: reviewWidth }} title={`Human review: ${reviewDays} days`}>
                  <span className="truncate px-1">Review</span>
                </div>
                <div className="flex min-w-0 items-center justify-center bg-nebula/75 text-[10px] font-semibold text-base" style={{ width: qaWidth }} title={`QA: ${qaDays} days`}>
                  <span className="truncate px-1">QA</span>
                </div>
                {meetsAsk && timeSaved > 0 && (
                  <div className="flex min-w-0 items-center justify-end border-l border-dashed border-accent/50 px-2 text-right font-mono text-[10px] text-accent" style={{ width: scheduleWidth(timeSaved) }}>
                    <span className="truncate">{timeSaved}d saved</span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-y-0 w-px bg-ink/60" style={{ left: scheduleWidth(businessDays) }} title="Business deadline" />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
                <span>Build {buildDays}d</span>
                <span>Review {reviewDays}d</span>
                <span>QA {qaDays}d</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
          <div className="bg-surface p-3 sm:p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Generated</p>
            <p className="mt-1 font-mono text-2xl text-ink sm:mt-2 sm:text-3xl">{features.toFixed(1)}</p>
            <p className="mt-1 text-xs text-muted">feature equivalents for a 1-feature ask</p>
          </div>
          <div className="bg-surface p-3 sm:p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Caught</p>
            <p className="mt-1 font-mono text-2xl text-plasma sm:mt-2 sm:text-3xl">{caught}/{generatedBugs}</p>
            <p className="mt-1 text-xs text-muted">bugs caught before production</p>
          </div>
          <div className={`p-3 sm:p-4 ${escaped > 0 ? "bg-red-500/5" : "bg-surface"}`}>
            <p className="text-xs uppercase tracking-wider text-muted">Escaped</p>
            <p className={`mt-1 font-mono text-2xl sm:mt-2 sm:text-3xl ${escaped > 0 ? "text-red-400" : "text-plasma"}`}>{escaped}</p>
            <p className="mt-1 text-xs text-muted">bugs left for production</p>
          </div>
          <div className={`p-3 sm:p-4 ${techDebt > 3 ? "bg-orange-500/5" : "bg-surface"}`}>
            <p className="text-xs uppercase tracking-wider text-muted">Tech debt</p>
            <p className={`mt-1 font-mono text-2xl sm:mt-2 sm:text-3xl ${techDebt > 3 ? "text-orange-400" : "text-nebula"}`}>{techDebt}</p>
            <p className="mt-1 text-xs text-muted">story points</p>
          </div>
        </div>

        <div className="rounded-md border border-accent/30 bg-raised/50 p-4 sm:p-5" aria-live="polite">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
            With the time above, your result:
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink sm:mt-3 sm:text-[1rem]">
            {allZero
              ? "The business didn't ask you for anything. You now have time to scroll your phone, with no additional tech debt or production bugs to bother you this month."
              : <>The business asked for one feature that should take {days(businessDays)}. In {days(releaseDays)} total, AI wrote enough code to {scopePhrase}. {outcome}{escapedContext ? ` ${escapedContext}` : ""}</>}
          </p>
        </div>

      </div>
    </InteractiveFigure>
  );
}
