import * as Icons from 'lucide-react';
import { categoryStyle } from '../../lib/constants';
import OptionPills from './OptionPills';

export default function CategoryCard({ category, answers, onAnswer }) {
  const style = categoryStyle(category.name);
  const Icon = Icons[style.icon] ?? Icons.ClipboardList;
  const answeredCount = category.questions.filter((q) => answers[q.questionID] != null).length;
  const total = category.questions.length;
  const complete = answeredCount === total;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
      <header className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${style.header}`}>
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 ${style.title}`}>
            <Icon size={17} strokeWidth={2.25} />
          </span>
          <h2 className={`text-sm font-bold uppercase tracking-wider ${style.title}`}>
            {category.name}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            complete ? 'bg-[#129883] text-white' : 'bg-white/70 text-ink-500'
          }`}
        >
          {answeredCount}/{total}
        </span>
      </header>
      <div className="flex flex-col divide-y divide-line">
        {category.questions.map((question, index) => (
          <div key={question.questionID} className="flex flex-col gap-3 px-5 py-5">
            <p className="text-base font-medium text-ink-900">
              {index + 1}. {question.questionText}
            </p>
            <OptionPills
              question={question}
              value={answers[question.questionID]}
              onChange={(optionID) => onAnswer(question.questionID, optionID)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
