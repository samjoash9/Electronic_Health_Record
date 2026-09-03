export default function Skeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}
