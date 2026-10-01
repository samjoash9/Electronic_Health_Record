// Same green / amber / rose split as ScoreBar, with a deeper shade for the
// worse band of each pair so a chip reads correctly without its bar beside it.
const TONES = {
  excellent: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  fair: 'bg-amber-50 text-amber-700 ring-amber-200',
  attention: 'bg-amber-100 text-amber-800 ring-amber-300',
  support: 'bg-rose-100 text-rose-800 ring-rose-200',
};

/** A score band as a coloured pill; `label` is already translated. */
export default function BandChip({ band, label }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${TONES[band] ?? ''}`}>
      {label}
    </span>
  );
}
