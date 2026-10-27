// Fallback while a lazily loaded page's code arrives (see routes.jsx).
// fullScreen for the routes outside AppShell, which have no layout around them.
export default function PageLoader({ fullScreen = false }) {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-slate-100' : 'h-full min-h-48'}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
    </div>
  );
}
