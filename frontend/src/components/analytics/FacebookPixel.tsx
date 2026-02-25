'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import Cookies from 'js-cookie';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function FacebookPixel({ nonce }: { nonce?: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const raw = Cookies.get('tb_cookie_consent');
    if (raw) {
      try {
        const prefs = JSON.parse(raw);
        queueMicrotask(() => setConsent(!!prefs.marketing));
      } catch {
        /* ignore */
      }
    }
  }, []);

  if (!FB_PIXEL_ID || !consent) return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive" nonce={nonce}>
        {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${FB_PIXEL_ID}');
                    fbq('track', 'PageView');
                `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
