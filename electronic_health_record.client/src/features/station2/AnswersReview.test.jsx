import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { db } from '../../api/mock/db';
import AnswersReview from './AnswersReview';

// The real seeded template: 7 sections x 5 questions, every option 1-4.
const categories = db.read().assessmentCategories;
const questions = categories.flatMap((c) => c.questions);

const healthiest = (q) => q.options.reduce((a, o) => (o.score > a.score ? o : a));
const worst = (q) => q.options.reduce((a, o) => (o.score < a.score ? o : a));

/** Healthiest answer everywhere, except where `pick` chooses otherwise. */
function answers(pick = () => null) {
  return questions.map((q) => ({
    questionID: q.questionID,
    optionID: (pick(q) ?? healthiest(q)).optionID,
  }));
}

const flaggedList = () => screen.queryByRole('list', { name: 'Answers to discuss with the doctor' });

describe('AnswersReview interpretation', () => {
  it('tells the patient what a top-scoring section means', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    const mental = screen.getByRole('region', { name: 'Mental' });
    expect(within(mental).getByText('Excellent')).toBeInTheDocument();
    expect(within(mental).getByText(/stress level, sleep, mood/i)).toBeInTheDocument();
  });

  // 5 x 1 point = 5 of 20 = 25%, the floor of the scale.
  it('puts a section answered at the worst level everywhere in Needs support', () => {
    const financialQuestions = categories.find((c) => c.name === 'Financial').questions;
    render(
      <AnswersReview
        categories={categories}
        answers={answers((q) => (financialQuestions.includes(q) ? worst(q) : null))}
      />,
    );
    const financial = screen.getByRole('region', { name: 'Financial' });
    expect(within(financial).getByText('25%')).toBeInTheDocument();
    expect(within(financial).getByText('Needs support')).toBeInTheDocument();
  });

  // 4 + 4 + 4 + 1 + 4 = 17 of 20 = 85%: the section reads "Good", but the
  // one worst-level answer must not disappear into that average.
  it('flags a worst-level answer even when its section scores Good', () => {
    const anxiety = 'Do you experience frequent anxiety or worry?';
    render(
      <AnswersReview
        categories={categories}
        answers={answers((q) => (q.questionText === anxiety ? worst(q) : null))}
      />,
    );
    const mental = screen.getByRole('region', { name: 'Mental' });
    expect(within(mental).getByText('Good')).toBeInTheDocument();
    const flagged = within(mental).getByRole('list', { name: 'Answers to discuss with the doctor' });
    expect(within(flagged).getByText(anxiety)).toBeInTheDocument();
    expect(within(flagged).getByText('Often')).toBeInTheDocument();
  });

  it('flags nothing when no answer is at the worst level', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    expect(flaggedList()).toBeNull();
  });

  it('explains the overall average', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    const overall = screen.getByRole('region', { name: 'Overall Summary' });
    expect(within(overall).getByText(/overall wellness is excellent/i)).toBeInTheDocument();
  });

  it('explains why the lowest possible score is 25%', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    expect(screen.getByText(/lowest possible score is 25%/i)).toBeInTheDocument();
  });

  it('switches the whole results view to Tagalog', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tagalog' }));

    const spiritual = screen.getByRole('region', { name: 'Espirituwal' });
    expect(within(spiritual).getByText('Napakahusay')).toBeInTheDocument();
    expect(within(spiritual).getByText('Malinaw ba sa iyo ang iyong layunin sa buhay?')).toBeInTheDocument();
    expect(within(spiritual).queryByText('Excellent')).toBeNull();
    expect(screen.getByText(/pinakamababang posibleng marka/i)).toBeInTheDocument();
  });

  it('switches to Bisaya', () => {
    render(<AnswersReview categories={categories} answers={answers()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Bisaya' }));
    const overall = screen.getByRole('region', { name: 'Kinatibuk-ang Sumaryo' });
    expect(within(overall).getByText(/Maayo kaayo ang imong kinatibuk-ang kahimsog/)).toBeInTheDocument();
  });
});
