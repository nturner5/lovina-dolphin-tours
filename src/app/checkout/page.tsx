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
    <main className="bg-soft-bone min-h-screen py-24 px-6 lg:px-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-serif text-volcanic-navy mb-8 text-center">Secure Your Private Boat</h1>
        
        <form onSubmit={handleCheckout} className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-sand-dune/20">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-volcanic-navy/60 mb-2">Select Tour</label>
            <select 
              className="w-full bg-soft-bone border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-muted-slate transition-all"
              value={formData.tourId}
              onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
            >
              {TOURS.map(tour => (
                <option key={tour.id} value={tour.id}>{tour.name} — ${tour.price} USD</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-volcanic-navy/60 mb-2">Date</label>
              <input 
                type="date" 
                required
                className="w-full bg-soft-bone border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-muted-slate"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-volcanic-navy/60 mb-2">Guests</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                required
                className="w-full bg-soft-bone border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-muted-slate"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-volcanic-navy/60 mb-2">Your Name</label>
            <input 
              type="text" 
              required
              placeholder="Full Name"
              className="w-full bg-soft-bone border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-muted-slate"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-volcanic-navy/60 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="you@example.com"
              className="w-full bg-soft-bone border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-muted-slate"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-volcanic-navy text-soft-bone py-4 rounded-full text-lg font-medium hover:bg-muted-slate transition-all shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>

          <p className="text-[10px] text-center text-volcanic-navy/40 uppercase tracking-widest">
            Secure USD payment via Stripe. Payouts directly support local Lovina captains.
          </p>
        </form>
      </div>
    </main>
  );
}
