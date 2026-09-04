import { categoryStyle } from '../../lib/constants';
import OptionPills from './OptionPills';

export default function CategoryCard({ category, answers, onAnswer }) {
  const style = categoryStyle(category.name);
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <header className={`border-b px-5 py-3.5 ${style.header}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${style.title}`}>
          {category.name}
        </h2>
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
