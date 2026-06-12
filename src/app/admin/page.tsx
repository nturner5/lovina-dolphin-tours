'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Test form values
  const [formData, setFormData] = useState({
    guestName: 'John Doe',
    guestEmail: 'john.doe@example.com',
    date: '2026-06-08',
    guests: '2',
    tourId: 'seven-am-ethical',
    pickupLocation: 'none',
    whatsappNumber: '+6281234567890',
    hotelDetails: 'Ubud Hanging Gardens Villa 4',
    bookingCode: 'LEM-MOCK',
    n8nStripeUrl: 'https://n8n.balidolphintours.com/webhook/stripe-webhook',
    n8nMetaUrl: 'https://n8n.balidolphintours.com/webhook/meta-whatsapp-callback',
    n8nCaptainUrl: 'https://n8n.balidolphintours.com/webhook-test/captain-signed-webhook',
  });

  const [webhookBaseUrl, setWebhookBaseUrl] = useState('https://n8n.balidolphintours.com');
  const [logs, setLogs] = useState<{ time: string; type: string; url: string; status: string; details: any }[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [generatedStripeUrl, setGeneratedStripeUrl] = useState<string>('');

  const handleBaseUrlChange = (newBaseUrl: string) => {
    setWebhookBaseUrl(newBaseUrl);
    setFormData(prev => ({
      ...prev,
      n8nStripeUrl: `${newBaseUrl}/webhook/stripe-webhook`,
      n8nMetaUrl: `${newBaseUrl}/webhook/meta-whatsapp-callback`,
      n8nCaptainUrl: `${newBaseUrl}/webhook-test/captain-signed-webhook`
    }));
  };

  const [isVerifying, setIsVerifying] = useState(false);

  // Authenticate using localStorage to remember the session during development
  useEffect(() => {
    const savedPassword = localStorage.getItem('lovina_admin_pass');
    if (savedPassword) {
      setIsVerifying(true);
      fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: savedPassword })
      })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('lovina_admin_pass');
        }
      })
      .catch(() => {})
      .finally(() => setIsVerifying(false));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (response.ok) {
        localStorage.setItem('lovina_admin_pass', passwordInput);
        setIsAuthenticated(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch (err) {
      setPasswordError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lovina_admin_pass');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Helper to add logs
  const logResponse = (type: string, url: string, status: string, details: any) => {
    setLogs(prev => [
      {
        time: new Date().toLocaleTimeString(),
        type,
        url,
        status,
        details
      },
      ...prev
    ]);
  };

  // 1. Dispatch Stripe Webhook
  const generatePaymentLink = async () => {
    setLoadingAction('paymentLink');
    setGeneratedStripeUrl('');
    try {
      const response = await fetch('/api/admin/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || ''
        },
        body: JSON.stringify({
          tourId: formData.tourId,
          date: formData.date,
          guests: formData.guests,
          name: formData.guestName,
          email: formData.guestEmail,
          whatsappNumber: formData.whatsappNumber,
          pickupLocation: formData.pickupLocation,
          hotelDetails: formData.hotelDetails,
          bookingCode: formData.bookingCode,
        })
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        logResponse('Generate Stripe Link', '/api/admin/checkout', 'Error', data.error);
      } else if (data.url) {
        setGeneratedStripeUrl(data.url);
        logResponse('Generate Stripe Link', '/api/admin/checkout', 'Success', data.url);
      }
    } catch (err: any) {
      alert(err.message);
      logResponse('Generate Stripe Link', '/api/admin/checkout', 'Error', err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const sendStripeWebhook = async () => {
    setLoadingAction('stripe');
    const pickupFees: Record<string, number> = { none: 0, lovina: 0, ubud: 35, 'canggu-kuta': 50, uluwatu: 65 };
    const pickupDescs: Record<string, string> = {
      none: 'None',
      lovina: 'Free Local Pickup — Lovina Beach Area',
      ubud: 'Private Return Transfer — Ubud',
      'canggu-kuta': 'Private Return Transfer — Canggu, Seminyak, Kuta',
      uluwatu: 'Private Return Transfer — Uluwatu, Nusa Dua, Jimbaran'
    };

    const tourPrices: Record<string, number> = {
      'seven-am-ethical': 45,
      'swim-snorkel': 65
    };

    const fee = pickupFees[formData.pickupLocation] || 0;
    const desc = pickupDescs[formData.pickupLocation] || 'None';
    const tourPrice = tourPrices[formData.tourId] || 45;
    const mockSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);

    const stripePayload = {
      id: 'evt_test_' + Math.random().toString(36).substring(2, 9),
      object: 'event',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: mockSessionId,
          object: 'checkout.session',
          amount_total: (tourPrice * Number(formData.guests) + fee) * 100,
          currency: 'usd',
          customer_details: {
            email: formData.guestEmail,
            name: formData.guestName,
            phone: formData.whatsappNumber
          },
          metadata: {
            bookingCode: formData.bookingCode,
            tourId: formData.tourId,
            date: formData.date,
            guests: formData.guests.toString(),
            pickupLocation: formData.pickupLocation,
            pickupFee: fee.toString(),
            pickupDescription: desc,
            whatsappNumber: formData.whatsappNumber,
            hotelDetails: formData.hotelDetails
          },
          payment_status: 'paid',
          status: 'complete'
        }
      }
    };

    try {
      const response = await fetch('/api/admin/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || ''
        },
        body: JSON.stringify({
          url: formData.n8nStripeUrl,
          headers: {
            'stripe-signature': 't=12345,v1=mock_signature'
          },
          body: stripePayload
        })
      });

      const resData = await response.json();
      logResponse('Stripe Webhook (Lovina 1)', formData.n8nStripeUrl, `${resData.status || response.status} ${resData.statusText || ''}`, resData.data || resData);
    } catch (err: any) {
      logResponse('Stripe Webhook (Lovina 1)', formData.n8nStripeUrl, 'Error', err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Dispatch Captain Claim quick-reply (Lovina 2)
  const sendCaptainClaim = async () => {
    setLoadingAction('claim');
    const claimPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '109951234567890',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550100',
                  phone_number_id: '109951234567890'
                },
                contacts: [
                  {
                    profile: {
                      name: 'Wayan'
                    },
                    wa_id: '6281234567890'
                  }
                ],
                messages: [
                  {
                    from: '6281234567890',
                    id: 'wamid.HBgNNjI4MTIzNDU2Nzg5MBQVAw0ALTI1NTI1NTIyNzM2MzU1NTA1MzQyMjk4OTg3Njc3Mzk3MTUzNTk4NTA5AA==',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'button',
                    button: {
                      payload: `claim_${formData.bookingCode}_Wayan_+6281234567890`,
                      text: 'Terima Tugas'
                    }
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch('/api/admin/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || ''
        },
        body: JSON.stringify({
          url: formData.n8nMetaUrl,
          headers: {
            'user-agent': 'WhatsApp/1.0.0'
          },
          body: claimPayload
        })
      });

      const resData = await response.json();
      logResponse('Captain Claim Webhook (Lovina 2)', formData.n8nMetaUrl, `${resData.status || response.status} ${resData.statusText || ''}`, resData.data || resData);
    } catch (err: any) {
      logResponse('Captain Claim Webhook (Lovina 2)', formData.n8nMetaUrl, 'Error', err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Dispatch Captain Agreement Signature (Lovina 3)
  const sendCaptainAgreement = async () => {
    setLoadingAction('signature');
    const signaturePayload = {
      bookingId: formData.bookingCode,
      captainName: 'Wayan',
      captainPhone: '+6281234567890',
      signedAt: new Date().toISOString(),
      status: 'signed'
    };

    try {
      const response = await fetch('/api/admin/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || ''
        },
        body: JSON.stringify({
          url: formData.n8nCaptainUrl,
          headers: {},
          body: signaturePayload
        })
      });

      const resData = await response.json();
      logResponse('Captain Signed Webhook (Lovina 3)', formData.n8nCaptainUrl, `${resData.status || response.status} ${resData.statusText || ''}`, resData.data || resData);
    } catch (err: any) {
      logResponse('Captain Signed Webhook (Lovina 3)', formData.n8nCaptainUrl, 'Error', err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="bg-cloud-dancer min-h-screen flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-sm border border-deep-indigo/5 text-center">
          <div className="text-3xl mb-3">⚓</div>
          <h1 className="text-2xl font-serif text-deep-indigo mb-6">Lovina Admin Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                placeholder="Enter Admin Password"
                className="w-full bg-cloud-dancer/50 border-none rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-transformative-teal text-deep-indigo text-center"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {passwordError && (
                <p className="text-xs text-red-500 mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-deep-indigo text-cloud-dancer py-3.5 rounded-full font-bold hover:bg-transformative-teal transition-all cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cloud-dancer min-h-screen px-4 sm:px-6 pt-12 pb-24 font-sans text-deep-indigo">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-deep-indigo/10 pb-6">
          <div>
            <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-widest block mb-1">Administrative Center</span>
            <h1 className="text-3xl font-serif text-deep-indigo">Bali Dolphin Tours Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="bg-deep-indigo/5 hover:bg-deep-indigo/10 text-deep-indigo font-bold px-5 py-2.5 rounded-full text-xs transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Top Hub Grid: Navigation to other routes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-deep-indigo/5 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1">CMS Management</span>
              <h2 className="text-xl font-serif mb-2">Sanity Content Studio</h2>
              <p className="text-xs text-deep-indigo/60 mb-6 font-light leading-relaxed">
                Manage blogs, articles, local restaurant features, and visual media settings.
              </p>
            </div>
            <Link
              href="/admin/desk"
              className="inline-block text-center bg-deep-indigo text-cloud-dancer py-2.5 rounded-full font-bold text-xs hover:bg-transformative-teal transition-all"
            >
              Open CMS Editor
            </Link>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-deep-indigo/5 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1">Content Creation</span>
              <h2 className="text-xl font-serif mb-2">AI SEO Blog Writer</h2>
              <p className="text-xs text-deep-indigo/60 mb-6 font-light leading-relaxed">
                Generate SEO-optimized articles and long-form authority pillars directly from keywords.
              </p>
            </div>
            <Link
              href="/admin/seo-writer"
              className="inline-block text-center bg-deep-indigo text-cloud-dancer py-2.5 rounded-full font-bold text-xs hover:bg-transformative-teal transition-all"
            >
              Open SEO Writer
            </Link>
          </div>

          <div className="bg-transformative-teal/5 p-6 rounded-3xl border border-transformative-teal/10 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1">Live Operation</span>
              <h2 className="text-xl font-serif mb-2">Google Bookings Sheet</h2>
              <p className="text-xs text-deep-indigo/60 mb-6 font-light leading-relaxed">
                View current bookings, assigned captains, and behavioral contract signing status.
              </p>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1r3dhgV_Du2wFK8hqOr_lZexS-wrxI9Xv6QQiyr2APd8/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-center bg-transformative-teal text-cloud-dancer py-2.5 rounded-full font-bold text-xs hover:bg-deep-indigo transition-all"
            >
              Open Live Spreadsheet ↗
            </a>
          </div>
        </div>

        {/* Interactive Webhook Test Suite */}
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Config & Simulation Parameters */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-[2rem] shadow-sm border border-deep-indigo/5 space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-deep-indigo">End-to-End Excursion Test Suite</h2>
              <p className="text-xs text-deep-indigo/50 mt-1">Configure mock booking data and fire events to test n8n dispatch sequences.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-deep-indigo/5 pt-6">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Name</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Email</label>
                <input
                  type="email"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.guestEmail || ''}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Excursion Date</label>
                <input
                  type="date"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Count</label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Tour Type</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={formData.tourId}
                  onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                >
                  <option value="seven-am-ethical">7:00 AM Private Dolphin Watching Tour ($45)</option>
                  <option value="swim-snorkel">7:00 AM Private Dolphin Watching Tour + Swim & Snorkel ($65)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Pickup Location Option</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                >
                  <option value="none">No Driver (Self-Drive Meetup)</option>
                  <option value="lovina">Free Local Shuttle (~7:30 AM)</option>
                  <option value="ubud">Ubud Return Transfer ($35)</option>
                  <option value="canggu-kuta">Canggu/Kuta Return Transfer ($50)</option>
                  <option value="uluwatu">Uluwatu Return Transfer ($65)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">WhatsApp Number (For Alerts)</label>
                <input
                  type="text"
                  placeholder="e.g. +6281234567890"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Hotel Details</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.hotelDetails}
                  onChange={(e) => setFormData({ ...formData, hotelDetails: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Booking Code ID</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={formData.bookingCode}
                  onChange={(e) => setFormData({ ...formData, bookingCode: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const codes = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let code = 'LEM-';
                    for (let i = 0; i < 4; i++) code += codes.charAt(Math.floor(Math.random() * codes.length));
                    setFormData({ ...formData, bookingCode: code });
                  }}
                  className="w-full bg-deep-indigo/5 hover:bg-deep-indigo/10 text-deep-indigo border-none rounded-xl py-2.5 text-[10px] uppercase font-bold tracking-wider mt-6 cursor-pointer"
                >
                  Regenerate Code ID
                </button>
              </div>
            </div>

            {/* Generate Stripe Link Action */}
            <div className="border-t border-deep-indigo/5 pt-6 space-y-4">
              <button
                type="button"
                onClick={generatePaymentLink}
                disabled={loadingAction !== null}
                className="w-full bg-coral-pop text-white rounded-full py-4 text-xs uppercase font-bold tracking-widest hover:bg-deep-indigo transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'paymentLink' ? 'Generating Secure Link...' : '🔗 Generate Stripe Payment Link'}
              </button>

              {generatedStripeUrl && (
                <div className="bg-transformative-teal/5 border border-transformative-teal/20 rounded-2xl p-5 space-y-3 animate-in fade-in duration-300">
                  <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-widest block">Stripe Payment Link Generated!</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly
                      className="flex-1 bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-mono select-all"
                      value={generatedStripeUrl}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedStripeUrl);
                        alert('Copied to clipboard!');
                      }}
                      className="bg-deep-indigo text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-transformative-teal transition-all cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <a
                      href={`https://wa.me/${formData.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${formData.guestName}! Here is the secure link to complete your private dolphin tour booking: ${generatedStripeUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      💬 Share on WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Target webhook configurations */}
            <div className="space-y-4 border-t border-deep-indigo/5 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-deep-indigo/60">Target Webhook Endpoints</h3>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Shared Webhook Base URL</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  placeholder="https://n8n.balidolphintours.com"
                  value={webhookBaseUrl}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                />
                <p className="text-[9px] text-deep-indigo/40 mt-1">Updates the base domain for all three endpoints below automatically.</p>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">n8n Stripe Webhook URL</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.n8nStripeUrl}
                  onChange={(e) => setFormData({ ...formData, n8nStripeUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">n8n Meta Callback URL (WhatsApp replies)</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={formData.n8nMetaUrl}
                  onChange={(e) => setFormData({ ...formData, n8nMetaUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">n8n Captain Signed Webhook URL (3rd Workflow)</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-semibold"
                  value={formData.n8nCaptainUrl}
                  onChange={(e) => setFormData({ ...formData, n8nCaptainUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Simulation Trigger Actions */}
            <div className="space-y-4 border-t border-deep-indigo/5 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-deep-indigo/60">Trigger Simulations</h3>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={sendStripeWebhook}
                  disabled={loadingAction !== null}
                  className="flex flex-col justify-between items-center text-center p-5 rounded-2xl border border-deep-indigo/10 hover:border-transformative-teal bg-white hover:bg-transformative-teal/5 transition-all text-xs font-bold leading-normal disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-xl mb-2">💵</span>
                  <span>Confirm Cash Booking (Mock Webhook)</span>
                  <span className="text-[9px] text-deep-indigo/40 font-normal mt-1">Directly registers booking & dispatches captains</span>
                </button>

                <button
                  onClick={sendCaptainClaim}
                  disabled={loadingAction !== null}
                  className="flex flex-col justify-between items-center text-center p-5 rounded-2xl border border-deep-indigo/10 hover:border-transformative-teal bg-white hover:bg-transformative-teal/5 transition-all text-xs font-bold leading-normal disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-xl mb-2">Claim</span>
                  <span>2. Captain Claims Booking</span>
                  <span className="text-[9px] text-deep-indigo/40 font-normal mt-1">Triggers Lovina 2 WhatsApp claim routing</span>
                </button>

                <button
                  onClick={sendCaptainAgreement}
                  disabled={loadingAction !== null}
                  className="flex flex-col justify-between items-center text-center p-5 rounded-2xl border border-deep-indigo/10 hover:border-transformative-teal bg-white hover:bg-transformative-teal/5 transition-all text-xs font-bold leading-normal disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-xl mb-2">✍</span>
                  <span>3. Captain Signs Agreement</span>
                  <span className="text-[9px] text-deep-indigo/40 font-normal mt-1">Triggers Lovina 3 unlock & confirmation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Event Logs */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-deep-indigo/5 flex flex-col h-[600px] lg:h-auto">
            <div className="flex justify-between items-center border-b border-deep-indigo/5 pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg">Transaction Logs</h3>
                <p className="text-[10px] text-deep-indigo/40">Real-time status tracking of simulated actions.</p>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[9px] uppercase font-bold tracking-wider text-deep-indigo/40 hover:text-red-500 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-[10px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-deep-indigo/30 italic text-center select-none">
                  No mock events triggered yet. Click one of the simulation cards to begin.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-cloud-dancer/40 rounded-xl border border-deep-indigo/5 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-transformative-teal">{log.type}</span>
                      <span className="text-deep-indigo/40">{log.time}</span>
                    </div>
                    <div className="text-[9px] text-deep-indigo/60 break-all">{log.url}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-bold">Status:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        log.status.includes('200') || log.status.includes('OK') || log.status.includes('true')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <details className="mt-2 group">
                      <summary className="text-[8px] uppercase tracking-wider text-transformative-teal hover:underline cursor-pointer select-none">
                        Show Payload / Response
                      </summary>
                      <pre className="mt-1.5 p-2 bg-deep-indigo/5 rounded border border-deep-indigo/5 overflow-x-auto text-[9px] max-h-40">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
