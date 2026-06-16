'use client';

import { useState, useEffect, Suspense } from 'react';
import { t } from '@/locales/i18n';
import { useLocale } from '@/locales/i18n-client';
import { trackWhatsAppClick } from '@/lib/analytics';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber, getCountryCallingCode } from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';


const DEFAULT_TOURS = [
  { id: 'seven-am-ethical', name: '7:00 AM Private Dolphin Watching Tour', price: 45, time: '7:00 AM' },
  { id: 'swim-snorkel', name: '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel', price: 65, time: '7:00 AM' },
];

const DEFAULT_PICKUP_OPTIONS = [
  { id: 'none', name: 'No Driver (Meet at Lovina Beach by 6:30 AM)', price: 0 },
  { id: 'lovina', name: 'Free Local Shuttle (Lovina Beach Area - Pickup ~6:30 AM)', price: 0 },
  { id: 'ubud', name: 'Ubud Round-trip Private Driver (Pickup ~4:30 AM)', price: 35 },
  { id: 'canggu-kuta', name: 'Canggu / Seminyak / Kuta Round-trip Private Driver (Pickup ~4:00 AM)', price: 50 },
  { id: 'uluwatu', name: 'Uluwatu / Nusa Dua Round-trip Private Driver (Pickup ~3:30 AM)', price: 65 },
];

