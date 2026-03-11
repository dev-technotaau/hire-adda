import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-primary-light mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <FileQuestion className="text-primary h-10 w-10" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-[var(--text)]">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-[var(--text)]">Page Not Found</h2>
        <p className="mb-8 max-w-md text-[var(--text-secondary)]">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back
          on track.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Go to the home page">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </Tooltip>
          <Tooltip content="Visit the help center for assistance">
            <Link href="/help">
              <Button variant="outline">Help Center</Button>
            </Link>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
