'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TopLoadingBar() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const prevPathname = useRef(pathname);
    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

    useEffect(() => {
        if (pathname !== prevPathname.current) {
            // Start loading
            setLoading(true);
            setProgress(20);

            // Incrementally increase progress
            timerRef.current = setInterval(() => {
                setProgress(p => {
                    if (p >= 90) {
                        clearInterval(timerRef.current);
                        return 90;
                    }
                    return p + Math.random() * 15;
                });
            }, 200);

            // Complete after a short delay (page already rendered)
            const completeTimer = setTimeout(() => {
                clearInterval(timerRef.current);
                setProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    setProgress(0);
                }, 200);
            }, 300);

            prevPathname.current = pathname;

            return () => {
                clearInterval(timerRef.current);
                clearTimeout(completeTimer);
            };
        }
    }, [pathname]);

    if (!loading) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-[300] h-0.5">
            <div
                className="h-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
