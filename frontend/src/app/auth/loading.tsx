import Spinner from '@/components/ui/Spinner';

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
