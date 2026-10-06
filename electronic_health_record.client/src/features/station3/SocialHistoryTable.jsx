import { Activity, Cigarette, Dumbbell, Wine } from 'lucide-react';
import { daysPerWeek, socialHistoryRows, yearsSince } from '../../lib/consultationRecord';
import { RecordSection, NotRecorded } from './RecordParts';

const HABITS = {
  smoking: { label: 'Smoking', icon: Cigarette, tone: 'risk' },
  exercise: { label: 'Exercise', icon: Dumbbell, tone: 'healthy' },
  alcohol: { label: 'Alcohol', icon: Wine, tone: 'risk' },
};

// Smoking and drinking in amber, exercise in the brand teal: the colour says
// which habits are the ones to cut back on without needing a legend.
const TONES = {
  risk: { tile: 'bg-amber-50 text-amber-700', text: 'text-amber-700', bar: 'bg-amber-500' },
  healthy: { tile: 'bg-[#e9fbf6] text-[#0e7d6b]', text: 'text-[#0e7d6b]', bar: 'bg-[#0e7d6b]' },
};

const years = (n) => `${n} year${n === 1 ? '' : 's'}`;

const CELL = 'px-4 py-3 align-top';

/** Days of the week the habit takes up. Decoration: the frequency beside it says the same. */
function WeekMeter({ days, tone }) {
  return (
    <span aria-hidden className="mt-1.5 flex gap-0.5">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={`h-1 w-3 rounded-full ${i < days ? TONES[tone].bar : 'bg-gray-200'}`} />
      ))}
    </span>
  );
}

function HabitRow({ row, asOf }) {
  const habit = HABITS[row.habit];
  const tone = TONES[habit.tone];
  const Icon = habit.icon;
  const blank = !row.none && !row.type && !row.frequency && !row.amount?.length && !row.yearStarted;
  const days = daysPerWeek(row.frequency);
  const since = yearsSince(row.yearStarted, asOf);

  return (
    <tr>
      <th scope="row" className={`${CELL} font-semibold text-ink-900`}>
        <span className="flex items-center gap-2.5">
          <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.tile}`}>
            <Icon size={15} />
          </span>
          {habit.label}
        </span>
      </th>

      {row.none && <td colSpan={4} className={`${CELL} text-ink-500`}>{row.none}</td>}
      {blank && <td colSpan={4} className={CELL}><NotRecorded /></td>}

      {!row.none && !blank && (
        <>
          <td className={`${CELL} ${row.habit === 'exercise' ? 'font-medium text-[#0e7d6b]' : 'text-ink-900'}`}>
            {row.type ?? <NotRecorded />}
          </td>
          <td className={CELL}>
            {row.frequency ? (
              <>
                <span className={`font-semibold ${tone.text}`}>{row.frequency}</span>
                {days !== null && <WeekMeter days={days} tone={habit.tone} />}
              </>
            ) : <NotRecorded />}
          </td>
          <td className={CELL}>
            {row.amount.length > 0
              ? row.amount.map((line, i) => (
                <span key={line} className={i === 0 ? 'block font-medium text-ink-900' : 'block text-xs text-ink-500'}>{line}</span>
              ))
              : <NotRecorded />}
          </td>
          <td className={CELL}>
            {row.yearStarted ? (
              <>
                <span className="block font-semibold text-ink-900">{row.yearStarted}</span>
                {since !== null && <span className="block text-xs text-ink-500">{since === 0 ? 'This year' : years(since)}</span>}
              </>
            ) : <NotRecorded />}
          </td>
        </>
      )}
    </tr>
  );
}

/** Smoking, exercise and alcohol as one table; `asOf` is the visit year "since" counts to. */
export default function SocialHistoryTable({ id, social, exercise, asOf }) {
  const rows = socialHistoryRows(social, exercise);

  return (
    <RecordSection id={id} icon={Activity} title="Social history" subtitle="Lifestyle habits recorded during the consultation">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table aria-labelledby={id} className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line bg-gray-50 text-xs text-ink-500">
            <tr>
              {['Habit', 'Type', 'How often', 'Amount', 'Since'].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-2.5 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => <HabitRow key={`${row.habit}-${i}`} row={row} asOf={asOf} />)}
          </tbody>
        </table>
      </div>
    </RecordSection>
  );
}
