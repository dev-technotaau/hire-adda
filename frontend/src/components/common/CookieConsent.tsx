'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Cookie } from 'lucide-react';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';

const CONSENT_COOKIE = 'tb_cookie_consent';

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [dismissing, setDismissing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState<CookiePreferences>({
        necessary: true,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const consent = Cookies.get(CONSENT_COOKIE);
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = useCallback((preferences: CookiePreferences) => {
        Cookies.set(CONSENT_COOKIE, JSON.stringify(preferences), { expires: 365 });
        setDismissing(true);
        // Let the slide-out animation play before unmounting
        setTimeout(() => setVisible(false), 300);
    }, []);

    const acceptAll = () => {
        dismiss({ necessary: true, analytics: true, marketing: true });
    };

    const acceptSelected = () => {
        dismiss(prefs);
    };

    const rejectAll = () => {
        dismiss({ necessary: true, analytics: false, marketing: false });
    };

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 transition-all duration-300 ${
                dismissing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
            }`}
        >
            <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light">
                        <Cookie className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--text)]">We value your privacy</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                            By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                        </p>

                        {showDetails && (
                            <div className="mt-4 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text)]">Essential Cookies</p>
                                        <p className="text-xs text-[var(--text-muted)]">Required for the platform to function</p>
                                    </div>
                                    <Switch checked disabled onChange={() => {}} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text)]">Analytics Cookies</p>
                                        <p className="text-xs text-[var(--text-muted)]">Help us understand how visitors use the site</p>
                                    </div>
                                    <Switch
                                        checked={prefs.analytics}
                                        onChange={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text)]">Marketing Cookies</p>
                                        <p className="text-xs text-[var(--text-muted)]">Used to deliver relevant advertisements</p>
                                    </div>
                                    <Switch
                                        checked={prefs.marketing}
                                        onChange={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button size="sm" onClick={acceptAll}>Accept All</Button>
                            <Button size="sm" variant="outline" onClick={rejectAll}>Reject All</Button>
                            {showDetails ? (
                                <Button size="sm" variant="outline" onClick={acceptSelected}>Save Preferences</Button>
                            ) : (
                                <button onClick={() => setShowDetails(true)} className="text-sm text-primary hover:underline">
                                    Customize
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
