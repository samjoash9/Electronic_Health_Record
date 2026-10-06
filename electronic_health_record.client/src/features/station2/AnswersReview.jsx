import { useId, useState } from 'react';
import * as Icons from 'lucide-react';
import { answersToMap, scoreAllCategories, overallScore } from '../../lib/scoring';
import { BANDS, bandRange, scoreBand, concerningAnswers } from '../../lib/interpretation';
import {
  categoryName, questionText, optionText, resultsText, sectionInterpretation, overallInterpretation,
} from '../../lib/assessmentText';
import { DEFAULT_LANGUAGE } from '../../i18n/assessmentTranslations';
import { categoryStyle } from '../../lib/constants';
import ScoreBar from '../../components/ui/ScoreBar';
import LanguageToggle from './LanguageToggle';
import BandChip from './BandChip';

export default function AnswersReview({
  categories,
  answers,
  headerRef,
  headerSlot,
  categoryRefs,
}) {
  const answerMap = answersToMap(answers);
  const scores = scoreAllCategories(categories, answers);
  const scoreByCategory = Object.fromEntries(scores.map((s) => [s.categoryID, s]));
  const overall = overallScore(categories, answers);
  const overallBand = scoreBand(overall.percent);

  // Not persisted, for the same reason as the kiosk's: this screen is read
  // by whoever is next at the station, so it starts in English each time.
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);
  const t = resultsText(lang);

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
      <div ref={headerRef} className="flex flex-col gap-4">
        {headerSlot}
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink-900">{t.title}</h3>
            <LanguageToggle value={lang} onChange={setLang} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{t.howToRead}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-500">{t.scoreGuide}</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {BANDS.map((band) => {
              const { min, max } = bandRange(band);
              return (
                <li key={band}>
                  <BandChip band={band} label={`${t.bands[band]} · ${min}–${max}%`} />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-ink-500">{t.disclaimer}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAllCollapsed((v) => !v)}
        aria-expanded={!allCollapsed}
        aria-controls={`${uid}-sections`}
        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-teal-50 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-ink-900">
          {t.allSections}
          <span className="ml-2 font-medium text-ink-500">
            {overall.percent === null ? '—' : t.overallPercent(overall.percent)}
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
          const band = scoreBand(score.percent);
          const { about, message } = sectionInterpretation(category.name, band, lang);
          const flagged = concerningAnswers(category, answerMap);
          const name = categoryName(category.name, lang);
          const style = categoryStyle(category.name);
          const Icon = Icons[style.icon] ?? Icons.ClipboardList;
          const isCollapsed = Boolean(collapsed[category.categoryID]);
          const panelId = `${uid}-panel-${category.categoryID}`;
          const categoryRef = categoryRefs?.[category.name] ?? categoryRefs?.[category.name?.toLowerCase()];
          return (
            <div key={category.categoryID} ref={categoryRef}>
              <section aria-label={name} className="overflow-hidden rounded-xl border border-line">
              <button
                type="button"
                onClick={() => toggle(category.categoryID)}
                aria-expanded={!isCollapsed}
                aria-controls={panelId}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${style.header}`}
              >
                <ScoreBar
                  label={name}
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
              <div id={panelId} hidden={isCollapsed}>
                <div className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm">
                  {about && (
                    <p className="text-xs text-ink-500">
                      <span className="font-semibold">{t.aboutLabel}:</span> {about}
                    </p>
                  )}
                  {band && (
                    <div className="flex flex-wrap items-start gap-2">
                      <BandChip band={band} label={t.bands[band]} />
                      <p className="min-w-0 flex-1 leading-relaxed text-ink-900">{message}</p>
                    </div>
                  )}
                  {flagged.length > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                      <p id={`${panelId}-flagged`} className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <Icons.AlertTriangle size={14} aria-hidden="true" />
                        {t.flaggedTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-rose-700">{t.flaggedNote}</p>
                      <ul aria-labelledby={`${panelId}-flagged`} className="mt-2 flex flex-col gap-1.5">
                        {flagged.map(({ question, option }) => (
                          <li key={question.questionID} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-ink-900">{questionText(question, lang)}</span>
                            <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 font-semibold text-rose-800 ring-1 ring-rose-200">
                              {optionText(option, lang)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <ul className="divide-y divide-line">
                  {category.questions.map((question, index) => {
                    const selectedId = answerMap[question.questionID];
                    const option = question.options.find((o) => o.optionID === selectedId);
                    return (
                      <li
                        key={question.questionID}
                        className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${index % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                      >
                        <span className="text-ink-700">{questionText(question, lang)}</span>
                        <span
                          className={
                            option
                              ? 'shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-900'
                              : 'shrink-0 text-xs text-ink-500'
                          }
                        >
                          {option ? optionText(option, lang) : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </div>
        );
      })}

        <section aria-label={t.overallSummary} className="overflow-hidden rounded-xl border border-line">
          <div className="px-4 py-3 bg-teal-50 border-b border-line">
            <span className="text-sm font-bold text-ink-900">{t.overallSummary}</span>
          </div>
          <ul className="divide-y divide-line">
            {scores.map((score) => {
              const band = scoreBand(score.percent);
              return (
                <li key={score.categoryID} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-ink-700">{categoryName(score.name, lang)}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {band && <BandChip band={band} label={t.bands[band]} />}
                    <span
                      className={
                        score.percent === null
                          ? 'text-xs text-ink-500'
                          : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-900'
                      }
                    >
                      {score.percent === null ? '—' : `${score.percent}%`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-2 px-4 py-3 bg-gray-50">
            <ScoreBar
              label={t.overallAverage}
              percent={overall.percent}
              total={overall.total}
              max={overall.max}
              icon={Icons.ClipboardList}
              badgeClassName="text-ink-900"
            />
            {overallBand && (
              <div className="flex flex-wrap items-start gap-2 text-sm">
                <BandChip band={overallBand} label={t.bands[overallBand]} />
                <p className="min-w-0 flex-1 leading-relaxed text-ink-900">
                  {overallInterpretation(overallBand, lang)}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
