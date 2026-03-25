import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
} as const;

export default function Logo({ href = '/', className, size = 'md' }: LogoProps) {
  const img = (
    <Image
      src="/icons/logo.svg"
      alt="HireAdda"
      width={205}
      height={48}
      className={cn(sizeStyles[size], 'w-auto', className)}
      priority
      fetchPriority="high"
    />
  );

  if (href) {
    return (
      <Tooltip content="Go to homepage">
        <Link href={href} className="flex items-center">
          {img}
        </Link>
      </Tooltip>
    );
  }

  return img;
}
