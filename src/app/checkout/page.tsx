'use client';

import { useState } from 'react';

const TOURS = [
  { id: 'sunrise-ethical', name: 'Sunrise Ethical Tour', price: 45, time: '8:00 AM' },
  { id: 'swim-snorkel', name: 'Private Swim & Snorkel', price: 65, time: '8:30 AM' },
];

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tourId: TOURS[0].id,
    date: '',
    guests: 2,
    name: '',
    email: '',
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
    <main className="bg-cloud-dancer min-h-screen py-24 px-6 lg:px-12">
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
