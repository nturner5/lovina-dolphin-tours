'use client';

import { useState } from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber, getCountryCallingCode } from 'react-phone-number-input';

const TOURS = [
  { id: 'eight-am-ethical', name: '8:00 AM Private Ethical Tour', price: 45, time: '8:00 AM' },
  { id: 'swim-snorkel', name: '+ Private Swim & Snorkel', price: 65, time: '8:30 AM' },
];

const PICKUP_OPTIONS = [
  { id: 'none', name: 'No Driver (Meet at Lovina Beach by 7:30 AM)', price: 0 },
  { id: 'lovina', name: 'Free Local Shuttle (Lovina Beach Area - Pickup ~7:30 AM)', price: 0 },
  { id: 'ubud', name: 'Ubud Round-trip Private Driver (Pickup ~5:30 AM)', price: 35 },
  { id: 'canggu-kuta', name: 'Canggu / Seminyak / Kuta Round-trip Private Driver (Pickup ~5:00 AM)', price: 50 },
  { id: 'uluwatu', name: 'Uluwatu / Nusa Dua Round-trip Private Driver (Pickup ~4:30 AM)', price: 65 },
];

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tourId: TOURS[0].id,
    date: '',
    guests: 2,
    name: '',
    email: '',
    whatsappNumber: '',
    hotelDetails: '',
    pickupLocation: 'none',
  });

  // Dynamic WhatsApp validation using Google's libphonenumber engine
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('AU'); // Default to Australia

  const isValidPhone = whatsappNumber ? isValidPhoneNumber(whatsappNumber) : false;
  const callingCode = selectedCountry ? `+${getCountryCallingCode(selectedCountry as any)}` : '';

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isValidPhone) {
      alert("Invalid WhatsApp Number: Please enter a valid international mobile number (select your country and enter your number) so our captain can coordinate your pickup.");
      setLoading(false);
      return;
    }

    const selectedTour = TOURS.find(t => t.id === formData.tourId)!;

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

  const selectedTour = TOURS.find(t => t.id === formData.tourId) || TOURS[0];

  return (
    <main className="bg-cloud-dancer min-h-screen px-4 sm:px-6 pt-12 pb-24 lg:pt-16 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Secure SSL Trust Indicator */}
        <div className="flex items-center justify-center gap-2 mb-3 text-transformative-teal/70 font-semibold tracking-widest text-[10px] uppercase select-none animate-in fade-in duration-700">
          <svg className="w-3.5 h-3.5 text-transformative-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2-0 002-2v-6a2 2-0 00-2-2H6a2 2-0 00-2 2v6a2 2-0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure 256-Bit SSL Checkout
        </div>

        <h1 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-8 lg:mb-12 text-center">Secure Your Private Boat</h1>
        
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Select Tour</label>
                <select 
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium cursor-pointer"
                  value={formData.tourId}
                  onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                >
                  {TOURS.map(tour => (
                    <option key={tour.id} value={tour.id}>{tour.name} — ${tour.price} USD per guest</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Guests (Min. 2)</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="10"
                    required
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo font-bold"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: Math.max(2, parseInt(e.target.value) || 2) })}
                  />
                </div>
              </div>
              <p className="text-[10px] text-deep-indigo/40 -mt-3 pl-1 leading-normal">
                Private boat charter requires a minimum of 2 guest tickets to book. Solo travelers are welcome, but the 2-guest minimum rate ($90 USD) applies to secure the private outrigger.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Your Name</label>
                <input 
                  type="text" 
                  required
                  autoComplete="name"
                  placeholder="Full Name"
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Email Address</label>
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">WhatsApp Number</label>
                <div 
                  className="relative flex items-center w-full"
                  style={{ '--calling-code': `"${callingCode}"` } as React.CSSProperties}
                >
                  <PhoneInput
                    defaultCountry="AU"
                    country={selectedCountry as any}
                    onCountryChange={(country) => setSelectedCountry(country || 'AU')}
                    value={whatsappNumber}
                    onChange={(val) => setWhatsappNumber(val || '')}
                    required
                    autoComplete="tel"
                    placeholder="Enter WhatsApp number"
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
                <p className="text-[10px] text-deep-indigo/40 mt-1.5 pl-1">Required for immediate captain coordination and pickup scheduling.</p>
              </div>

              {formData.pickupLocation !== 'none' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Hotel Name & Room/Address</label>
                  <textarea 
                    required
                    rows={2}
                    autoComplete="street-address"
                    placeholder="Hotel or Villa Name, Address, and Room Number (if known)"
                    className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo resize-none"
                    value={formData.hotelDetails}
                    onChange={(e) => setFormData({ ...formData, hotelDetails: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Need Picked Up? (Optional)</label>
                <select 
                  className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium cursor-pointer"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                >
                  {PICKUP_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name} {option.price > 0 ? `— $${option.price} USD` : '— Free'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Transfer Details Box */}
              {formData.pickupLocation !== 'none' && (
                <div className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/10 space-y-3 text-xs leading-normal animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-transformative-teal font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Round-Trip Private Transfer Details</span>
                  </div>
                  <div className="text-deep-indigo/80 space-y-2 font-light">
                    {formData.pickupLocation === 'lovina' && (
                      <p>
                        • <strong>Local Shuttle:</strong> Complimentary local pickup and drop-off within 2km of Lovina Beach. Your captain will pick you up at <strong>~7:30 AM</strong> for our 8:00 AM quiet departure.
                      </p>
                    )}
                    {formData.pickupLocation === 'ubud' && (
                      <p>
                        • <strong>Ubud Return Transfer:</strong> A dedicated, professional private driver in a comfortable, clean A/C SUV. Includes pickup at your Ubud villa at <strong>~5:30 AM</strong> (approx. 2-hour drive), transport to Lovina, waiting for your tour, and return drop-off to Ubud after you return to shore (~11:00 AM).
                      </p>
                    )}
                    {formData.pickupLocation === 'canggu-kuta' && (
                      <p>
                        • <strong>South Bali Return Transfer:</strong> Private, air-conditioned round-trip transport from Canggu, Seminyak, Kuta, Legian, or Sanur. Because of the 2.5 to 3-hour travel time, your pickup will be scheduled at <strong>~5:00 AM</strong>. Your driver waits in Lovina and returns you to South Bali after the tour.
                      </p>
                    )}
                    {formData.pickupLocation === 'uluwatu' && (
                      <p>
                        • <strong>Uluwatu & Nusa Dua Return Transfer:</strong> Private, air-conditioned round-trip transport from Uluwatu, Nusa Dua, or Jimbaran. Because of the 3.5 to 4-hour travel time, your pickup will be scheduled at <strong>~4:30 AM</strong>. Your driver waits in Lovina and returns you to your resort after the tour.
                      </p>
                    )}
                    <p className="text-[10px] text-deep-indigo/50 italic mt-2 border-t border-transformative-teal/10 pt-2">
                      * Note: Price is a flat-rate per car (covers your entire group up to 4 guests, fuel, and parking). Detailed pickup times will be coordinated with you via WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* Pricing Summary */}
              <div className="bg-cloud-dancer/30 p-6 rounded-2xl border border-deep-indigo/5 space-y-3 text-sm">
                <div className="flex justify-between text-deep-indigo/60">
                  <span>{TOURS.find(t => t.id === formData.tourId)?.name} (${TOURS.find(t => t.id === formData.tourId)?.price} × {formData.guests} guests)</span>
                  <span>${(TOURS.find(t => t.id === formData.tourId)?.price || 0) * formData.guests} USD</span>
                </div>
                {formData.pickupLocation !== 'none' && (
                  <div className="flex justify-between text-deep-indigo/60">
                    <span>{PICKUP_OPTIONS.find(p => p.id === formData.pickupLocation)?.name}</span>
                    <span>
                      {PICKUP_OPTIONS.find(p => p.id === formData.pickupLocation)?.price === 0 
                        ? 'Free' 
                        : `$${PICKUP_OPTIONS.find(p => p.id === formData.pickupLocation)?.price} USD`
                      }
                    </span>
                  </div>
                )}
                <div className="border-t border-deep-indigo/10 pt-3 flex justify-between font-bold text-deep-indigo text-base">
                  <span>Total Price</span>
                  <span>
                    ${((TOURS.find(t => t.id === formData.tourId)?.price || 0) * formData.guests) + 
                      (PICKUP_OPTIONS.find(p => p.id === formData.pickupLocation)?.price || 0)
                    } USD
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-coral-pop text-cloud-dancer py-5 rounded-full text-lg font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? 'Opening Secure Checkout...' : 'Continue to Payment'}
              </button>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-deep-indigo/5 mt-6">
                <span className="text-[9px] uppercase tracking-tighter text-deep-indigo/30">Secure USD via Stripe</span>
                <div className="w-1 h-1 bg-deep-indigo/10 rounded-full" />
                <span className="text-[9px] uppercase tracking-tighter text-deep-indigo/30">Immediate Confirmation</span>
              </div>
            </form>
          </div>

          {/* Right Column: Inclusions & Trust Sidebar */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 animate-in fade-in duration-500 delay-100">
            {/* Dynamic Inclusions Card */}
            <div className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-deep-indigo/5 space-y-6">
              <div className="border-b border-deep-indigo/10 pb-5">
                <span className="text-[9px] font-bold text-coral-pop uppercase tracking-widest block mb-1">Your Selection</span>
                <h3 className="text-2xl font-serif text-deep-indigo leading-tight">{selectedTour.name}</h3>
                <span className="text-sm font-semibold text-transformative-teal block mt-1.5">${selectedTour.price} USD per guest</span>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-deep-indigo/40 uppercase tracking-widest">What's Included</h4>
                <ul className="space-y-4 text-xs leading-relaxed">
                  {selectedTour.id === 'eight-am-ethical' ? (
                    <>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Private Jukung Outrigger</strong>
                          <span className="text-deep-indigo/60 font-light">Exclusive boat for your group only (no sharing).</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Vetted Local Captain</strong>
                          <span className="text-deep-indigo/60 font-light">Sustainable parallel cruise following strict animal welfare rules.</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">8:00 AM Departure</strong>
                          <span className="text-deep-indigo/60 font-light">Skip the 6:00 AM Sunrise swarm for a quiet, glassy sea.</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Island Refreshments</strong>
                          <span className="text-deep-indigo/60 font-light">Hot Balinese coffee, local tea, and fresh seasonal fruits.</span>
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-3 items-start text-transformative-teal bg-transformative-teal/5 p-4 rounded-2xl border border-transformative-teal/10 -mx-1 animate-in zoom-in duration-300">
                        <span className="text-lg leading-none shrink-0">✦</span>
                        <div>
                          <strong className="block text-sm font-bold leading-tight">Coral Reef Snorkeling Addition</strong>
                          <span className="font-light text-[11px] text-transformative-teal/80 block mt-1 leading-normal">
                            Anchor at Lovina's best protected coral reefs. Swim alongside wild sea turtles and schools of reef fish!
                          </span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Private Jukung Outrigger</strong>
                          <span className="text-deep-indigo/60 font-light">Exclusive boat for your group only (no sharing).</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Premium Snorkel Gear</strong>
                          <span className="text-deep-indigo/60 font-light">Sanitized standard masks, snorkels, and fins.</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Underwater View Frames</strong>
                          <span className="text-deep-indigo/60 font-light">Unique glass outrigger view frames for spotting sea life.</span>
                        </div>
                      </li>
                      <li className="flex gap-3 items-start">
                        <span className="text-transformative-teal font-bold text-base leading-none">✓</span>
                        <div>
                          <strong className="text-deep-indigo block font-bold">Local Captain & Coffee</strong>
                          <span className="text-deep-indigo/60 font-light">Strict no-chase parallel cruising with fresh coffee, tea, and fruits.</span>
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
                  <strong className="text-deep-indigo block font-bold mb-0.5">85% Sighting Guarantee</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    Dolphins are wild and free. If they do not appear, join us on a second morning cruise absolutely free.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-t border-deep-indigo/5 pt-4">
                <span className="text-xl leading-none shrink-0 select-none">🛡️</span>
                <div>
                  <strong className="text-deep-indigo block font-bold mb-0.5">100% Ethical standard</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    Engines off within 30m. We approach parallel and let them choose to swim up to our stationary wings.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-t border-deep-indigo/5 pt-4">
                <span className="text-xl leading-none shrink-0 select-none">💬</span>
                <div>
                  <strong className="text-deep-indigo block font-bold mb-0.5">Bali Support Bridge</strong>
                  <p className="text-deep-indigo/60 font-light leading-normal">
                    Need custom help? Chat with a local Captain instantly on WhatsApp: <a href="https://wa.me/6285190422839" target="_blank" rel="noopener noreferrer" className="text-transformative-teal font-bold underline decoration-2 underline-offset-2 hover:text-deep-indigo transition-colors">+62 851-9042-2839</a>
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
