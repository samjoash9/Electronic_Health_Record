import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { FlagList, PrevalenceList, RankedList } from './ReportLists';

const item = (list, label) => within(list).getByText(label).closest('li');

describe('RankedList', () => {
  it('keeps the server order and formats each figure', () => {
    render(
      <RankedList
        title="Top items"
        format={(v) => `${v} pcs`}
        items={[{ name: 'CBC', value: 5 }, { name: 'Urinalysis', value: 3 }]}
      />
    );
    const rows = within(screen.getByRole('list', { name: 'Top items' })).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('CBC');
    expect(within(rows[0]).getByText('5 pcs')).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('Urinalysis');
  });

  it('says none were recorded when the list is empty', () => {
    render(<RankedList title="Top items" items={[]} />);
    expect(screen.getByText('None recorded.')).toBeInTheDocument();
  });
});

describe('PrevalenceList', () => {
  it('shows each count with its share of the total', () => {
    render(
      <PrevalenceList
        title="Findings"
        total={5}
        color="#f59e0b"
        items={[{ key: 'caries', label: 'Dental caries', count: 3 }]}
      />
    );
    const row = item(screen.getByRole('list', { name: 'Findings' }), 'Dental caries');
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('60%')).toBeInTheDocument();
  });

  it('shows an em dash for the share when there is no total', () => {
    render(
      <PrevalenceList title="Findings" total={0} color="#000" items={[{ key: 'c', label: 'Caries', count: 0 }]} />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('FlagList', () => {
  it('marks alerting flags and leaves the rest plain', () => {
    render(
      <FlagList
        items={[
          { label: 'Urgent referral', value: 1, alert: true },
          { label: 'Routine referral', value: 2, alert: false },
        ]}
      />
    );
    const flags = screen.getByRole('list', { name: 'Flags' });
    expect(item(flags, 'Urgent referral')).toHaveClass('text-rose-600');
    expect(item(flags, 'Routine referral')).not.toHaveClass('text-rose-600');
    expect(within(item(flags, 'Routine referral')).getByText('2')).toBeInTheDocument();
  });
});
