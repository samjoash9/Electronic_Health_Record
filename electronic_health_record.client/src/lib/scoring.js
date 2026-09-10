/**
 * Scores are stored per option and are NEVER derivable from display order.
 * The sleep question runs 1, 2, 4, 3 by design. Any code that computes a
 * score from an index is a bug.
 */

export function answersToMap(answers) {
  const map = {};
  for (const a of answers ?? []) {
    map[a.questionID] = a.optionID;
  }
  return map;
}

export function scoreCategory(category, answersByQuestionId = {}) {
  const questions = category?.questions ?? [];
  let total = 0;
  let max = 0;
  let answered = 0;

  for (const question of questions) {
    const options = question.options ?? [];
    if (options.length > 0) {
      max += Math.max(...options.map((o) => o.score));
    }
    const selectedId = answersByQuestionId[question.questionID];
    if (selectedId === undefined || selectedId === null) continue;
    const option = options.find((o) => o.optionID === selectedId);
    if (!option) continue;
    total += option.score;
    answered += 1;
  }

  return {
    total,
    max,
    answered,
    questionCount: questions.length,
    percent: max === 0 ? null : Math.round((total / max) * 1000) / 10,
  };
}

export function scoreAllCategories(categories, answers) {
  const map = answersToMap(answers);
  return (categories ?? []).map((category) => ({
    categoryID: category.categoryID,
    name: category.name,
    ...scoreCategory(category, map),
  }));
}

export function totalAnswered(categories, answers) {
  const map = answersToMap(answers);
  return (categories ?? []).reduce(
    (sum, c) => sum + scoreCategory(c, map).answered,
    0,
  );
}

export function totalQuestions(categories) {
  return (categories ?? []).reduce((sum, c) => sum + (c.questions?.length ?? 0), 0);
}
