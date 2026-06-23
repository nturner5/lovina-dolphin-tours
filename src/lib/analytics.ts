/**
 * Google Analytics & Google Ads Event Tracking Helpers
 */

// Safe wrapper to call gtag
export const trackEvent = (action: string, params: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', action, params);
      console.log(`[Analytics] Tracked Event: ${action}`, params);
    } catch (err) {
      console.warn('[Analytics] Failed to send event to gtag:', err);
    }
  } else {
    // Silent fallback in dev or when blocked
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics Mock] Event: ${action}`, params);
    }
  }
};

/**
 * Helper to determine the target for a Google Ads conversion action.
 * Uses NEXT_PUBLIC_GADS_ID (AW-XXXXXXXXXX) if defined, otherwise falls back to NEXT_PUBLIC_GTAG_ID.
 */
const getGoogleAdsTarget = (label: string | undefined): string | null => {
  if (!label) return null;
  const gadsId = process.env.NEXT_PUBLIC_GADS_ID;
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;

  if (gadsId) {
    return `${gadsId}/${label}`;
  }
  if (gtagId) {
    return `${gtagId}/${label}`;
  }
  return null;
};

/**
 * Tracks a click on any WhatsApp contact link.
 * Maps to a "Lead" in Google Ads / GA4.
 */
export const trackWhatsAppClick = (label: string) => {
  trackEvent('click_whatsapp', {
    event_category: 'Lead',
    event_label: label,
    transport_method: 'whatsapp',
  });
  
  // Explicit Google Ads conversion trigger if a specific Ads Conversion ID/Label is active
  const adsLabel = process.env.NEXT_PUBLIC_GADS_WHATSAPP_LABEL;
  const adsTarget = getGoogleAdsTarget(adsLabel);
  if (adsTarget) {
    trackEvent('conversion', {
      send_to: adsTarget,
      event_category: 'Lead',
    });
  }
};

/**
 * Tracks a successful Stripe transaction completion.
 * Maps to "purchase" and triggers Google Ads conversion tracking.
 */
export const trackPurchase = (value: number, transactionId: string) => {
  // 1. Standard GA4 Purchase event
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
  });

  // 2. Explicit Google Ads Conversion event
  const adsLabel = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL;
  const adsTarget = getGoogleAdsTarget(adsLabel);
  if (adsTarget) {
    trackEvent('conversion', {
      send_to: adsTarget,
      value: value,
      currency: 'USD',
      transaction_id: transactionId,
    });
  }
};

/**
 * Tracks the start of the checkout process.
 * Maps to "begin_checkout" in GA4 and triggers Google Ads conversion tracking if a label is defined.
 */
export const trackBeginCheckout = (value: number, tourId: string, tourName: string, price: number, quantity: number) => {
  // 1. GA4 Standard event
  trackEvent('begin_checkout', {
    value: value,
    currency: 'USD',
    items: [{
      item_id: tourId,
      item_name: tourName,
      price: price,
      quantity: quantity,
    }]
  });

  // 2. Google Ads conversion if label configured
  const adsLabel = process.env.NEXT_PUBLIC_GADS_CHECKOUT_LABEL;
  const adsTarget = getGoogleAdsTarget(adsLabel);
  if (adsTarget) {
    trackEvent('conversion', {
      send_to: adsTarget,
      value: value,
      currency: 'USD',
    });
  }
};

/**
 * Tracks a page view event, useful for client-side navigation in Next.js App Router.
 */
export const trackPageView = (path: string) => {
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;
  if (gtagId && typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('config', gtagId, {
        page_path: path,
      });
      console.log(`[Analytics] Tracked Page View: ${path}`);
    } catch (err) {
      console.warn('[Analytics] Failed to send page_view to gtag:', err);
    }
  }
};


