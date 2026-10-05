import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

/** The four categories, each with nested active questions and their options. */
export async function getAssessmentTemplate() {
  if (USE_MOCK) {
    await delay(200);
    return db.read().assessmentCategories
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        ...category,
        questions: category.questions
          .filter((q) => q.isActive)
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((question) => ({
            ...question,
            options: question.options
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder),
          })),
      }));
  }
  try {
    const { data } = await client.get('/assessment/template');
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Average Station 2 score per wellness category, from each patient's latest
 * assessed visit -- the dashboard's 7 Aspects chart: { total, aspects: [{
 * categoryID, name, score }] }, score a percentage of the points possible
 * (null when nobody answered that category). Pass { office } to limit it to
 * one agency office, or {} for all. No USE_MOCK branch: the mock db has no
 * wellness forms to aggregate over.
 */
export async function getWellnessScores(params) {
  try {
    const { data } = await client.get('/assessment/wellness-scores', { params });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}
