import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold text-[var(--text)]">Not Found</h2>
            <p className="text-[var(--text-light)]">The requested resource could not be found.</p>
            <Link
                href="/candidate/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
                Go Back
            </Link>
        </div>
    );
}
