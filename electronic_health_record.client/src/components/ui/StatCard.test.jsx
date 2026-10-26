import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('shows the label and figure', () => {
    render(<StatCard label="Total Patients" value={5} icon={Users} />);
    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('tints the phone-only underline bar with the accent', () => {
    const { container } = render(<StatCard label="Cancelled" value={0} icon={Users} accent="red" />);
    const bar = container.querySelector('[aria-hidden="true"].md\\:hidden');
    expect(bar).toHaveClass('bg-red-500');
  });

  it('falls back to the brand accent for an unknown accent name', () => {
    const { container } = render(<StatCard label="Total Forms" value={5} icon={Users} accent="nope" />);
    const bar = container.querySelector('[aria-hidden="true"].md\\:hidden');
    expect(bar).toHaveClass('bg-[#37AF9B]');
  });
});
