import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExportProgress from './ExportProgress';

describe('ExportProgress', () => {
  it('names the chart being captured and reports how far along it is', () => {
    render(<ExportProgress done={2} total={14} />);

    expect(screen.getByText(/chart 3 of 14/i)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: /export progress/i });
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '14');
  });

  it('says the PDF is being saved once every chart is captured', () => {
    render(<ExportProgress done={14} total={14} />);

    expect(screen.getByText(/saving pdf/i)).toBeInTheDocument();
  });
});
