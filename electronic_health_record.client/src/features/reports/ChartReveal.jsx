import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Holds a chart back until its box scrolls into view, so its draw-in plays
 * where the reader is looking instead of offscreen on page load. Once drawn
 * it stays drawn. The box keeps its size meanwhile, so nothing below jumps.
 *
 * `force` draws it now regardless: the PDF export captures stations the
 * reader never scrolled to. Without IntersectionObserver nothing waits.
 */
export default function ChartReveal({ force = false, className, style, children }) {
  const boxRef = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (seen) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
      },
      // Waits until the box clears the bottom 15% of the screen, so the
      // draw-in isn't spent on a sliver at the edge.
      { rootMargin: '0px 0px -15% 0px' }
    );
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <div ref={boxRef} data-chart-box="" className={className} style={style}>
      {seen || force ? children : null}
    </div>
  );
}

ChartReveal.propTypes = {
  force: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};
