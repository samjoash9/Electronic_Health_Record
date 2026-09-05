const PALETTES = {
  // Distinct hues, for lists where telling people apart quickly matters.
  vivid: [
    'bg-sky-50 text-sky-600',
    'bg-amber-50 text-amber-600',
    'bg-emerald-50 text-emerald-600',
    'bg-violet-50 text-violet-600',
    'bg-rose-50 text-rose-600',
    'bg-teal-50 text-teal-600',
  ],
  // One cool family, for a table that should stay quiet on a busy page.
  muted: [
    'bg-[#eef2fb] text-[#5b7bb5]',
    'bg-[#eef4fb] text-[#5b8ab5]',
    'bg-[#f0f0fa] text-[#7076b3]',
    'bg-[#edf3f8] text-[#5f88a8]',
    'bg-[#f1f1f7] text-[#7a7fa8]',
    'bg-[#eaf1f7] text-[#5a83a3]',
  ],
};

/**
 * Initials chip for a person in a table row. The tint is derived from the name
 * so the same patient keeps the same colour across renders and screens, which
 * makes a list easier to scan than one flat colour would.
 */
export default function Avatar({ name = '', size = 32, palette = 'vivid' }) {
  const tints = PALETTES[palette] ?? PALETTES.vivid;
  const words = name.replace(/,/g, ' ').trim().split(/\s+/).filter(Boolean);
  const initials = words.length
    ? (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
    : '?';

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % tints.length;

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tints[hash]}`}
    >
      {initials}
    </span>
  );
}
