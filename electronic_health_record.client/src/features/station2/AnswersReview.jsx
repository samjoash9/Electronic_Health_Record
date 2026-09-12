import { useId, useState } from 'react';
import * as Icons from 'lucide-react';
import { answersToMap, scoreAllCategories, overallScore } from '../../lib/scoring';
import { categoryStyle } from '../../lib/constants';
import ScoreBar from '../../components/ui/ScoreBar';

export default function AnswersReview({ categories, answers }) {
  const answerMap = answersToMap(answers);
  const scores = scoreAllCategories(categories, answers);
  const scoreByCategory = Object.fromEntries(scores.map((s) => [s.categoryID, s]));
  const overall = overallScore(categories, answers);

  // Holds only the categories the reviewer has collapsed, so every section
  // starts open -- the point of this screen is to read the answers back.
  const [collapsed, setCollapsed] = useState({});
  const toggle = (categoryID) =>
    setCollapsed((prev) => ({ ...prev, [categoryID]: !prev[categoryID] }));

  // Collapses the whole review -- every category and the summary -- down to the
  // single header below. Kept separate from `collapsed` so re-opening restores
  // whatever per-section state the reviewer had set rather than expanding all.
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Station 3's PriorStationsPanel renders this component too, so the panel ids
  // are scoped per instance rather than hardcoded.
  const uid = useId();

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setAllCollapsed((v) => !v)}
        aria-expanded={!allCollapsed}
        aria-controls={`${uid}-sections`}
        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-teal-50 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-ink-900">
          All Sections
          <span className="ml-2 font-medium text-ink-500">
            {overall.percent === null ? '—' : `${overall.percent}% overall`}
          </span>
        </span>
        <Icons.ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-ink-500 transition-transform ${allCollapsed ? '' : 'rotate-180'}`}
        />
      </button>

      <div id={`${uid}-sections`} hidden={allCollapsed} className="flex flex-col gap-4">
        {categories.map((category) => {
          const score = scoreByCategory[category.categoryID];
          const style = categoryStyle(category.name);
          const Icon = Icons[style.icon] ?? Icons.ClipboardList;
          const isCollapsed = Boolean(collapsed[category.categoryID]);
          const panelId = `${uid}-panel-${category.categoryID}`;
          return (
            <div key={category.categoryID} className="overflow-hidden rounded-xl border border-line">
              <button
                type="button"
                onClick={() => toggle(category.categoryID)}
                aria-expanded={!isCollapsed}
                aria-controls={panelId}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${style.header}`}
              >
                <ScoreBar
                  label={category.name}
                  percent={score.percent}
                  total={score.total}
                  max={score.max}
                  icon={Icon}
                  badgeClassName={style.title}
                />
                <Icons.ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`shrink-0 text-ink-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                />
              </button>
              <ul id={panelId} hidden={isCollapsed} className="divide-y divide-line">
                {category.questions.map((question, index) => {
                  const selectedId = answerMap[question.questionID];
                  const option = question.options.find((o) => o.optionID === selectedId);
                  return (
                    <li
                      key={question.questionID}
                      className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${index % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                    >
                      <span className="text-ink-700">{question.questionText}</span>
                      <span
                        className={
                          option
                            ? 'shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-900'
                            : 'shrink-0 text-xs text-ink-500'
                        }
                      >
                        {option ? option.optionText : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="overflow-hidden rounded-xl border border-line">
          <div className="px-4 py-3 bg-teal-50 border-b border-line">
            <span className="text-sm font-bold text-ink-900">Overall Summary</span>
          </div>
          <ul className="divide-y divide-line">
            {scores.map((score) => (
              <li key={score.categoryID} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <span className="text-ink-700">{score.name}</span>
                <span
                  className={
                    score.percent === null
                      ? 'shrink-0 text-xs text-ink-500'
                      : 'shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-900'
                  }
                >
                  {score.percent === null ? '—' : `${score.percent}%`}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 bg-gray-50">
            <ScoreBar
              label="Overall Average"
              percent={overall.percent}
              total={overall.total}
              max={overall.max}
              icon={Icons.ClipboardList}
              badgeClassName="text-ink-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
