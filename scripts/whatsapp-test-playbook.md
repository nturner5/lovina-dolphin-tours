# Bali Dolphin Tours: WhatsApp & API Testing Playbook

This playbook contains direct, copy-pasteable terminal commands to test and simulate every stage of your booking dispatch and WhatsApp communication pipeline.

---

## 🔑 Prerequisites (Run First)

All of these curl commands automatically load your secret `META_ACCESS_TOKEN` directly from your local `.env.local` file so you do not have to copy and paste it. 

Before running any tests, open your terminal in the root of the project directory (`/Users/nathanturner/Documents/code_projects/lovina-dolphin-tours`) and export the token:

```bash
export META_ACCESS_TOKEN=$(grep META_ACCESS_TOKEN .env.local | cut -d'"' -f2)
```

---

## 1️⃣ Test Request 1: Send Sandbox 'Hello World' Template
* **Purpose:** Verifies that your personal phone number is whitelisted in Meta's Sandbox and that the Sandbox channel is actively delivering messages.
* **Sender ID:** `1146773325183741` (Sandbox Test ID)
* **Recipient:** `+6281234567890` (Your WhatsApp number)
* **Webhook Inbound:** **Fully Enabled.** If you reply to this message on your phone, Meta will successfully forward the webhook to your local n8n tunnel!

### Run Command:
```bash
curl -X POST "https://graph.facebook.com/v20.0/1146773325183741/messages" \
  -H "Authorization: Bearer $META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "6281234567890",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

---

## 2️⃣ Test Request 2: Send Production 'Prioritized Captain Broadcast'
* **Purpose:** Verifies the visual formatting, layout, quick-reply buttons, and Indonesian translations of your approved captain broadcast template.
* **Sender ID:** `1248861244970433` (Production WABA ID)
* **Recipient:** `+6281234567890` (Your WhatsApp number)
* **Webhook Inbound:** **Disabled** until your Meta Business Verification is complete. Outbound delivery will succeed, but clicking the "claim" button on your phone won't hit ngrok due to Meta WABA unverified restrictions.

### Run Command:
```bash
curl -X POST "https://graph.facebook.com/v20.0/1248861244970433/messages" \
  -H "Authorization: Bearer $META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "6281234567890",
    "type": "template",
    "template": {
      "name": "prioritized_captain_broadcast",
      "language": {
        "code": "id"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "Wayan" },
            { "type": "text", "text": "8 Juni 2026" },
            { "type": "text", "text": "2" },
            { "type": "text", "text": "Perlu Driver (Private Return Transfer — Ubud)" },
            { "type": "text", "text": "LEM-cs_test_12345" }
          ]
        },
        {
          "type": "button",
          "sub_type": "quick_reply",
          "index": "0",
          "parameters": [
            {
              "type": "payload",
              "payload": "claim_LEM-cs_test_12345_Wayan_+6281234567890"
            }
        }
      ]
    }
  }'
```

---

## 3️⃣ Test Request 3: Send Sandbox 'Prioritized Captain Broadcast'
* **Purpose:** Verifies visual formatting, quick-reply claiming buttons, and Indonesian translations on the sandbox channel where inbound webhooks (like claiming) are fully functional.
* **Sender ID:** `1146773325183741` (Sandbox Test ID)
* **Recipient:** `+6281234567890` (Your WhatsApp number)
* **Webhook Inbound:** **Fully Enabled.** Replying or clicking the "Claim Trip" button will successfully trigger your local n8n claiming flow.

### Run Command:
```bash
curl -X POST "https://graph.facebook.com/v20.0/1146773325183741/messages" \
  -H "Authorization: Bearer $META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "6281234567890",
    "type": "template",
    "template": {
      "name": "prioritized_captain_broadcast",
      "language": {
        "code": "id"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "Wayan" },
            { "type": "text", "text": "8 Juni 2026" },
            { "type": "text", "text": "2" },
            { "type": "text", "text": "Perlu Driver (Private Return Transfer — Ubud)" },
            { "type": "text", "text": "LEM-cs_test_12345" }
          ]
        },
        {
          "type": "button",
          "sub_type": "quick_reply",
          "index": "0",
          "parameters": [
            {
              "type": "payload",
              "payload": "claim_LEM-cs_test_12345_Wayan_+6281234567890"
            }
          ]
        }
      ]
    }
  }'
```

---

## 4️⃣ Test Request 4: Simulate Stripe Purchase Webhook
* **Purpose:** Simulates a successful Stripe Checkout session completion event. It POSTs the real Stripe metadata structure directly to your local n8n Stripe webhook, triggering guest dispatches and captain alerts.
* **Target:** `http://localhost:5678/webhook/stripe-webhook`

### Run Command:
```bash
curl -X POST "http://localhost:5678/webhook/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_checkout_mock",
    "object": "event",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_mock_booking_999",
        "object": "checkout.session",
        "amount_total": 12500,
        "currency": "usd",
        "customer_details": {
          "email": "traveler@example.com",
          "name": "John Doe",
          "phone": "+6281234567890"
        },
        "metadata": {
          "tourId": "swim-snorkel",
          "date": "2026-06-08",
          "guests": "2",
          "pickupLocation": "ubud",
          "pickupFee": "35",
          "pickupDescription": "Private Return Transfer — Ubud",
          "whatsappNumber": "+6281234567890",
          "hotelDetails": "Ubud Hanging Gardens, Villa 12"
        },
        "payment_status": "paid",
        "status": "complete"
      }
    }
  }'
```

---

## 5️⃣ Test Request 5: Simulate Captain Agreement Signature
* **Purpose:** Simulates a captain clicking "Agree" and signing the behavioral contract on your website. It POSTs the signed agreement to your local Next.js server, which automatically forwards the event to n8n to trigger the passenger coordinate unlock!
* **Target:** `http://localhost:3000/api/captain-agreement` (Ensure Next.js is running: `npm run dev`)

### Run Command:
```bash
curl -X POST "http://localhost:3000/api/captain-agreement" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cs_test_mock_booking_999",
    "captainName": "Kapten Wayan",
    "captainPhone": "+6281234567890",
    "signedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```
