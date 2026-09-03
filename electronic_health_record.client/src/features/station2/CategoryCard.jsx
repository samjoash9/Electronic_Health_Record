import { categoryStyle } from '../../lib/constants';
import OptionPills from './OptionPills';

export default function CategoryCard({ category, answers, onAnswer }) {
  const style = categoryStyle(category.name);
  return (
    <section className="mb-5 overflow-hidden rounded-lg border border-line bg-surface">
      <header className={`border-b px-5 py-3 ${style.header}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wide ${style.title}`}>
          {category.name}
        </h2>
      </header>
      <div className="flex flex-col gap-6 px-5 py-5">
        {category.questions.map((question, index) => (
          <div key={question.questionID} className="flex flex-col gap-3">
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
