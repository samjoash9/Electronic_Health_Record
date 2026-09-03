import { answersToMap, scoreAllCategories } from '../../lib/scoring';
import { categoryStyle } from '../../lib/constants';
import ScoreBar from '../../components/ui/ScoreBar';

export default function AnswersReview({ categories, answers }) {
  const answerMap = answersToMap(answers);
  const scores = scoreAllCategories(categories, answers);
  const scoreByCategory = Object.fromEntries(scores.map((s) => [s.categoryID, s]));

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => {
        const score = scoreByCategory[category.categoryID];
        const style = categoryStyle(category.name);
        return (
          <div key={category.categoryID} className="rounded border border-line">
            <div className={`px-3 py-2 ${style.header}`}>
              <ScoreBar
                label={category.name}
                percent={score.percent}
                total={score.total}
                max={score.max}
              />
            </div>
            <ul className="divide-y divide-line">
              {category.questions.map((question) => {
                const selectedId = answerMap[question.questionID];
                const option = question.options.find((o) => o.optionID === selectedId);
                return (
                  <li key={question.questionID} className="flex items-center justify-between px-3 py-1.5 text-sm">
                    <span className="text-ink-700">{question.questionText}</span>
                    <span className={option ? 'font-medium text-ink-900' : 'text-ink-500'}>
                      {option ? option.optionText : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
