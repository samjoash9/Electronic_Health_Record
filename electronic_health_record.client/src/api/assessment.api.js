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
