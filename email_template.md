# Bali Dolphin Tours: Customer Confirmation Email Template

Use the following copy-pasteable blocks for your **`Send Guest Email Receipt`** node in n8n.

---

### 1. **Send To** (Field)
Copy and paste this into the **Send To** input field in n8n:
```text
{{ $node["Get Guest & Stripe Details Raw"].json.GuestEmail }}
```

---

### 2. **Subject** (Field)
Copy and paste this into the **Subject** input field in n8n:
```text
Confirmed: Your Private Dolphin Excursion on {{ $node["Get Guest & Stripe Details Raw"].json.Date }} ⛵
```

---

### 3. **Message** (Body Field)
Toggle **`Expression`** mode (`fx` button) for the **Message** field, then copy and paste the entire block below:

```text
🌅 BALI DOLPHIN TOURS — BOOKING CONFIRMED! ⛵🐬

Hi {{ $node["Get Guest & Stripe Details Raw"].json.GuestName }},

Thank you for booking a private, ethical dolphin tour with Bali Dolphin Tours! Your private outrigger boat is secured for a quiet morning encounter on the sea.

📅 EXCURSION DETAILS:
• Booking ID: {{ $node["Get Guest & Stripe Details Raw"].json.BookingCode }}
• Date: {{ $node["Get Guest & Stripe Details Raw"].json.Date }}
• Meetup/Pickup Time: {{ $node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'none' ? '6:30 AM (Meet at Beach)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'lovina' ? '6:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'ubud' ? '3:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'canggu-kuta' ? '4:00 AM (Hotel Lobby)' : '3:30 AM (Hotel Lobby)'))) }}
• Departure Time: 07:00 AM WITA sharp
• Guests: {{ $node["Get Guest & Stripe Details Raw"].json.Guests }} People
• Assigned Captain: Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}

📍 LOCATION & COORDINATION:
• Transfer Option: {{ $node["Get Guest & Stripe Details Raw"].json.PickupDescription }}
• Specifics: {{ $node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'none' ? 'Direct Meetup at the Lovina Beach Dolphin Statue (Kalibukbuk) at 6:30 AM. Here is the Google Maps link for directions: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue. Your captain will meet you by the statue.' : 'Our driver will pick you up directly from the lobby of: ' + $node["Get Guest & Stripe Details Raw"].json.HotelDetails }}

💬 WHAT'S NEXT?
Your captain (Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}) will contact you directly via WhatsApp (at {{ $node["Get Guest & Stripe Details Raw"].json.GuestPhone }}) the afternoon before your excursion (by 5:00 PM Bali Time) to confirm water conditions and coordinate final details.

⚓ THE ETHICAL PROMISE:
We are dedicated to sustainable tourism. Our captains operate under a strict code of behavior: keeping a 30-meter buffer, keeping a safe parallel distance, and never chasing or swarming pods. Thank you for supporting ethical dolphin tours in Lovina!

See you on the water! ⛵🐬
Bali Dolphin Tours Team
```
