// Long enough to read as growth from the baseline, short enough not to hold
// up reading the numbers. Recharts' own defaults run a pie for 1.9s.
const DRAW_IN_MS = { bar: 500, pie: 700, line: 800 };

/**
 * Draw-in props for a Recharts Bar, Pie or Line on the health reports.
 * While the PDF export captures, every chart draws at once and unanimated,
 * so no snapshot catches a bar mid-growth.
 */
export function chartMotion(kind, exporting) {
  return {
    // 'auto' plays the draw-in unless the OS asks for reduced motion.
    isAnimationActive: exporting ? false : 'auto',
    animationBegin: 0,
    animationDuration: DRAW_IN_MS[kind],
    animationEasing: 'ease-out',
  };
}
