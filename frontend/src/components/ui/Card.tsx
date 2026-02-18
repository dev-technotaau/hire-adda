'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'bordered' | 'elevated';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
    default: 'border border-[var(--border)] bg-white',
    bordered: 'border-2 border-[var(--border)] bg-white',
    elevated: 'border border-[var(--border)] bg-white shadow-[var(--shadow-md)]',
};

const paddingStyles: Record<CardPadding, string> = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

function Card({ variant = 'default', padding = 'md', header, footer, children, className, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl transition-all duration-200',
                variantStyles[variant],
                onClick && 'cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--border-hover)]',
                className
            )}
            onClick={onClick}
        >
            {header && (
                <div className={cn(
                    'border-b border-[var(--border)]',
                    padding === 'sm' ? 'px-4 py-3' : padding === 'md' ? 'px-6 py-4' : 'px-8 py-5'
                )}>
                    {header}
                </div>
            )}
            <div className={paddingStyles[padding]}>{children}</div>
            {footer && (
                <div className={cn(
                    'border-t border-[var(--border)]',
                    padding === 'sm' ? 'px-4 py-3' : padding === 'md' ? 'px-6 py-4' : 'px-8 py-5'
                )}>
                    {footer}
                </div>
            )}
        </div>
    );
}

Card.displayName = 'Card';

export default Card;
