/** Google Analytics event tracking */
export function pageView(url: string) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
            page_path: url,
        });
    }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value,
        });
    }
}

export function trackConversion(conversionId: string) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
            send_to: conversionId,
        });
    }
}

// Facebook Pixel
export function fbEvent(event: string, params?: Record<string, unknown>) {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', event, params);
    }
}

// Type declarations for global tracking scripts
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        fbq?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}