const getBaliDateString = (offsetDays = 0) => {
  const tzDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
  if (offsetDays !== 0) {
    tzDate.setDate(tzDate.getDate() + offsetDays);
  }
  const y = tzDate.getFullYear();
  const m = String(tzDate.getMonth() + 1).padStart(2, '0');
  const d = String(tzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function CheckoutForm() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState(DEFAULT_TOURS);
  const [pickupOptions, setPickupOptions] = useState(DEFAULT_PICKUP_OPTIONS);

  const [formData, setFormData] = useState({
    tourId: DEFAULT_TOURS[0].id,
    date: '',
    guests: 2,
    name: '',
    email: '',
    whatsappNumber: '',
    hotelDetails: '',
    pickupLocation: 'none',
  });

  const [minDate, setMinDate] = useState<string>('');
  const [isLastMinute, setIsLastMinute] = useState(false);

  // Load dynamic pricing from the server cache on load
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          if (data.tours && data.tours.length > 0) {
            setTours(data.tours);
          }
          if (data.pickups && data.pickups.length > 0) {
            setPickupOptions(data.pickups);
          }
        }
      } catch (e) {
        console.error('Failed to load dynamic pricing from Stripe:', e);
      }
    };
    fetchPricing();
  }, []);

  // Calculate dynamic WhatsApp URL for last-minute booking
  const getWhatsAppUrl = () => {
    if (!formData.date) return '';
    const prefilledTemplate = t('lastMinuteMsgPrefilled', locale);
    const messageText = prefilledTemplate
      .replace('{date}', formData.date)
      .replace('{guests}', String(formData.guests));
    return `https://wa.me/18018556266?text=${encodeURIComponent(messageText)}`;
  };

  const whatsappUrl = getWhatsAppUrl();

  useEffect(() => {
    setMinDate(getBaliDateString(0));
  }, []);

  useEffect(() => {
    if (!formData.date) {
      setIsLastMinute(false);
      return;
    }
    const tomorrowStr = getBaliDateString(1);
    setIsLastMinute(formData.date <= tomorrowStr);
  }, [formData.date]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tourParam = params.get('tour');
      if (tourParam && DEFAULT_TOURS.some(t => t.id === tourParam)) {
        setFormData(prev => ({ ...prev, tourId: tourParam }));
      }
    }
  }, []);

  // Dynamic WhatsApp validation using Google's libphonenumber engine
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('AU'); // Default to Australia

  const isValidPhone = whatsappNumber ? isValidPhoneNumber(whatsappNumber) : false;
  const callingCode = selectedCountry ? `+${getCountryCallingCode(selectedCountry as any)}` : '';

  const handlePhoneChange = (val: string) => {
    if (!val) {
      setWhatsappNumber('');
      return;
    }

    let currentCountry = selectedCountry;

    if (currentCountry) {
      try {
        const code = getCountryCallingCode(currentCountry as any);
        const prefix = `+${code}`;
        
        // If it starts with +{callingCode} followed by something
        if (val.startsWith(prefix)) {
          const rest = val.slice(prefix.length);
          if (rest.startsWith('+') || /^\d+$/.test(rest)) {
            const testVal = rest.startsWith('+') ? rest : `+${rest}`;
            const parsed = parsePhoneNumberFromString(testVal);
            if (parsed && parsed.isValid()) {
              setWhatsappNumber(parsed.number as string);
              if (parsed.country && parsed.country !== currentCountry) {
                setSelectedCountry(parsed.country);
              }
              return;
            }
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    // Fallback double prefix check (e.g., while typing or if invalid)
    if (currentCountry) {
      try {
        const code = getCountryCallingCode(currentCountry as any);
        const doublePrefix = `+${code}${code}`;
        if (val.startsWith(doublePrefix)) {
          const corrected = `+${code}${val.slice(doublePrefix.length)}`;
          setWhatsappNumber(corrected);
          
          const parsed = parsePhoneNumberFromString(corrected);
          if (parsed && parsed.country && parsed.country !== currentCountry) {
            setSelectedCountry(parsed.country);
          }
          return;
        }
      } catch (e) {}
    }

    setWhatsappNumber(val);
  };


  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isValidPhone) {
      alert(t('invalidPhoneAlert', locale));
      setLoading(false);
      return;
    }

    if (isLastMinute) {
      if (whatsappUrl) {
        trackWhatsAppClick('Last-Minute Redirect');
        window.open(whatsappUrl, '_blank');
      }
      setLoading(false);
      return;
    }

    const selectedTour = tours.find(t => t.id === formData.tourId)!;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          whatsappNumber: whatsappNumber, // Send cleanly formatted E.164 international number (e.g., +61412345678)
          tourName: selectedTour.name,
          price: selectedTour.price,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert(error);
        setLoading(false);
        return;
      }

      if (url) {
        window.location.assign(url);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const selectedTour = tours.find(t => t.id === formData.tourId) || tours[0];

  return (
    <main className="bg-cloud-dancer min-h-screen px-4 sm:px-6 pt-12 pb-24 lg:pt-16 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Secure SSL Trust Indicator */}
        <div className="flex items-center justify-center gap-2 mb-3 text-transformative-teal/70 font-semibold tracking-widest text-[10px] uppercase select-none animate-in fade-in duration-700">
          <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2-0 002-2v-6a2 2-0 00-2-2H6a2 2-0 00-2 2v6a2 2-0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {t('sslIndicator', locale)}
        </div>

        <h1 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-8 lg:mb-12 text-center">{t('checkoutTitle', locale)}</h1>
        
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Form Capsule */}
          <div className="lg:col-span-7">
            <form onSubmit={handleCheckout} className="space-y-6 bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-deep-indigo/5">
              {/* Trust Badge Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-transformative-teal/5 px-6 py-3.5 rounded-2xl border border-transformative-teal/10 text-[11px] leading-none mb-2">
                <span className="font-bold text-deep-indigo">★ 4.9 Guest Rating</span>
                <span className="text-deep-indigo/50 font-light">From premium villa travelers</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('selectTourLabel', locale)}</label>
                <select 
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium cursor-pointer"
                  value={formData.tourId}
                  onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                >
                  {tours.map(tour => {
                    const tourName = tour.id === 'seven-am-ethical' ? t('tour1Title', locale) : t('tour2Title', locale);
                    return (
                      <option key={tour.id} value={tour.id}>
                        {tourName} — ${tour.price} USD {t('tour1PriceDesc', locale)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('dateLabel', locale)}</label>
                  <input 
                    type="date" 
                    required
                    min={minDate}
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('guestsLabel', locale)}</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="8"
                    required
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo font-bold"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: Math.max(2, Math.min(8, parseInt(e.target.value) || 2)) })}
                  />
                </div>
              </div>
              <p className="text-[10px] text-deep-indigo/40 -mt-3 pl-1 leading-normal">
                {t('guestsDisclaimer', locale)}
              </p>

              {/* Last Minute Alert Notice */}
              {isLastMinute && (
                <div className="bg-coral-pop/10 text-coral-pop p-5 rounded-3xl border border-coral-pop/20 text-xs leading-normal animate-in fade-in duration-300 flex items-start gap-3 mt-2">
                  <span className="text-lg leading-none shrink-0 select-none">⚠️</span>
                  <div>
                    <strong className="block font-bold mb-1">
                      {locale === 'en' ? 'Last-Minute Booking Notice' : locale === 'ru' ? 'Срочное бронирование' : '最后一刻预订须知'}
                    </strong>
                    <p className="opacity-90 leading-relaxed font-light">
                      {t('lastMinuteWarning', locale)}
                      {whatsappUrl && (
                        <a 
                          href={whatsappUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline font-bold hover:text-deep-indigo transition-colors block mt-2 text-coral-pop shrink-0"
                        >
                          {t('lastMinuteWarningLink', locale)} ➔
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('nameLabel', locale)}</label>
                <input 
                  type="text" 
                  required
                  autoComplete="name"
                  placeholder={t("namePlaceholder", locale)}
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('emailLabel', locale)}</label>
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  placeholder={t("emailPlaceholder", locale)}
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('phoneLabel', locale)}</label>
                <div 
                  className="relative flex items-center w-full"
                  style={{ '--calling-code': `"${callingCode}"` } as React.CSSProperties}
                >
                  <PhoneInput
                    defaultCountry="AU"
                    country={selectedCountry as any}
                    onCountryChange={(country) => setSelectedCountry(country || 'AU')}
                    value={whatsappNumber}
                    onChange={(val) => handlePhoneChange(val || '')}
                    required
                    autoComplete="tel"
                    placeholder={t("phonePlaceholder", locale)}
                  />
                  
                  {/* Visual Status Indicator */}
                  {whatsappNumber && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1 select-none z-20 pointer-events-none">
                      {isValidPhone ? (
                        <span className="text-transformative-teal text-base animate-in zoom-in duration-300">✅</span>
                      ) : (
                        <span className="text-coral-pop text-[9px] font-bold uppercase tracking-wider bg-coral-pop/10 px-2 py-1 rounded-md animate-in zoom-in duration-300">Invalid</span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-deep-indigo/40 mt-1.5 pl-1">{t('phoneDisclaimer', locale)}</p>
              </div>

              {formData.pickupLocation !== 'none' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('hotelLabel', locale)}</label>
                  <textarea 
                    required
                    rows={2}
                    autoComplete="street-address"
                    placeholder={t("hotelPlaceholder", locale)}
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo resize-none"
                    value={formData.hotelDetails}
                    onChange={(e) => setFormData({ ...formData, hotelDetails: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">{t('pickupLabel', locale)}</label>
                <select 
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium cursor-pointer"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                >
                  {pickupOptions.map(option => {
                    let optionName = '';
                    if (option.id === 'none') optionName = t('noDriver', locale);
                    else if (option.id === 'lovina') optionName = t('freeShuttle', locale);
                    else if (option.id === 'ubud') optionName = t('ubudDriver', locale);
                    else if (option.id === 'canggu-kuta') optionName = t('cangguDriver', locale);
                    else if (option.id === 'uluwatu') optionName = t('uluwatuDriver', locale);
                    return (
                      <option key={option.id} value={option.id}>
                        {optionName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Dynamic Transfer Details Box */}
              {formData.pickupLocation === 'none' ? (
                <div className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/10 space-y-3 text-xs leading-normal animate-in fade-in duration-300">
                  {locale === 'en' ? (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Self-Drive Meeting Details</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    <p>
                      • <strong>Meeting Location:</strong> Meet at the <a href="https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-indigo hover:text-transformative-teal transition-colors">Lovina Beach Dolphin Statue (Kalibukbuk)</a>.
                    </p>
                    <p>
                      • <strong>Arrival Time:</strong> Please arrive by <strong>6:30 AM</strong>. Our quiet-departure private boat leaves promptly at <strong>7:00 AM</strong> to ensure a private encounter away from the sunrise rush.
                    </p>
                    <p>
                      • <strong>Parking:</strong> Secure public parking is available directly at the main entrance area next to the monument. The captain will meet you by the statue.
                    </p>
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * Note: Our captain will reach out to you via WhatsApp the day before to confirm your arrival.
                    </p>
                  </div>
</>
                  ) : locale === 'ru' ? (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Детали самостоятельного прибытия</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    <p>
                      • <strong>Место встречи:</strong> Пляж Ловина, у <a href="https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-indigo hover:text-transformative-teal transition-colors">статуи дельфина (Калибукбук)</a>.
                    </p>
                    <p>
                      • <strong>Время прибытия:</strong> Пожалуйста, прибудьте к <strong>6:30 утра</strong>. Наша частная лодка отправляется ровно в <strong>7:00 утра</strong>, чтобы обеспечить тихое наблюдение вдали от суеты.
                    </p>
                    <p>
                      • <strong>Парковка:</strong> Охраняемая общественная парковка доступна прямо у главного входа рядом с памятником. Капитан встретит вас у статуи.
                    </p>
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * Примечание: Наш капитан свяжется с вами в WhatsApp накануне для подтверждения.
                    </p>
                  </div>
</>
                  ) : (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>自驾集合详情</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    <p>
                      • <strong>集合地点:</strong> 在 <a href="https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-indigo hover:text-transformative-teal transition-colors">罗威那海滩海豚雕像 (Kalibukbuk)</a> 集合。
                    </p>
                    <p>
                      • <strong>抵达时间:</strong> 请于 <strong>早上6:30</strong> 前抵达。我们的私人船只准时于 <strong>早上7:00</strong> 起航，以避开日出的游船高峰。
                    </p>
                    <p>
                      • <strong>停车信息:</strong> 纪念碑旁的主入口处设有公共停车场。船长将在雕像旁迎接您。
                    </p>
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * 注意：我们的船长将在前一天通过 WhatsApp 与您联系确认。
                    </p>
                  </div>
</>
                  )}
                </div>
              ) : (
                <div className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/10 space-y-3 text-xs leading-normal animate-in fade-in duration-300">
                  {locale === 'en' ? (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Round-Trip Private Transfer Details</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    {formData.pickupLocation === 'lovina' && (
                      <p>
                        • <strong>Local Shuttle:</strong> Complimentary local pickup and drop-off within 2km of Lovina Beach. Your captain will pick you up at <strong>~6:30 AM</strong> for our 7:00 AM quiet departure.
                      </p>
                    )}
                    {formData.pickupLocation === 'ubud' && (
                      <p>
                        • <strong>Ubud Return Transfer:</strong> A dedicated, professional private driver in a comfortable, clean A/C SUV. Includes pickup at your Ubud villa at <strong>~4:30 AM</strong> (approx. 2-hour drive), transport to Lovina, waiting for your tour, and return drop-off to Ubud after you return to shore (~10:00 AM).
                      </p>
                    )}
                    {formData.pickupLocation === 'canggu-kuta' && (
                      <p>
                        • <strong>South Bali Return Transfer:</strong> Private, air-conditioned round-trip transport from Canggu, Seminyak, Kuta, Legian, or Sanur. Because of the 2.5 to 3-hour travel time, your pickup will be scheduled at <strong>~4:00 AM</strong>. Your driver waits in Lovina and returns you to South Bali after the tour.
                      </p>
                    )}
                    {formData.pickupLocation === 'uluwatu' && (
                      <p>
                        • <strong>Uluwatu & Nusa Dua Return Transfer:</strong> Private, air-conditioned round-trip transport from Uluwatu, Nusa Dua, or Jimbaran. Because of the 3.5 to 4-hour travel time, your pickup will be scheduled at <strong>~3:30 AM</strong>. Your driver waits in Lovina and returns you to your resort after the tour.
                      </p>
                    )}
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * Note: Price is a flat-rate per car (covers your entire group up to 4 guests, fuel, and parking). Detailed pickup times will be coordinated with you via WhatsApp.
                    </p>
                  </div>
</>
                  ) : locale === 'ru' ? (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Детали частного трансфера туда и обратно</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    {formData.pickupLocation === 'lovina' && (
                      <p>
                        • <strong>Местный трансфер:</strong> Бесплатный трансфер в пределах 2 км от пляжа Ловина. Капитан заедет за вами в <strong>~6:30 утра</strong>.
                      </p>
                    )}
                    {formData.pickupLocation === 'ubud' && (
                      <p>
                        • <strong>Трансфер из Убуда:</strong> Профессиональный водитель на чистом внедорожнике с кондиционером. Включает трансфер из вашей виллы в <strong>~4:30 утра</strong> (около 2 часов пути), ожидание и обратный трансфер в Убуд.
                      </p>
                    )}
                    {formData.pickupLocation === 'canggu-kuta' && (
                      <p>
                        • <strong>Трансфер с юга Бали:</strong> Частный трансфер из Чангу, Семиньяка, Куты или Санура. Ввиду времени в пути (2.5-3 часа), трансфер начнется в <strong>~4:00 утра</strong>.
                      </p>
                    )}
                    {formData.pickupLocation === 'uluwatu' && (
                      <p>
                        • <strong>Трансфер из Улувату и Нуса-Дуа:</strong> Ввиду времени в пути (3.5-4 часа), трансфер начнется в <strong>~3:30 утра</strong>. Водитель будет ожидать вас в Ловине.
                      </p>
                    )}
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * Примечание: Стоимость указана за машину (до 4 человек, включая топливо и парковку). Время будет согласовано в WhatsApp.
                    </p>
                  </div>
</>
                  ) : (
                    <>
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>往返私人接送详情</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    {formData.pickupLocation === 'lovina' && (
                      <p>
                        • <strong>区域接送:</strong> 罗威那海滩2公里范围内的免费接送。船长将于 <strong>约早上6:30</strong> 接您。
                      </p>
                    )}
                    {formData.pickupLocation === 'ubud' && (
                      <p>
                        • <strong>乌布往返接送:</strong> 专业的私人司机和舒适整洁的空调SUV。包括 <strong>约早上4:30</strong> 从您的乌布别墅接您（约2小时车程），在罗威那等候您的行程，并在返航后送您回乌布。
                      </p>
                    )}
                    {formData.pickupLocation === 'canggu-kuta' && (
                      <p>
                        • <strong>巴厘岛南部往返接送:</strong> 从仓谷、水明漾、库塔、雷吉安或沙努尔出发。由于车程需2.5至3小时，接送时间将安排在 <strong>约早上4:00</strong>。
                      </p>
                    )}
                    {formData.pickupLocation === 'uluwatu' && (
                      <p>
                        • <strong>乌鲁瓦图和努沙杜瓦接送:</strong> 从乌鲁瓦图、努沙杜瓦或金巴兰出发。由于车程需3.5至4小时，接送时间将安排在 <strong>约早上3:30</strong>。
                      </p>
                    )}
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * 注意：价格为每辆车的固定费率（涵盖最多4名游客的整个团体、燃油费和停车费）。详细接送时间将通过 WhatsApp 进行协调。
                    </p>
                  </div>
</>
                  )}
                </div>
              )}

              {/* Pricing Summary */}
              <div className="bg-cloud-dancer/30 p-6 rounded-2xl border border-deep-indigo/5 space-y-3 text-sm">
                <div className="flex justify-between text-deep-indigo/60">
                  <span>{tours.find(t => t.id === formData.tourId)?.name} (${tours.find(t => t.id === formData.tourId)?.price} × {formData.guests} guests)</span>
                  <span>${(tours.find(t => t.id === formData.tourId)?.price || 0) * formData.guests} USD</span>
                </div>
                {formData.pickupLocation !== 'none' && (
                  <div className="flex justify-between text-deep-indigo/60">
                    <span>{pickupOptions.find(p => p.id === formData.pickupLocation)?.name}</span>
                    <span>
                      {pickupOptions.find(p => p.id === formData.pickupLocation)?.price === 0 
                        ? 'Free' 
                        : `$${pickupOptions.find(p => p.id === formData.pickupLocation)?.price} USD`
                      }
                    </span>
                  </div>
                )}
                <div className="border-t border-deep-indigo/10 pt-3 flex justify-between font-bold text-deep-indigo text-base">
                  <span>{t("summaryTotal", locale)}</span>
                  <span>
                    ${((tours.find(t => t.id === formData.tourId)?.price || 0) * formData.guests) + 
                      (pickupOptions.find(p => p.id === formData.pickupLocation)?.price || 0)
                    } USD
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-coral-pop text-cloud-dancer py-5 rounded-full text-lg font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading 
                  ? t('btnSubmitLoading', locale) 
                  : (isLastMinute ? t('btnSubmitWhatsApp', locale) : t('btnSubmit', locale))
                }
              </button>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-deep-indigo/5 mt-6">
                <span className="text-[9px] uppercase tracking-tighter text-deep-indigo/30">{t('trustSecureStripe', locale)}</span>
                <div className="w-1 h-1 bg-deep-indigo/10 rounded-full" />
                <span className="text-[9px] uppercase tracking-tighter text-deep-indigo/30">{t('trustImmediateConfirmation', locale)}</span>
              </div>
            </form>
          </div>

          {/* Right Column: Inclusions & Trust Sidebar */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 animate-in fade-in duration-500 delay-100">
            {/* Dynamic Inclusions Card */}
            <div className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-deep-indigo/5 space-y-6">
              <div className="border-b border-deep-indigo/10 pb-5">
                <span className="text-[9px] font-bold text-coral-pop uppercase tracking-widest block mb-1">{t('summaryTour', locale)}</span>
                <h3 className="text-2xl font-serif text-deep-indigo leading-tight">{selectedTour.name}</h3>
                <span className="text-sm font-semibold text-transformative-teal block mt-1.5">${selectedTour.price} USD per guest</span>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest">{t('inclusions', locale)}</h4>
                <ul className="space-y-4 text-xs leading-relaxed">
                  {selectedTour.id === 'seven-am-ethical' ? (
                    <>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour1Inc1Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour1Inc1Desc', locale)}</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour1Inc2Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour1Inc2Desc', locale)}</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('time2', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour1Inc3Desc', locale)}</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour1Inc4Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour1Inc4Desc', locale)}</span>
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-3 items-start text-transformative-teal bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/10 -mx-1 animate-in zoom-in duration-300">
                        <span className="text-lg leading-none shrink-0">✦</span>
                        <div>
                          <strong className="block text-sm font-bold leading-tight">{t('tour2SnorkelAdditionTitle', locale)}</strong>
                          <span className="font-light text-[11px] text-transformative-teal/80 block mt-1 leading-normal">
                            {t('tour2SnorkelAdditionDesc', locale)}
                          </span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour1Inc1Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour1Inc1Desc', locale)}</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour2Inc2Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour2Inc2Desc', locale)}</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">{t('tour2Inc4Title', locale)}</strong>
                          <span className="text-deep-indigo/60 font-light">{t('tour2Inc4Desc', locale)}</span>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Trust & Guarantee Card */}
            <div className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-deep-indigo/5 space-y-5 text-xs">
              <div className="flex gap-3 items-start">
                <span className="text-xl leading-none shrink-0 select-none">🐬</span>
                <div>
                  <strong className="text-deep-indigo block font-bold mb-0.5">{t('trustSightingTitle', locale)}</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    {t('trustSightingDesc', locale)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-t border-deep-indigo/5 pt-4">
                <span className="text-xl leading-none shrink-0 select-none">🛡️</span>
                <div>
                  <strong className="text-deep-indigo block font-bold mb-0.5">{t('trustEthicalTitle', locale)}</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    {t('trustEthicalDesc', locale)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-t border-deep-indigo/5 pt-4">
                <span className="text-xl leading-none shrink-0 select-none">💬</span>
                <div>
                  <strong className="text-deep-indigo block font-bold mb-0.5">{t('trustSupportTitle', locale)}</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    {t('trustSupportDesc', locale)} <a href="https://wa.me/18018556266" onClick={() => trackWhatsAppClick('Checkout Support Sidebar')} target="_blank" rel="noopener noreferrer" className="text-transformative-teal font-bold underline decoration-2 underline-offset-2 hover:text-deep-indigo transition-colors">+1 801-855-6266</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="bg-cloud-dancer min-h-screen flex items-center justify-center font-serif text-deep-indigo/30">
        Loading Secure Checkout...
      </main>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
