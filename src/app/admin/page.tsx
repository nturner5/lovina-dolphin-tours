'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Test form values (reverted to original layout - no tourId)
  const [formData, setFormData] = useState({
    guestName: 'John Doe',
    guestEmail: 'john.doe@example.com',
    date: '2026-06-08',
    guests: '2',
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

  // Live Dashboard States
  const [bookings, setBookings] = useState<any[]>([]);
  
  // WhatsApp Lead Generator States
  const [leadForm, setLeadForm] = useState({
    guestName: '',
    guestPhone: '',
    referrer: '',
    hotelDetails: ''
  });
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadStatus, setLeadStatus] = useState({ type: '', message: '' });

  const handleCreateWhatsAppLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingLead(true);
    setLeadStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/admin/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || ''
        },
        body: JSON.stringify({
          url: 'https://n8n.balidolphintours.com/webhook/whatsapp-lead-trigger',
          body: leadForm
        })
      });

      const resData = await response.json();

      if (response.ok && resData.status >= 200 && resData.status < 300) {
        setLeadStatus({
          type: 'success',
          message: `Successfully sent WhatsApp invitation link to ${leadForm.guestName} (${leadForm.guestPhone})!`
        });
        setLeadForm({ guestName: '', guestPhone: '', referrer: '', hotelDetails: '' });
      } else {
        const errMsg = typeof resData.data === 'string' ? resData.data : JSON.stringify(resData.data || 'Failed to trigger lead invite');
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setLeadStatus({
        type: 'error',
        message: err.message || 'Error occurred while triggering lead invite.'
      });
    } finally {
      setIsCreatingLead(false);
    }
  };
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'future' | 'past'>('all');
  const [filterCaptain, setFilterCaptain] = useState('all');

  // Manual booking form state
  const [manualForm, setManualForm] = useState({
    guestName: '',
    guestEmail: '',
    whatsappNumber: '',
    date: '',
    guests: '2',
    tourId: 'seven-am-ethical',
    pickupLocation: 'none',
    hotelDetails: '',
    paymentType: 'cash',
  });
  const [manualCreatedLink, setManualCreatedLink] = useState('');
  const [manualBookingError, setManualBookingError] = useState<string | null>(null);
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Edit details modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Transport upgrade link state
  const [upgradeLocation, setUpgradeLocation] = useState('ubud');
  const [generatedUpgradeUrl, setGeneratedUpgradeUrl] = useState('');
  const [isGeneratingUpgrade, setIsGeneratingUpgrade] = useState(false);

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

  // Fetch bookings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

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

  // Dashboard API Handlers
  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    setBookingsError(null);
    try {
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
        },
      });
      const data = await response.json();
      if (data.error) {
        setBookingsError(data.error);
      } else {
        setBookings(data.bookings || []);
      }
    } catch (err: any) {
      setBookingsError(err.message || 'Failed to fetch bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBookingError(null);
    setManualCreatedLink('');
    setIsCreatingManual(true);

    try {
      const {
        guestName,
        guestEmail,
        whatsappNumber,
        date,
        guests,
        tourId,
        pickupLocation,
        hotelDetails,
        paymentType,
      } = manualForm;

      if (!guestName || !whatsappNumber || !date || !guests) {
        throw new Error('Please fill in Name, WhatsApp, Date, and Guest Count.');
      }

      // Generate shortcode
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let shortCode = '';
      for (let i = 0; i < 4; i++) {
        shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const bookingCode = `LEM-${shortCode}`;

      // Calculate transport names & labels
      const pickupDescs: Record<string, string> = {
        none: 'None',
        lovina: 'Free Local Pickup — Lovina Beach Area',
        ubud: 'Private Return Transfer — Ubud',
        'canggu-kuta': 'Private Return Transfer — Canggu, Seminyak, Kuta',
        uluwatu: 'Private Return Transfer — Uluwatu, Nusa Dua, Jimbaran',
      };
      const pickupDesc = pickupDescs[pickupLocation] || 'None';

      if (paymentType === 'stripe') {
        // Generate payment link
        const response = await fetch('/api/admin/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
          },
          body: JSON.stringify({
            tourId,
            date,
            guests: Number(guests),
            name: guestName,
            email: guestEmail,
            whatsappNumber,
            pickupLocation,
            hotelDetails,
            bookingCode,
          }),
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.url) {
          setManualCreatedLink(data.url);
          alert('Stripe Payment Link Generated successfully!');
        }
      } else {
        // Cash / bank transfer booking - directly post to Airtable
        const fields = {
          BookingCode: bookingCode,
          Date: date,
          Guests: Number(guests),
          PickupLocation: pickupLocation,
          PickupDescription: pickupDesc,
          WhatsappNumber: whatsappNumber,
          GuestPhone: whatsappNumber,
          HotelDetails: hotelDetails,
          GuestName: guestName,
          GuestEmail: guestEmail,
          AssignedCaptain: 'PENDING',
          RulesSigned: 'PENDING',
        };

        const response = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
          },
          body: JSON.stringify({
            action: 'create',
            fields,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        alert('Cash booking logged in Airtable successfully!');
        setManualForm({
          guestName: '',
          guestEmail: '',
          whatsappNumber: '',
          date: '',
          guests: '2',
          tourId: 'seven-am-ethical',
          pickupLocation: 'none',
          hotelDetails: '',
          paymentType: 'cash',
        });
        fetchBookings();
      }
    } catch (err: any) {
      setManualBookingError(err.message || 'Failed to create manual booking');
    } finally {
      setIsCreatingManual(false);
    }
  };

  const openEditModal = (booking: any) => {
    setSelectedBooking(booking);
    setEditFields({
      Date: booking.Date || '',
      Guests: booking.Guests || '',
      AssignedCaptain: booking.AssignedCaptain || '',
      CaptainPhone: booking.CaptainPhone || '',
      HotelDetails: booking.HotelDetails || '',
      PickupLocation: booking.PickupLocation || 'none',
      PickupDescription: booking.PickupDescription || 'None',
      WhatsappNumber: booking.WhatsappNumber || '',
    });
    setUpgradeLocation('ubud');
    setGeneratedUpgradeUrl('');
    setIsEditModalOpen(true);
  };

  const handleEditPickupChange = (loc: string) => {
    const pickupDescs: Record<string, string> = {
      none: 'None',
      lovina: 'Free Local Pickup — Lovina Beach Area',
      ubud: 'Private Return Transfer — Ubud',
      'canggu-kuta': 'Private Return Transfer — Canggu, Seminyak, Kuta',
      uluwatu: 'Private Return Transfer — Uluwatu, Nusa Dua, Jimbaran',
    };
    setEditFields((prev: any) => ({
      ...prev,
      PickupLocation: loc,
      PickupDescription: pickupDescs[loc] || 'None',
    }));
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
        },
        body: JSON.stringify({
          id: selectedBooking.id,
          fields: {
            Date: editFields.Date,
            Guests: Number(editFields.Guests),
            AssignedCaptain: editFields.AssignedCaptain,
            CaptainPhone: editFields.CaptainPhone,
            HotelDetails: editFields.HotelDetails,
            PickupLocation: editFields.PickupLocation,
            PickupDescription: editFields.PickupDescription,
            WhatsappNumber: editFields.WhatsappNumber,
            GuestPhone: editFields.WhatsappNumber,
          },
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('Booking updated successfully!');
        setIsEditModalOpen(false);
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update booking');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!confirm(`Are you absolutely sure you want to cancel and refund booking ${selectedBooking.BookingCode}? This will issue a full refund in Stripe and mark the booking status to CANCELLED in Airtable.`)) {
      return;
    }
    setIsCancelling(true);
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
        },
        body: JSON.stringify({
          action: 'cancel',
          bookingCode: selectedBooking.BookingCode,
          recordId: selectedBooking.id,
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(`Booking cancelled successfully!\nStatus: ${data.refundStatus}`);
        setIsEditModalOpen(false);
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleGenerateTransportUpgradeLink = async () => {
    if (!selectedBooking) return;
    setIsGeneratingUpgrade(true);
    setGeneratedUpgradeUrl('');
    try {
      const response = await fetch('/api/admin/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('lovina_admin_pass') || '',
        },
        body: JSON.stringify({
          tourId: 'transport-only',
          date: selectedBooking.Date || '',
          guests: 1,
          name: selectedBooking.GuestName || '',
          email: selectedBooking.GuestEmail || '',
          whatsappNumber: selectedBooking.WhatsappNumber || '',
          pickupLocation: upgradeLocation,
          hotelDetails: selectedBooking.HotelDetails || '',
          bookingCode: selectedBooking.BookingCode,
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else if (data.url) {
        setGeneratedUpgradeUrl(data.url);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate upgrade link');
    } finally {
      setIsGeneratingUpgrade(false);
    }
  };

  // Reverted Test Suite Stripe webhook dispatcher (price = 45, tourId = 'seven-am-ethical')
  const sendStripeWebhook = async () => {
    setLoadingAction('stripe');
    const pickupFees: Record<string, number> = { none: 0, lovina: 0, ubud: 42, 'canggu-kuta': 60, uluwatu: 78 };
    const pickupDescs: Record<string, string> = {
      none: 'None',
      lovina: 'Free Local Pickup — Lovina Beach Area',
      ubud: 'Private Return Transfer — Ubud',
      'canggu-kuta': 'Private Return Transfer — Canggu, Seminyak, Kuta',
      uluwatu: 'Private Return Transfer — Uluwatu, Nusa Dua, Jimbaran'
    };

    const fee = pickupFees[formData.pickupLocation] || 0;
    const desc = pickupDescs[formData.pickupLocation] || 'None';
    const tourPrice = 45;
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
            tourId: 'seven-am-ethical',
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

  // Get unique captains from bookings list
  const uniqueCaptains = Array.from(
    new Set(
      bookings
        .map((b) => b.AssignedCaptain)
        .filter((c) => c && c !== 'PENDING' && c !== 'CANCELLED')
    )
  );

  // Filter logic
  const filteredBookings = bookings.filter((booking) => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (booking.GuestName || '').toLowerCase().includes(searchLower) ||
      (booking.BookingCode || '').toLowerCase().includes(searchLower) ||
      (booking.GuestEmail || '').toLowerCase().includes(searchLower) ||
      (booking.WhatsappNumber || '').toLowerCase().includes(searchLower) ||
      (booking.HotelDetails || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Date Filter
    if (filterDate !== 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      const bookingDate = booking.Date; // e.g. "2026-06-12"
      
      if (filterDate === 'today' && bookingDate !== todayStr) return false;
      if (filterDate === 'future' && bookingDate <= todayStr) return false;
      if (filterDate === 'past' && bookingDate >= todayStr) return false;
    }

    // 3. Captain Filter
    if (filterCaptain !== 'all') {
      if (filterCaptain === 'unassigned') {
        const isUnassigned = !booking.AssignedCaptain || booking.AssignedCaptain === 'PENDING' || booking.AssignedCaptain === '';
        if (!isUnassigned) return false;
      } else {
        if (booking.AssignedCaptain !== filterCaptain) return false;
      }
    }

    return true;
  });

  // Get status badges dynamically
  const getStatusBadge = (booking: any) => {
    const captain = booking.AssignedCaptain;
    const rules = booking.RulesSigned;
    
    if (captain === 'CANCELLED' || rules === 'CANCELLED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
          CANCELLED
        </span>
      );
    }
    if (!captain || captain === 'PENDING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse">
          PENDING CLAIM
        </span>
      );
    }
    if (rules === 'signed' || rules === 'Yes' || rules === 'true') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          CONFIRMED ({captain})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
        CLAIMED ({captain})
      </span>
    );
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
              <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block mb-1">Live Database</span>
              <h2 className="text-xl font-serif mb-2">Airtable Bookings Base</h2>
              <p className="text-xs text-deep-indigo/60 mb-6 font-light leading-relaxed">
                View database tables, webhook execution paths, and live operations records.
              </p>
            </div>
            <a
              href="https://airtable.com/applZ1nCH21kq42Tz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-center bg-transformative-teal text-cloud-dancer py-2.5 rounded-full font-bold text-xs hover:bg-deep-indigo transition-all"
            >
              Open Airtable Base ↗
            </a>
          </div>
        </div>

        {/* 1. MANUAL BOOKING COORDINATOR */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-deep-indigo/5 p-6 sm:p-10 space-y-6">
          <div>
            <h2 className="text-2xl font-serif text-deep-indigo">Manual Booking Coordinator</h2>
            <p className="text-xs text-deep-indigo/50 mt-1">
              <strong>Use Case:</strong> Use this when the booking details are already finalized (the guest chose dates, hotel, etc. and paid via Cash or bank transfer) and you want to log it manually.
            </p>
          </div>

          <form onSubmit={handleCreateManualBooking} className="space-y-6">
            {manualBookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl">
                {manualBookingError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 border-t border-deep-indigo/5 pt-6">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={manualForm.guestName}
                  onChange={(e) => setManualForm({ ...manualForm, guestName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Email (Optional)</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={manualForm.guestEmail}
                  onChange={(e) => setManualForm({ ...manualForm, guestEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">WhatsApp Number (With Country Code)</label>
                <input
                  type="text"
                  required
                  placeholder="+6281234567890"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={manualForm.whatsappNumber}
                  onChange={(e) => setManualForm({ ...manualForm, whatsappNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Excursion Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={manualForm.guests}
                  onChange={(e) => setManualForm({ ...manualForm, guests: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Tour Type</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={manualForm.tourId}
                  onChange={(e) => setManualForm({ ...manualForm, tourId: e.target.value as any })}
                >
                  <option value="seven-am-ethical">7:00 AM Private Dolphin watching ($45/person)</option>
                  <option value="swim-snorkel">7:00 AM Private Dolphin + Swim & Snorkel ($65/person)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Pickup Location Option</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={manualForm.pickupLocation}
                  onChange={(e) => setManualForm({ ...manualForm, pickupLocation: e.target.value as any })}
                >
                  <option value="none">No Driver (Self-Drive Meetup)</option>
                  <option value="lovina">Free Local Shuttle (~7:30 AM)</option>
                  <option value="ubud">Ubud Return Transfer (+$42)</option>
                  <option value="canggu-kuta">Canggu/Kuta Return Transfer (+$60)</option>
                  <option value="uluwatu">Uluwatu Return Transfer (+$78)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Hotel Details & Special Pickup Notes</label>
                <input
                  type="text"
                  placeholder="Hotel name, room number, or meetup notes"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={manualForm.hotelDetails}
                  onChange={(e) => setManualForm({ ...manualForm, hotelDetails: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-deep-indigo/5 pt-6 gap-4">
              {/* Payment Selection & Live Total */}
              <div className="flex items-center gap-6 self-start">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Payment Booking Type</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="cash"
                        checked={manualForm.paymentType === 'cash'}
                        onChange={() => setManualForm({ ...manualForm, paymentType: 'cash' })}
                        className="accent-transformative-teal"
                      />
                      Cash / Bank Transfer
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="stripe"
                        checked={manualForm.paymentType === 'stripe'}
                        onChange={() => setManualForm({ ...manualForm, paymentType: 'stripe' })}
                        className="accent-transformative-teal"
                      />
                      Stripe Card Payment Link
                    </label>
                  </div>
                </div>

                <div className="border-l border-deep-indigo/10 pl-6">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-1">Calculated Price</span>
                  <span className="text-xl font-serif font-bold text-transformative-teal">
                    ${(manualForm.tourId === 'seven-am-ethical' ? 45 : 65) * Number(manualForm.guests) + (manualForm.pickupLocation === 'ubud' ? 42 : manualForm.pickupLocation === 'canggu-kuta' ? 60 : manualForm.pickupLocation === 'uluwatu' ? 78 : 0)} USD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingManual}
                className="w-full sm:w-auto bg-coral-pop hover:bg-deep-indigo text-white rounded-full px-8 py-3.5 text-xs uppercase font-bold tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                {isCreatingManual 
                  ? 'Processing...' 
                  : manualForm.paymentType === 'stripe' 
                    ? '🔗 Generate Payment Link' 
                    : '✍ Book Cash Excursion'
                }
              </button>
            </div>

            {manualCreatedLink && (
              <div className="bg-transformative-teal/5 border border-transformative-teal/20 rounded-2xl p-5 space-y-3 animate-in fade-in duration-300">
                <span className="text-[10px] font-bold text-transformative-teal uppercase tracking-widest block">Stripe Payment Link Generated!</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    className="flex-1 bg-white border border-deep-indigo/10 rounded-xl px-4 py-2 text-xs font-mono select-all"
                    value={manualCreatedLink}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(manualCreatedLink);
                      alert('Copied to clipboard!');
                    }}
                    className="bg-deep-indigo text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-transformative-teal transition-all cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <a
                    href={`https://wa.me/${manualForm.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${manualForm.guestName}! Here is the secure link to complete your private dolphin tour booking: ${manualCreatedLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    💬 Share on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 1.5. WHATSAPP LEAD GENERATOR */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-deep-indigo/5 p-6 sm:p-10 space-y-6">
          <div className="border-b border-deep-indigo/5 pb-4">
            <h2 className="text-2xl font-serif text-deep-indigo">WhatsApp Booking Lead Generator</h2>
            <p className="text-xs text-deep-indigo/50 mt-1">
              <strong>Use Case:</strong> Use this when a villa manager sends you a guest's contact info but they haven't paid or chosen dates yet. This sends the guest an automated welcome message with a pre-filled booking link to complete checkout securely.
            </p>
          </div>

          <form onSubmit={handleCreateWhatsAppLead} className="space-y-6">
            {leadStatus.message && (
              <div className={`text-xs p-4 rounded-xl border ${
                leadStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {leadStatus.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={leadForm.guestName}
                  onChange={(e) => setLeadForm({ ...leadForm, guestName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  required
                  placeholder="+12083164406"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={leadForm.guestPhone}
                  onChange={(e) => setLeadForm({ ...leadForm, guestPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Referrer (Villa Manager)</label>
                <input
                  type="text"
                  placeholder="Villa Host Putu"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={leadForm.referrer}
                  onChange={(e) => setLeadForm({ ...leadForm, referrer: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Hotel/Villa Details</label>
                <input
                  type="text"
                  placeholder="Villa Lovina Room 3"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={leadForm.hotelDetails}
                  onChange={(e) => setLeadForm({ ...leadForm, hotelDetails: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-deep-indigo/5">
              <button
                type="submit"
                disabled={isCreatingLead}
                className="bg-transformative-teal hover:bg-deep-indigo text-cloud-dancer px-8 py-3.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isCreatingLead ? 'Sending Invite...' : '🚀 Send WhatsApp Invite'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. AIRTABLE BOOKINGS MANAGER */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-deep-indigo/5 p-6 sm:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-serif text-deep-indigo">Database Bookings Manager</h2>
              <p className="text-xs text-deep-indigo/50 mt-1">
                <strong>Use Case:</strong> Review and manage live bookings stored in Supabase, assign captains, and check sign status.
              </p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={isLoadingBookings}
              className="self-start md:self-auto bg-deep-indigo/5 hover:bg-deep-indigo/10 text-deep-indigo px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoadingBookings ? 'Refreshing...' : '🔄 Refresh Bookings'}
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-deep-indigo/5 pt-6">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Search Records</label>
              <input
                type="text"
                placeholder="Name, email, phone, or code..."
                className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Filter by Excursion Date</label>
              <select
                className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today's Excursions</option>
                <option value="future">Future Bookings</option>
                <option value="past">Past Bookings</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Filter by Captain</label>
              <select
                className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                value={filterCaptain}
                onChange={(e) => setFilterCaptain(e.target.value)}
              >
                <option value="all">All Captains</option>
                <option value="unassigned">Unassigned (Pending Claim)</option>
                {uniqueCaptains.map((cap: any) => (
                  <option key={cap} value={cap}>{cap}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border-t border-deep-indigo/5 pt-6">
            {bookingsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl">
                <strong>Error:</strong> {bookingsError}
              </div>
            )}

            {isLoadingBookings && bookings.length === 0 ? (
              <div className="text-center py-12 text-deep-indigo/40 text-xs animate-pulse">
                Loading live bookings from Airtable...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-deep-indigo/40 text-xs italic">
                No bookings match your current search and filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-deep-indigo/10 text-[10px] font-bold uppercase tracking-wider text-deep-indigo/40">
                      <th className="pb-3 pr-4">Code</th>
                      <th className="pb-3 pr-4">Guest</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4 text-center">Guests</th>
                      <th className="pb-3 pr-4">Pickup / Hotel</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deep-indigo/5 text-xs">
                    {filteredBookings.map((booking) => (
                      <tr 
                        key={booking.id}
                        onClick={() => openEditModal(booking)}
                        className="hover:bg-deep-indigo/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 pr-4 font-mono font-bold text-transformative-teal">
                          {booking.BookingCode || '—'}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-bold">{booking.GuestName || 'Unknown'}</div>
                          <div className="text-[10px] text-deep-indigo/50 font-light">{booking.GuestEmail || 'No Email'}</div>
                          <div className="text-[10px] text-deep-indigo/50 font-light">{booking.WhatsappNumber || booking.GuestPhone || 'No Phone'}</div>
                        </td>
                        <td className="py-4 pr-4 font-medium">
                          {booking.Date || '—'}
                        </td>
                        <td className="py-4 pr-4 text-center font-bold">
                          {booking.Guests || '—'}
                        </td>
                        <td className="py-4 pr-4 max-w-xs truncate">
                          <div className="font-medium">{booking.PickupDescription || 'None'}</div>
                          {booking.HotelDetails && (
                            <div className="text-[10px] text-deep-indigo/50 truncate font-light">
                              🏨 {booking.HotelDetails}
                            </div>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {getStatusBadge(booking)}
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(booking);
                            }}
                            className="text-[10px] uppercase font-bold tracking-wider text-deep-indigo hover:text-transformative-teal"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Pickup Location Option</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                >
                  <option value="none">No Driver (Self-Drive Meetup)</option>
                  <option value="lovina">Free Local Shuttle (~7:30 AM)</option>
                  <option value="ubud">Ubud Return Transfer ($42)</option>
                  <option value="canggu-kuta">Canggu/Kuta Return Transfer ($60)</option>
                  <option value="uluwatu">Uluwatu Return Transfer ($78)</option>
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
                  <span className="text-xl mb-2">💳</span>
                  <span>1. Stripe Checkout Completed</span>
                  <span className="text-[9px] text-deep-indigo/40 font-normal mt-1">Triggers Lovina 1 sequential bidding</span>
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

      {/* EDIT / DETAILS MODAL */}
      {isEditModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-deep-indigo/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-deep-indigo/10 shadow-2xl p-6 sm:p-10 space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-deep-indigo/5 pb-4">
              <div>
                <span className="text-[9px] font-bold text-transformative-teal uppercase tracking-widest block">Manage Booking Details</span>
                <h3 className="text-2xl font-serif text-deep-indigo">
                  {selectedBooking.GuestName || 'Guest Record'} ({selectedBooking.BookingCode})
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-deep-indigo/40 hover:text-deep-indigo font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Guest WhatsApp / Phone</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={editFields.WhatsappNumber}
                  onChange={(e) => setEditFields({ ...editFields, WhatsappNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Excursion Date</label>
                <input
                  type="date"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={editFields.Date}
                  onChange={(e) => setEditFields({ ...editFields, Date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Number of Guests</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-bold"
                  value={editFields.Guests}
                  onChange={(e) => setEditFields({ ...editFields, Guests: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Assigned Captain</label>
                <input
                  type="text"
                  placeholder="e.g. Wayan, Ketut (or PENDING)"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-semibold"
                  value={editFields.AssignedCaptain}
                  onChange={(e) => setEditFields({ ...editFields, AssignedCaptain: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Captain Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +6281234567890"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-mono"
                  value={editFields.CaptainPhone}
                  onChange={(e) => setEditFields({ ...editFields, CaptainPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Pickup Location Option</label>
                <select
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={editFields.PickupLocation}
                  onChange={(e) => handleEditPickupChange(e.target.value)}
                >
                  <option value="none">No Driver (Self-Drive Meetup)</option>
                  <option value="lovina">Free Local Shuttle (~7:30 AM)</option>
                  <option value="ubud">Ubud Return Transfer</option>
                  <option value="canggu-kuta">Canggu/Kuta Return Transfer</option>
                  <option value="uluwatu">Uluwatu Return Transfer</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-deep-indigo/40 mb-2">Hotel Details & Shuttle Description</label>
                <input
                  type="text"
                  className="w-full bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo"
                  value={editFields.HotelDetails}
                  onChange={(e) => setEditFields({ ...editFields, HotelDetails: e.target.value })}
                />
              </div>
            </div>

            {/* Upgrade Transport Payment Link Generator Section */}
            <div className="border-t border-deep-indigo/5 pt-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-deep-indigo/60">Generate Driver Transport Upgrade</h4>
              <p className="text-[10px] text-deep-indigo/40">If the guest requested return transport after booking, generate a Stripe checkout link and share on WhatsApp.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <select
                  className="w-full sm:w-auto bg-cloud-dancer/50 border-none rounded-xl px-4 py-2.5 text-xs text-deep-indigo font-medium cursor-pointer"
                  value={upgradeLocation}
                  onChange={(e) => setUpgradeLocation(e.target.value)}
                >
                  <option value="ubud">Ubud Return Transfer ($42)</option>
                  <option value="canggu-kuta">Canggu/Kuta Return Transfer ($60)</option>
                  <option value="uluwatu">Uluwatu Return Transfer ($78)</option>
                </select>
                <button
                  onClick={handleGenerateTransportUpgradeLink}
                  disabled={isGeneratingUpgrade}
                  className="w-full sm:w-auto bg-deep-indigo hover:bg-transformative-teal text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingUpgrade ? 'Generating...' : '🔗 Generate Upgrade Link'}
                </button>
              </div>
              
              {generatedUpgradeUrl && (
                <div className="bg-transformative-teal/5 border border-transformative-teal/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly
                      className="flex-1 bg-white border border-deep-indigo/10 rounded-xl px-3 py-1.5 text-xs font-mono select-all"
                      value={generatedUpgradeUrl}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedUpgradeUrl);
                        alert('Copied to clipboard!');
                      }}
                      className="bg-deep-indigo text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-transformative-teal transition-all cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/${(editFields.WhatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${selectedBooking.GuestName}! Here is the payment link to add the private return transfer to your booking: ${generatedUpgradeUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700"
                  >
                    💬 Share on WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-deep-indigo/5 pt-6 gap-4">
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleUpdateBooking}
                  disabled={isSavingEdit}
                  className="flex-1 sm:flex-none bg-deep-indigo hover:bg-transformative-teal text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                
                <a
                  href={`https://wa.me/${(editFields.WhatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedBooking.GuestName}! We have adjusted your Lovina Dolphin Tour details. Date: ${editFields.Date}, Guests: ${editFields.Guests}. Assigned Captain: ${editFields.AssignedCaptain || 'Pending'}. Please let us know if this is ok. Thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none border border-green-600 hover:bg-green-50 text-green-600 px-5 py-2.5 rounded-full text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  💬 Send WhatsApp Alert
                </a>
              </div>

              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="w-full sm:w-auto border border-red-500 hover:bg-red-50 text-red-500 px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Processing...' : '⚠️ Cancel & Refund Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
