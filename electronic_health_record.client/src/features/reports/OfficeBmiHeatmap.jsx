import ReportCard from './ReportCard';
import { BMI_CLASSES } from './reportTheme';

// One teal ramp, light to dark, for "share of the office's patients". The
// scale tops out at 60%: past that every cell would read the same.
const RAMP_LIGHT = [238, 250, 247]; // #eefaf7
const RAMP_DARK = [14, 111, 96]; // #0e6f60
const SCALE_MAX = 60;

function cellColor(pct) {
  const t = Math.min(pct / SCALE_MAX, 1);
  const [r, g, b] = RAMP_LIGHT.map((light, i) => Math.round(light + (RAMP_DARK[i] - light) * t));
  return { backgroundColor: `rgb(${r}, ${g}, ${b})`, color: t > 0.55 ? '#ffffff' : '#1e293b' };
}

const pct = (count, total) => (total ? Math.round((count / total) * 100) : 0);

/**
 * Offices against BMI classes, each cell the share of that office's
 * patients. Always lists every office -- it is the comparison the office
 * filter cannot give -- with the filtered office highlighted.
 */
export default function OfficeBmiHeatmap({ rows, selectedOffice }) {
  return (
    <ReportCard
      eyebrow="BMI by office"
      title="Share of each office's patients in each BMI class"
      aside={(
        <div className="flex items-center gap-2 text-xs text-ink-500" aria-hidden="true">
          <span>0%</span>
          <span
            className="h-2 w-28 rounded-full"
            style={{ backgroundImage: `linear-gradient(to right, rgb(${RAMP_LIGHT}), rgb(${RAMP_DARK}))` }}
          />
          <span>{SCALE_MAX}%+</span>
        </div>
      )}
    >
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0.5 text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2 font-semibold">Office</th>
              <th className="w-20 px-3 py-2 text-right font-semibold">Patients</th>
              {BMI_CLASSES.map((c) => (
                <th key={c.key} className="w-28 px-3 py-2 text-center font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.office === selectedOffice;
              return (
                <tr key={row.office} aria-current={selected || undefined}>
                  <td
                    className={`max-w-0 truncate rounded-md px-3 py-2 ${selected ? 'bg-[#e9fbf6] font-semibold text-ink-900' : 'text-ink-700'}`}
                    title={row.office}
                  >
                    {row.office}
                  </td>
                  <td className="px-3 py-2 text-right text-ink-600 tabular-nums">{row.total}</td>
                  {BMI_CLASSES.map((c) => {
                    const share = pct(row.bmi[c.key], row.total);
                    return (
                      <td
                        key={c.key}
                        className="rounded-md px-3 py-2 text-center text-xs font-semibold tabular-nums"
                        style={cellColor(share)}
                        title={`${row.bmi[c.key]} of ${row.total} patients`}
                      >
                        {share}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReportCard>
  );
}
