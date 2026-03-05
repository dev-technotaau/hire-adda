import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
} as const;

export default function Logo({ href = '/', className, size = 'md' }: LogoProps) {
  const img = (
    <Image
      src="/icons/logo.svg"
      alt="TalentBridge"
      width={205}
      height={48}
      className={cn(sizeStyles[size], 'w-auto', className)}
      priority
      fetchPriority="high"
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {img}
      </Link>
    );
  }

  return img;
}
