/**
 * Plain-language bands for the Station 2 wellness percentages.
 *
 * A raw percentage misleads here. Every answer scores 1-4 (4 healthiest), so
 * a section bottoms out at 25%, not 0%, and 50% is not "half healthy": it is
 * what a patient gets by picking the second-worst answer ("Rarely",
 * "Disagree", "Fair") on every question. The cutoffs are therefore set on the
 * average answer, not on the percentage scale:
 *
 *   90%+  ~3.6 avg   mostly the healthiest answer
 *   75%+   3.0 avg   mostly the second-healthiest answer
 *   65%+  ~2.6 avg   leaning to the healthy side of the scale
 *   50%+   2.0 avg   leaning to the concerning side
 *   <50%  <2.0 avg   many answers at the most concerning level
 *
 * A 5-question section moves in 5% steps, so for a section 90/65 behave the
 * same as the 3.5/2.5 midpoints of the answer scale. The 75/50 lines match
 * the existing ScoreBar colours, so no bar changes colour.
 *
 * !! NEEDS CLINICAL REVIEW !! -- these cutoffs are a developer's reading of
 * the scale, not a validated instrument.
 */

/** Best to worst. */
export const BANDS = ['excellent', 'good', 'fair', 'attention', 'support'];

const CUTOFFS = [
  ['excellent', 90],
  ['good', 75],
  ['fair', 65],
  ['attention', 50],
];

/** Every answer scores at least 1 of 4 points, so no section goes below this. */
const LOWEST_PERCENT = 25;

export function scoreBand(percent) {
  if (percent === null || percent === undefined) return null;
  const hit = CUTOFFS.find(([, min]) => percent >= min);
  return hit ? hit[0] : 'support';
}

/**
 * The percentages a band covers, for the legend. `max` stops one decimal
 * short of the next band up because scores are shown to one decimal place.
 */
export function bandRange(band) {
  const index = BANDS.indexOf(band);
  const min = index < CUTOFFS.length ? CUTOFFS[index][1] : LOWEST_PERCENT;
  const max = index === 0 ? 100 : Math.round((CUTOFFS[index - 1][1] - 0.1) * 10) / 10;
  return { min, max };
}

/**
 * Answers that sit at the lowest score their question allows. A section can
 * score "Good" overall while hiding one of these (e.g. anxiety "Often"), so
 * they are surfaced on their own rather than left inside the average.
 * Judged by score, never by option position -- see lib/scoring.js.
 */
export function concerningAnswers(category, answersByQuestionId = {}) {
  return (category?.questions ?? []).flatMap((question) => {
    const options = question.options ?? [];
    const option = options.find((o) => o.optionID === answersByQuestionId[question.questionID]);
    if (!option) return [];
    const worst = Math.min(...options.map((o) => o.score));
    return option.score === worst ? [{ question, option }] : [];
  });
}
