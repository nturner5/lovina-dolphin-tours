'use client';

import { useState, useEffect, Suspense } from 'react';
import { t } from '@/locales/i18n';
import { useLocale } from '@/locales/i18n-client';
import { trackWhatsAppClick, trackBeginCheckout, trackPageView } from '@/lib/analytics';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber, getCountryCallingCode } from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Image from 'next/image';

const DEFAULT_TOURS = [
  { 
    id: 'seven-am-ethical', 
    name: '7:00 AM Private Dolphin Watching Tour', 
    price: 45, 
    time: '7:00 AM',
    badge: '🐬 Dolphin Watching',
    image: '/hero_dolphins.png'
  },
  { 
    id: 'dolphin-swim', 
    name: '7:00 AM Private Dolphin Watching & Swimming Tour', 
    price: 55, 
    time: '7:00 AM',
    badge: '🏊 Open Sea Swim',
    image: '/dolphin_plus_swim.png'
  },
  { 
    id: 'swim-snorkel', 
    name: '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel', 
    price: 65, 
    time: '7:00 AM',
    badge: '🐢 Recommended',
    image: '/snorkeling_lovina_realistic.jpg'
  },
];

const DEFAULT_PICKUP_OPTIONS = [
  { id: 'none', name: 'No Driver (Meet at Lovina Beach by 6:30 AM)', price: 0, icon: '⛵', note: 'Self-Drive to Beach' },
  { id: 'lovina', name: 'Free Local Shuttle (Lovina Beach Area)', price: 0, icon: '🛺', note: 'Within 2km of Beach' },
  { id: 'ubud', name: 'Ubud Round-trip Private Driver (~4:30 AM Pickup)', price: 42, icon: '🌴', note: 'Flat rate per SUV (up to 4 guests) — Includes free scenic stopovers on return trip' },
  { id: 'canggu-kuta', name: 'Canggu / Seminyak / Kuta Round-trip Driver (~4:00 AM Pickup)', price: 60, icon: '🏖️', note: 'Flat rate per SUV (up to 4 guests) — Includes free scenic stopovers on return trip' },
  { id: 'uluwatu', name: 'Uluwatu / Nusa Dua Round-trip Driver (~3:30 AM Pickup)', price: 78, icon: '🌊', note: 'Flat rate per SUV (up to 4 guests) — Includes free scenic stopovers on return trip' },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  const [hasTrackedBegin, setHasTrackedBegin] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [showHotelError, setShowHotelError] = useState(false);

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  useEffect(() => {
    if (hasTrackedBegin || tours.length === 0) return;
    const selectedTour = tours.find(t => t.id === formData.tourId) || tours[0];
    if (selectedTour) {
      const totalInitialValue = selectedTour.price * formData.guests;
      trackBeginCheckout(
        totalInitialValue,
        selectedTour.id,
        selectedTour.name,
        selectedTour.price,
        formData.guests
      );
      setHasTrackedBegin(true);
    }
  }, [tours, formData.tourId, formData.guests, hasTrackedBegin]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          if (data.tours && data.tours.length > 0) {
            setTours(prev => prev.map(pt => {
              const matched = data.tours.find((dt: any) => dt.id === pt.id);
              return matched ? { ...pt, price: matched.price } : pt;
            }));
          }
          if (data.pickups && data.pickups.length > 0) {
            setPickupOptions(prev => prev.map(po => {
              const matched = data.pickups.find((dp: any) => dp.id === po.id);
              return matched ? { ...po, price: matched.price } : po;
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load dynamic pricing from Stripe:', e);
      }
    };
    fetchPricing();
  }, []);

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

  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('AU');

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
      } catch (e) {}
    }

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
          whatsappNumber: whatsappNumber,
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
  const selectedPickup = pickupOptions.find(p => p.id === formData.pickupLocation) || pickupOptions[0];

  const tourTotal = selectedTour.price * formData.guests;
  const pickupTotal = selectedPickup.price;
  const grandTotal = tourTotal + pickupTotal;

  const handleNextStep1 = () => {
    if (!formData.date) {
      setShowDateError(true);
      const inputEl = document.getElementById('tour-date-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setShowDateError(false);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    if (formData.pickupLocation !== 'none' && !formData.hotelDetails.trim()) {
      setShowHotelError(true);
      const inputEl = document.getElementById('hotel-details-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setShowHotelError(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="bg-cloud-dancer min-h-screen px-4 sm:px-6 pt-6 pb-32 md:pb-24 lg:pt-10 max-w-4xl mx-auto overflow-x-hidden">
      {/* Top Compact Trust & Security Bar */}
      <div className="flex items-center justify-between gap-2 mb-6 text-xs text-deep-indigo/60 border-b border-deep-indigo/10 pb-3">
        <div className="flex items-center gap-1.5 font-medium">
          <svg className="w-4 h-4 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2-0 002-2v-6a2 2-0 00-2-2H6a2 2-0 00-2 2v6a2 2-0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="uppercase tracking-wider text-[10px] font-bold text-deep-indigo">{t('sslIndicator', locale)}</span>
        </div>
        <span className="text-[11px] font-bold text-transformative-teal bg-transformative-teal/10 px-2.5 py-1 rounded-full">
          ★ 4.9 Rating (Verified)
        </span>
      </div>

      {/* Step Indicator Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-deep-indigo text-center mb-6">
          {step === 1 && 'Step 1: Choose Your Experience'}
          {step === 2 && 'Step 2: Pickup & Logistics'}
          {step === 3 && 'Step 3: Contact & Secure Checkout'}
        </h1>

        <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
          {/* Progress Bar Backing */}
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-deep-indigo/10 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-8 h-0.5 bg-transformative-teal -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 Node */}
          <button 
            onClick={() => setStep(1)}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              step >= 1 ? 'bg-transformative-teal text-white shadow-md' : 'bg-white text-deep-indigo/40 border border-deep-indigo/10'
            }`}
          >
            1
          </button>

          {/* Step 2 Node */}
          <button 
            type="button"
            onClick={() => { 
              if (formData.date) {
                setShowDateError(false);
                setStep(2); 
              } else {
                setShowDateError(true);
              }
            }}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              step >= 2 ? 'bg-transformative-teal text-white shadow-md' : 'bg-white text-deep-indigo/40 border border-deep-indigo/10'
            }`}
          >
            2
          </button>

          {/* Step 3 Node */}
          <button 
            type="button"
            onClick={() => { 
              if (!formData.date) {
                setShowDateError(true);
                setStep(1);
                return;
              }
              if (formData.pickupLocation !== 'none' && !formData.hotelDetails.trim()) {
                setShowHotelError(true);
                setStep(2);
                return;
              }
              setStep(3);
            }}
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              step === 3 ? 'bg-coral-pop text-white shadow-md' : 'bg-white text-deep-indigo/40 border border-deep-indigo/10'
            }`}
          >
            3
          </button>
        </div>

        <div className="flex justify-between max-w-md mx-auto text-[10px] font-bold uppercase tracking-wider text-deep-indigo/60 mt-2 px-1 text-center">
          <span className={step === 1 ? 'text-transformative-teal' : ''}>1. Tour</span>
          <span className={step === 2 ? 'text-transformative-teal' : ''}>2. Logistics</span>
          <span className={step === 3 ? 'text-coral-pop' : ''}>3. Pay</span>
        </div>
      </div>

      {/* STEP 1: EXPERIENCE & DATE */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-deep-indigo/70">
              Select Private Package
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tours.map(tour => {
                const isSelected = formData.tourId === tour.id;
                const tourName = tour.id === 'seven-am-ethical' 
                  ? t('tour1Title', locale) 
                  : tour.id === 'dolphin-swim' 
                    ? t('tour1_5Title', locale) 
                    : t('tour2Title', locale);

                return (
                  <div
                    key={tour.id}
                    onClick={() => setFormData({ ...formData, tourId: tour.id })}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between relative bg-white ${
                      isSelected 
                        ? 'border-transformative-teal shadow-md ring-2 ring-transformative-teal/20 scale-[1.01]' 
                        : 'border-deep-indigo/10 hover:border-deep-indigo/30'
                    }`}
                  >
                    {tour.id === 'swim-snorkel' && (
                      <span className="absolute -top-3 right-4 bg-coral-pop text-white px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow">
                        ✦ Popular
                      </span>
                    )}

                    <div>
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-deep-indigo/5">
                        <Image 
                          src={tour.image} 
                          alt={tourName} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <h3 className="font-serif font-bold text-deep-indigo text-base leading-tight mb-1">
                        {tourName}
                      </h3>
                      <p className="text-xs text-transformative-teal font-semibold mb-3">
                        ${tour.price} USD <span className="text-[10px] text-deep-indigo/50 font-normal">/ guest</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-deep-indigo/5 text-[11px]">
                      <span className="text-deep-indigo/60">Min 2 guests</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-transformative-teal text-white' : 'border border-deep-indigo/20 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-deep-indigo/5 shadow-sm">
            {/* Date Input */}
            <div className="min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2 flex items-center justify-between">
                <span>{t('dateLabel', locale)}</span>
                {showDateError && <span className="text-coral-pop font-bold text-[10px] uppercase tracking-normal animate-pulse">Required</span>}
              </label>
              <input 
                id="tour-date-input"
                type="date" 
                required
                min={minDate}
                className={`w-full max-w-full min-w-0 box-border rounded-xl px-3 sm:px-4 h-[52px] focus:outline-none transition-all text-deep-indigo text-xs sm:text-sm font-medium cursor-pointer ${
                  showDateError 
                    ? 'bg-coral-pop/10 border-2 border-coral-pop ring-2 ring-coral-pop/20' 
                    : 'bg-cloud-dancer/50 border border-deep-indigo/10 focus:ring-2 focus:ring-transformative-teal'
                }`}
                value={formData.date}
                onClick={(e) => {
                  try {
                    if ('showPicker' in e.currentTarget) {
                      e.currentTarget.showPicker();
                    }
                  } catch (err) {
                    // Browser context fallback
                  }
                }}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  if (e.target.value) setShowDateError(false);
                }}
              />
              {showDateError && (
                <div className="flex items-center gap-1.5 text-coral-pop text-xs mt-2 font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-sm">⚠️</span>
                  <span>Please select a tour date to continue.</span>
                </div>
              )}
            </div>

            {/* Guest Counter Stepper */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">
                Guests (Private Boat)
              </label>
              <div className="flex items-center justify-between bg-cloud-dancer/50 border border-deep-indigo/10 rounded-xl px-3 h-[52px]">
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, guests: Math.max(2, p.guests - 1) }))}
                  className="w-9 h-9 rounded-lg bg-white border border-deep-indigo/10 text-deep-indigo font-bold text-lg hover:bg-transformative-teal hover:text-white transition-colors flex items-center justify-center active:scale-95 shrink-0"
                >
                  -
                </button>
                <span className="text-xl font-bold text-deep-indigo leading-none select-none">
                  {formData.guests}
                </span>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, guests: Math.min(8, p.guests + 1) }))}
                  className="w-9 h-9 rounded-lg bg-white border border-deep-indigo/10 text-deep-indigo font-bold text-lg hover:bg-transformative-teal hover:text-white transition-colors flex items-center justify-center active:scale-95 shrink-0"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-deep-indigo/50 px-1 leading-normal">
            {t('guestsDisclaimer', locale)}
          </p>

          {/* Subtotal Banner */}
          <div className="bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/15 flex items-center justify-between">
            <div>
              <span className="text-xs text-deep-indigo/60 block">Tour Subtotal ({formData.guests} guests)</span>
              <strong className="text-xl font-bold text-deep-indigo">${tourTotal} USD</strong>
            </div>
            <button
              type="button"
              onClick={handleNextStep1}
              className="bg-transformative-teal text-white px-6 py-3.5 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Next: Pickup Details</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PICKUP & LOGISTICS */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-deep-indigo/5 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-deep-indigo/70">
              Choose Transfer & Driver Option
            </label>

            <div className="space-y-3">
              {pickupOptions.map(option => {
                const isSelected = formData.pickupLocation === option.id;
                let optionName = '';
                if (option.id === 'none') optionName = t('noDriver', locale);
                else if (option.id === 'lovina') optionName = t('freeShuttle', locale);
                else if (option.id === 'ubud') optionName = t('ubudDriver', locale);
                else if (option.id === 'canggu-kuta') optionName = t('cangguDriver', locale);
                else if (option.id === 'uluwatu') optionName = t('uluwatuDriver', locale);

                return (
                  <div
                    key={option.id}
                    onClick={() => setFormData({ ...formData, pickupLocation: option.id })}
                    className={`cursor-pointer rounded-xl p-3 sm:p-3.5 border-2 transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-transformative-teal bg-transformative-teal/5 ring-1 ring-transformative-teal/20' 
                        : 'border-deep-indigo/10 hover:border-deep-indigo/20 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl shrink-0">{option.icon}</span>
                      <div>
                        <strong className="block text-xs font-bold text-deep-indigo leading-tight">{optionName}</strong>
                        <span className="text-[10px] text-deep-indigo/60 font-light block leading-snug mt-0.5">{option.note}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-deep-indigo">
                        {option.price === 0 ? 'Free' : `+$${option.price} USD`}
                      </span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-transformative-teal text-white' : 'border border-deep-indigo/20 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {formData.pickupLocation !== 'none' && (
              <div className="pt-3 border-t border-deep-indigo/5 animate-in fade-in duration-300">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2 flex items-center justify-between">
                  <span>{t('hotelLabel', locale)}</span>
                  {showHotelError && <span className="text-coral-pop font-bold text-[10px] uppercase tracking-normal animate-pulse">Required</span>}
                </label>
                <textarea 
                  id="hotel-details-input"
                  required
                  rows={2}
                  placeholder={t("hotelPlaceholder", locale)}
                  className={`w-full rounded-xl px-4 py-3 focus:outline-none transition-all text-deep-indigo text-xs resize-none ${
                    showHotelError 
                      ? 'bg-coral-pop/10 border-2 border-coral-pop ring-2 ring-coral-pop/20' 
                      : 'bg-cloud-dancer/50 border border-deep-indigo/10 focus:ring-2 focus:ring-transformative-teal'
                  }`}
                  value={formData.hotelDetails}
                  onChange={(e) => {
                    setFormData({ ...formData, hotelDetails: e.target.value });
                    if (e.target.value.trim()) setShowHotelError(false);
                  }}
                />
                {showHotelError && (
                  <div className="flex items-center gap-1.5 text-coral-pop text-xs mt-1.5 font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-sm">⚠️</span>
                    <span>Please provide your hotel or villa address for driver pickup.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location & Sightseeing Notice */}
          <div className="bg-transformative-teal/5 p-4 sm:p-6 rounded-2xl border border-transformative-teal/15 space-y-2 text-xs">
            <strong className="font-bold text-transformative-teal flex items-center gap-1.5">
              <span>📍</span>
              <span>
                {formData.pickupLocation === 'none' ? 'Self-Drive Meeting Spot' : 'Private Driver Perks'}
              </span>
            </strong>
            <p className="text-deep-indigo/80 leading-relaxed font-light text-[11px]">
              {formData.pickupLocation === 'none' ? (
                <>Meet at the <a href="https://maps.google.com/?q=Dolphin+Statue+Lovina+Beach" target="_blank" rel="noopener noreferrer" className="font-bold underline text-deep-indigo">Lovina Beach Dolphin Statue (Kalibukbuk)</a> by <strong>6:30 AM</strong> for our 7:00 AM quiet departure.</>
              ) : (
                <>Your private driver will wait at Lovina while you enjoy the ocean. On your return trip, enjoy up to <strong>3 free scenic stops</strong> (Lake Beratan temple, waterfalls, coffee farms) at no extra charge!</>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-white border border-deep-indigo/20 text-deep-indigo px-6 py-3.5 rounded-full text-xs font-bold hover:bg-cloud-dancer transition-all active:scale-95"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              className="bg-transformative-teal text-white px-8 py-3.5 rounded-full text-xs font-bold hover:bg-deep-indigo transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Next: Contact & Pay</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT & SECURE PAY */}
      {step === 3 && (
        <form onSubmit={handleCheckout} className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-deep-indigo/5 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-widest text-deep-indigo/70">
              Lead Traveler Information
            </label>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">
                {t('nameLabel', locale)}
              </label>
              <input 
                type="text" 
                required
                placeholder={t("namePlaceholder", locale)}
                className="w-full bg-cloud-dancer/50 border border-deep-indigo/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-transformative-teal text-deep-indigo text-xs"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">
                {t('emailLabel', locale)}
              </label>
              <input 
                type="email" 
                required
                placeholder={t("emailPlaceholder", locale)}
                className="w-full bg-cloud-dancer/50 border border-deep-indigo/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-transformative-teal text-deep-indigo text-xs"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/60 mb-2">
                {t('phoneLabel', locale)}
              </label>
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
                  placeholder={t("phonePlaceholder", locale)}
                />
                {whatsappNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1 select-none z-20 pointer-events-none">
                    {isValidPhone ? (
                      <span className="text-transformative-teal text-base">✅</span>
                    ) : (
                      <span className="text-coral-pop text-[9px] font-bold uppercase tracking-wider bg-coral-pop/10 px-2 py-1 rounded">Invalid</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-deep-indigo/50 mt-1.5 pl-1">{t('phoneDisclaimer', locale)}</p>
            </div>
          </div>

          {/* Last Minute Warning Notice */}
          {isLastMinute && (
            <div className="bg-coral-pop/10 text-coral-pop p-4 rounded-2xl border border-coral-pop/20 text-xs leading-normal flex items-start gap-3">
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <strong className="block font-bold mb-1">Last-Minute Booking Notice</strong>
                <p className="opacity-90 leading-relaxed font-light text-[11px]">
                  {t('lastMinuteWarning', locale)}
                </p>
              </div>
            </div>
          )}

          {/* Concept 1: Digital Boarding Pass / Ticket Motif */}
          <div className="bg-white rounded-3xl border-2 border-deep-indigo/10 shadow-sm overflow-hidden text-xs">
            {/* Pass Header */}
            <div className="bg-deep-indigo text-cloud-dancer px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐬</span>
                <div>
                  <strong className="block text-xs sm:text-sm font-serif tracking-wide text-white">BALI DOLPHIN TOURS</strong>
                  <span className="text-[9px] text-white/60 uppercase tracking-widest block">Checkout Summary</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-md text-coral-pop border border-white/10 font-bold uppercase">
                SECURE CHECKOUT
              </span>
            </div>

            {/* Ticket Body */}
            <div className="p-5 sm:p-6 space-y-4 bg-gradient-to-b from-white to-cloud-dancer/20">
              {/* Section 1: Experience */}
              <div className="border-b border-deep-indigo/10 pb-3.5">
                <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1.5">
                  📍 1. Selected Experience
                </span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-serif font-bold text-deep-indigo text-xs sm:text-sm leading-tight">{selectedTour.name}</h4>
                    <span className="text-[11px] text-deep-indigo/60 font-light block mt-1">
                      📅 {formData.date || 'Date Pending'} • 👥 {formData.guests} Guests (${selectedTour.price}/person)
                    </span>
                  </div>
                  <span className="font-bold text-deep-indigo text-sm shrink-0">${tourTotal} USD</span>
                </div>
              </div>

              {/* Section 2: Transport */}
              <div className="border-b border-deep-indigo/10 pb-3.5">
                <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1.5">
                  🌴 2. Transport & Logistics
                </span>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-deep-indigo text-xs">{selectedPickup.name}</h4>
                    <span className="text-[10px] text-deep-indigo/60 font-light block mt-0.5 leading-snug">
                      {selectedPickup.note}
                    </span>
                  </div>
                  <span className="font-bold text-deep-indigo text-xs shrink-0">
                    {pickupTotal === 0 ? 'Included' : `$${pickupTotal} USD`}
                  </span>
                </div>
              </div>

              {/* Section 3: Complimentary Included Perks */}
              <div className="bg-transformative-teal/5 p-3.5 sm:p-4 rounded-2xl border border-transformative-teal/10 space-y-2">
                <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block">
                  ✨ Included Free With Your Ticket
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-deep-indigo/80 font-light">
                  <li className="flex items-center gap-1.5">
                    <span className="text-transformative-teal font-bold">✓</span> 100% Sighting Guarantee
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-transformative-teal font-bold">✓</span> Captain & Outrigger Boat
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-transformative-teal font-bold">✓</span> Snorkel & Safety Gear
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-transformative-teal font-bold">✓</span> Hot Coffee & Fresh Fruits
                  </li>
                </ul>
              </div>
            </div>

            {/* Perforated Stub Line */}
            <div className="relative border-t-2 border-dashed border-deep-indigo/20 bg-cloud-dancer/60 px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-cloud-dancer rounded-full border-r border-deep-indigo/20" />
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-cloud-dancer rounded-full border-l border-deep-indigo/20" />

              <div>
                <span className="text-[9px] font-bold text-deep-indigo/50 uppercase tracking-widest block">Total Reservation Amount</span>
                <span className="text-[10px] text-deep-indigo/40 font-light">All taxes, fuel & boat fees included</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-transformative-teal font-serif">${grandTotal} USD</span>
            </div>
          </div>

          {/* Sighting Guarantee Placement */}
          <div className="flex items-start gap-3 bg-sage-leaf/10 p-4 rounded-2xl border border-sage-leaf/25 text-xs text-deep-indigo/80">
            <span className="text-lg shrink-0">🐬</span>
            <div>
              <strong className="font-bold text-deep-indigo block mb-0.5">{t('trustSightingTitle', locale)}</strong>
              <p className="opacity-90 font-light leading-relaxed text-[11px]">{t('trustSightingDesc', locale)}</p>
            </div>
          </div>

          {/* Submit / Pay Button */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-white border border-deep-indigo/20 text-deep-indigo px-5 py-4 rounded-full text-xs font-bold hover:bg-cloud-dancer transition-all active:scale-95 shrink-0"
              >
                ← Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-coral-pop text-cloud-dancer py-4 px-6 rounded-full text-base font-bold hover:bg-deep-indigo transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer text-center"
              >
                {loading 
                  ? t('btnSubmitLoading', locale) 
                  : (isLastMinute ? t('btnSubmitWhatsApp', locale) : `Pay $${grandTotal} USD`)
                }
              </button>
            </div>

            {/* Clean Security Subtext */}
            {!isLastMinute && (
              <p className="text-[10px] text-deep-indigo/40 text-center font-light pt-0.5">
                🔒 256-Bit SSL Encrypted  •  Instant Confirmation
              </p>
            )}
          </div>
        </form>
      )}

      {/* Mobile-Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-deep-indigo/10 px-4 py-3 flex items-center justify-between z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.1)] md:hidden">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-deep-indigo/40 font-bold">Total Amount</span>
          <span className="text-base font-bold text-deep-indigo">${grandTotal} USD</span>
        </div>
        {step === 1 && (
          <button 
            type="button" 
            onClick={handleNextStep1}
            className="bg-transformative-teal text-white px-6 py-3 rounded-full text-xs font-bold active:scale-95"
          >
            Next: Pickup →
          </button>
        )}
        {step === 2 && (
          <button 
            type="button" 
            onClick={handleNextStep2}
            className="bg-transformative-teal text-white px-6 py-3 rounded-full text-xs font-bold active:scale-95"
          >
            Next: Contact →
          </button>
        )}
        {step === 3 && (
          <button 
            type="submit"
            onClick={handleCheckout}
            disabled={loading}
            className="bg-coral-pop text-white px-6 py-3 rounded-full text-xs font-bold active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLastMinute ? 'WhatsApp' : 'Pay Now')}
          </button>
        )}
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
