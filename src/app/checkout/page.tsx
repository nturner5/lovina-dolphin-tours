'use client';

import { useState } from 'react';

const TOURS = [
  { id: 'sunrise-ethical', name: 'Sunrise Ethical Tour', price: 45, time: '8:00 AM' },
  { id: 'swim-snorkel', name: 'Private Swim & Snorkel', price: 65, time: '8:30 AM' },
];

const PICKUP_OPTIONS = [
  { id: 'none', name: 'No Pickup (Meet at Lovina Beach)', price: 0 },
  { id: 'lovina', name: 'Free Local Pickup (Within 2km of Lovina Beach)', price: 0 },
  { id: 'ubud', name: 'Ubud Return Transfer', price: 35 },
  { id: 'canggu-kuta', name: 'Canggu, Seminyak, Kuta Return Transfer', price: 50 },
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


  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedTour = TOURS.find(t => t.id === formData.tourId)!;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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

  return (
    <main className="bg-cloud-dancer min-h-screen px-6 pt-12 pb-24 lg:pt-16 lg:px-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-serif text-deep-indigo mb-8 text-center">Secure Your Private Boat</h1>
        
        <form onSubmit={handleCheckout} className="space-y-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-deep-indigo/5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Select Tour</label>
            <select 
              className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium"
              value={formData.tourId}
              onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
            >
              {TOURS.map(tour => (
                <option key={tour.id} value={tour.id}>{tour.name} — ${tour.price} USD</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Guests</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                required
                className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Your Name</label>
            <input 
              type="text" 
              required
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
              placeholder="you@example.com"
              className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">WhatsApp Number</label>
            <input 
              type="tel" 
              required
              placeholder="e.g. +62 812-3456-7890"
              className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            />
            <p className="text-[10px] text-deep-indigo/40 mt-1.5 pl-1">Required for immediate captain coordination and pickup scheduling.</p>
          </div>

          {formData.pickupLocation !== 'none' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Hotel Name & Room/Address</label>
              <textarea 
                required
                rows={2}
                placeholder="Hotel or Villa Name, Address, and Room Number (if known)"
                className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal text-deep-indigo resize-none"
                value={formData.hotelDetails}
                onChange={(e) => setFormData({ ...formData, hotelDetails: e.target.value })}
              />
            </div>
          )}

          <div>

            <label className="block text-[10px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-3">Add Return Pickup (Optional)</label>
            <select 
              className="w-full bg-cloud-dancer/50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-transformative-teal transition-all text-deep-indigo font-medium"
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

          {/* Pricing Summary */}
          <div className="bg-cloud-dancer/30 p-6 rounded-2xl border border-deep-indigo/5 space-y-3 text-sm">
            <div className="flex justify-between text-deep-indigo/60">
              <span>{TOURS.find(t => t.id === formData.tourId)?.name}</span>
              <span>${TOURS.find(t => t.id === formData.tourId)?.price} USD</span>
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
                ${(TOURS.find(t => t.id === formData.tourId)?.price || 0) + 
                  (PICKUP_OPTIONS.find(p => p.id === formData.pickupLocation)?.price || 0)
                } USD
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-coral-pop text-cloud-dancer py-5 rounded-full text-lg font-bold hover:bg-deep-indigo transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4"
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
    </main>
  );
}
