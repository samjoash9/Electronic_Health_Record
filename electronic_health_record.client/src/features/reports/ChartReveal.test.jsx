import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartReveal from './ChartReveal';
import { installFakeIntersectionObserver } from '../../test/fakeIntersectionObserver';

afterEach(() => vi.unstubAllGlobals());

const chart = <p>BMI chart</p>;

describe('ChartReveal', () => {
  it('holds the chart back until its box scrolls into view', () => {
    const io = installFakeIntersectionObserver();
    const { container } = render(<ChartReveal className="h-72">{chart}</ChartReveal>);
    const box = container.firstChild;

    // The empty box keeps its height, so nothing below it jumps on reveal.
    expect(box).toHaveClass('h-72');
    expect(screen.queryByText('BMI chart')).not.toBeInTheDocument();

    io.setInView(box);

    expect(screen.getByText('BMI chart')).toBeInTheDocument();
  });

  it('keeps the chart once drawn, even after it scrolls away', () => {
    const io = installFakeIntersectionObserver();
    const { container } = render(<ChartReveal>{chart}</ChartReveal>);

    io.setInView(container.firstChild);
    io.setInView(container.firstChild, false);

    expect(screen.getByText('BMI chart')).toBeInTheDocument();
  });

  it('draws the chart without waiting when forced, as a PDF export does', () => {
    installFakeIntersectionObserver();
    render(<ChartReveal force>{chart}</ChartReveal>);

    expect(screen.getByText('BMI chart')).toBeInTheDocument();
  });

  it('draws the chart straight away where IntersectionObserver is missing', () => {
    render(<ChartReveal>{chart}</ChartReveal>);

    expect(screen.getByText('BMI chart')).toBeInTheDocument();
  });
});
