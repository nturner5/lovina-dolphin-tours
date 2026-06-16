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
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;
  if (gtagId && adsLabel) {
    trackEvent('conversion', {
      send_to: `${gtagId}/${adsLabel}`,
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
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;
  if (gtagId && adsLabel) {
    trackEvent('conversion', {
      send_to: `${gtagId}/${adsLabel}`,
      value: value,
      currency: 'USD',
      transaction_id: transactionId,
    });
  }
};
