import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// A strip a third of the way down the screen: the station crossing it is the
// one being read.
const READING_LINE = '-30% 0px -65% 0px';

// The station a jump lands on rings once, so the eye finds where it ended.
const LANDING_RING = [
  { outline: '3px solid rgb(55 175 155 / 0)', outlineOffset: '2px' },
  { outline: '3px solid rgb(55 175 155 / 0.55)', outlineOffset: '4px', offset: 0.25 },
  { outline: '3px solid rgb(55 175 155 / 0)', outlineOffset: '8px' },
];

// Browsers without `scrollend`, and jumps to a station already in place,
// never report the glide ending. Ring anyway once any glide would be over.
const LANDING_FALLBACK_MS = 1000;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Moves the pill under the current chip; `glide` slides it there. */
function placePill(list, pill, glide) {
  const chip = list?.querySelector('[aria-current="location"]');
  if (!chip || !pill) return;
  if (!glide) pill.style.transition = 'none';
  pill.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;
  pill.style.width = `${chip.offsetWidth}px`;
  pill.style.height = `${chip.offsetHeight}px`;
  if (!glide) {
    pill.getBoundingClientRect(); // lands the snap before the transition comes back
    pill.style.transition = '';
  }
}

/**
 * Scrolls a narrow bar sideways so the current chip stays in view. Sets
 * `scrollLeft` rather than calling scrollIntoView, which would also nudge
 * the page mid-glide.
 */
function revealChip(list) {
  const chip = list?.querySelector('[aria-current="location"]');
  if (!chip) return;
  const { offsetLeft: left, offsetWidth: width } = chip;
  if (left < list.scrollLeft) list.scrollLeft = left;
  else if (left + width > list.scrollLeft + list.clientWidth) list.scrollLeft = left + width - list.clientWidth;
}

/** Rings `card` once the current glide ends. Returns a cancel function. */
function ringOnLanding(card) {
  let timer;
  const cancel = () => {
    clearTimeout(timer);
    document.removeEventListener('scrollend', land, true);
  };
  const land = () => {
    cancel();
    card?.animate?.(LANDING_RING, { duration: 1200, easing: 'ease-out' });
  };
  // Capture: scrollend doesn't bubble, and the page scrolls inside <main>.
  document.addEventListener('scrollend', land, true);
  timer = setTimeout(land, LANDING_FALLBACK_MS);
  return cancel;
}

/**
 * The sticky bar's station links. Tracks which station is being read, with a
 * pill that slides to it, and rings the station a jump lands on.
 */
export default function QuickJumpNav({ stations, stickyBarRef }) {
  const [activeId, setActiveId] = useState(stations[0].id);
  const listRef = useRef(null);
  const pillRef = useRef(null);
  const placedRef = useRef(false);
  const cancelLandingRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const reading = entries.find((entry) => entry.isIntersecting);
        if (reading) setActiveId(reading.target.id);
      },
      { rootMargin: READING_LINE }
    );
    for (const { id } of stations) {
      const station = document.getElementById(id);
      if (station) observer.observe(station);
    }
    return () => observer.disconnect();
  }, [stations]);

  // Slides between stations; the first placement snaps.
  useLayoutEffect(() => {
    placePill(listRef.current, pillRef.current, placedRef.current);
    revealChip(listRef.current);
    placedRef.current = true;
  }, [activeId]);

  // Snaps along when the bar resizes.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const list = listRef.current;
    const observer = new ResizeObserver(() => placePill(list, pillRef.current, false));
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const jumpTo = (id) => {
    const station = document.getElementById(id);
    if (!station) return;
    cancelLandingRef.current?.();
    cancelLandingRef.current = null;

    // Land below the sticky bar, not under it.
    station.style.scrollMarginTop = `${(stickyBarRef.current?.offsetHeight ?? 0) + 24}px`;
    const reduceMotion = prefersReducedMotion();
    station.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (!reduceMotion) cancelLandingRef.current = ringOnLanding(station.firstElementChild);
  };

  return (
    <nav aria-label="Stations" className="flex min-w-0 flex-1 items-center gap-3">
      <span className="hidden shrink-0 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:inline">
        Quick Jump:
      </span>
      {/* One row that scrolls sideways when the bar is too narrow to fit it. */}
      <div
        ref={listRef}
        className="relative flex min-w-0 items-center gap-1 overflow-x-auto p-0.5 motion-safe:scroll-smooth scrollbar-none sm:gap-2 lg:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        <span
          ref={pillRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 rounded-lg bg-brand-600 shadow-sm motion-safe:transition-[transform,width,height] motion-safe:duration-200 motion-safe:ease-out"
        />
        {stations.map(({ id, label }) => {
          const current = id === activeId;
          return (
            <button
              key={id}
              type="button"
              aria-current={current ? 'location' : undefined}
              onClick={() => jumpTo(id)}
              className={`relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 cursor-pointer ${
                current ? 'text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

QuickJumpNav.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  stickyBarRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};
