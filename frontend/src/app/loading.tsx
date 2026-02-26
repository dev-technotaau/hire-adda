import Spinner from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
