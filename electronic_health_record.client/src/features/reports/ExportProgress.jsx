import PropTypes from 'prop-types';

/** Fills as the PDF export captures each chart, naming the one in hand. */
export default function ExportProgress({ done, total }) {
  const label = done < total ? `Capturing chart ${done + 1} of ${total}` : 'Saving PDF…';

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs text-ink-500">{label}</p>
      <div
        role="progressbar"
        aria-label="Export progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-1.5 overflow-hidden rounded-full bg-brand-50"
      >
        <div
          className="h-full rounded-full bg-brand-600 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

ExportProgress.propTypes = {
  done: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};
