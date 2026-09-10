import Button from './Button';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-sm text-rose-600">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
