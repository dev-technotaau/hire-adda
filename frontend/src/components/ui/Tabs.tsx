'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
    key: string;
    label: string;
}

type TabVariant = 'underline' | 'pills';

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (key: string) => void;
    variant?: TabVariant;
    children?: ReactNode;
    className?: string;
}

function Tabs({ tabs, activeTab, onChange, variant = 'underline', children, className }: TabsProps) {
    const panelId = `tabpanel-${activeTab}`;

    return (
        <div className={cn('w-full', className)}>
            <div
                role="tablist"
                className={cn(
                    'flex',
                    variant === 'underline' && 'border-b border-[var(--border)] gap-0',
                    variant === 'pills' && 'bg-[var(--bg-tertiary)] rounded-lg p-1 gap-1'
                )}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const tabId = `tab-${tab.key}`;

                    return (
                        <button
                            key={tab.key}
                            id={tabId}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${tab.key}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => onChange(tab.key)}
                            className={cn(
                                'text-sm font-medium transition-all duration-200 whitespace-nowrap',
                                variant === 'underline' && cn(
                                    'px-4 py-2.5 border-b-2 -mb-px',
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]'
                                ),
                                variant === 'pills' && cn(
                                    'px-3 py-1.5 rounded-md',
                                    isActive
                                        ? 'bg-white text-[var(--text)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                )
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            {children && (
                <div
                    role="tabpanel"
                    id={panelId}
                    aria-labelledby={`tab-${activeTab}`}
                    className="mt-4"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

Tabs.displayName = 'Tabs';

export default Tabs;
