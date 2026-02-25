'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackEvent } from '@/lib/analytics';

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Report to Google Analytics
    trackEvent('web_vitals', metric.name, metric.id, Math.round(metric.value));

    // Log poor performance in development
    if (process.env.NODE_ENV === 'development') {
      const threshold: Record<string, number> = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        INP: 200,
        TTFB: 800,
      };
      if (threshold[metric.name] && metric.value > threshold[metric.name]) {
        console.warn(`[Web Vitals] Poor ${metric.name}: ${metric.value.toFixed(2)}`);
      }
    }
  });

  return null;
}
