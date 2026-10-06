/**
 * A molar drawn to lucide's grid and stroke, since lucide has no tooth. Takes
 * the same `size` and `strokeWidth` as a lucide icon so it can stand in for one.
 */
export default function ToothIcon({ size = 24, strokeWidth = 2, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 5.5C10.8 4.2 9.3 3 7.5 3 5 3 3.5 5 3.5 7.5c0 2 .8 3.4 1.5 5 .7 1.6 1 3.3 1.3 5.3.3 2.2 1 3.2 2 3.2 1.3 0 1.6-1.6 1.9-3.3.3-1.7.8-2.7 1.8-2.7s1.5 1 1.8 2.7c.3 1.7.6 3.3 1.9 3.3 1 0 1.7-1 2-3.2.3-2 .6-3.7 1.3-5.3.7-1.6 1.5-3 1.5-5C20.5 5 19 3 16.5 3c-1.8 0-3.3 1.2-4.5 2.5z" />
    </svg>
  );
}
