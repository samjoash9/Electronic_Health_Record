import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SegmentBar from './SegmentBar';

const item = (list, label) => within(list).getByText(label).closest('li');

describe('SegmentBar', () => {
  it('sizes each segment by its share and lists every segment in the legend', () => {
    const { container } = render(
      <SegmentBar
        label="BMI"
        segments={[
          { key: 'n', label: 'Normal', value: 3, color: '#0f0' },
          { key: 'o', label: 'Obese', value: 1, color: '#f00' },
          { key: 'u', label: 'Underweight', value: 0, color: '#ff0' },
        ]}
      />
    );
    const bars = container.querySelectorAll('[data-segment]');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveStyle({ width: '75%' });

    const legend = screen.getByRole('list', { name: 'BMI legend' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(3);
    expect(within(item(legend, 'Underweight')).getByText('0')).toBeInTheDocument();
  });

  it('draws an empty track when every segment is zero', () => {
    const { container } = render(
      <SegmentBar label="BMI" segments={[{ key: 'n', label: 'Normal', value: 0, color: '#0f0' }]} />
    );
    expect(container.querySelectorAll('[data-segment]')).toHaveLength(0);
  });

  it('never draws a negative segment', () => {
    const { container } = render(
      <SegmentBar
        label="Budget"
        segments={[
          { key: 'used', label: 'Consumed', value: 120, color: '#f00' },
          { key: 'left', label: 'Remaining', value: -20, color: '#eee' },
        ]}
      />
    );
    const bars = container.querySelectorAll('[data-segment]');
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveStyle({ width: '100%' });
  });

  it('formats legend figures with the given formatter', () => {
    render(
      <SegmentBar
        label="Budget"
        format={(v) => `₱${v}`}
        segments={[{ key: 'used', label: 'Consumed', value: 5, color: '#f00' }]}
      />
    );
    const legend = screen.getByRole('list', { name: 'Budget legend' });
    expect(within(item(legend, 'Consumed')).getByText('₱5')).toBeInTheDocument();
  });
});
