# Bali Dolphin Tours: Project Context

## Project Mission
To become the definitive standard for ethical marine encounters in North Bali. Operating under the "Integrated Brand" model, we provide white-labeled, elite maritime services that out-design and out-SEO local competitors.

## Tech Stack
- **Frontend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS.
- **CMS:** Sanity.io (Headless) for Blogs, Encounters, and Reels.
- **Payments:** Stripe Checkout (USD).
- **Domain:** balidolphintours.com
- **Repo:** https://github.com/nturner5/lovina-dolphin-tours

## Development Guidelines
- **n8n Modifications:** Always use the n8n Public API (`https://n8n.balidolphintours.com/api/v1/workflows/...` using the `N8N_API_KEY` header `X-N8N-API-KEY`) to update, backup, or publish workflows. Avoid direct database SQL updates to prevent caching/webhook registration mismatch issues.

## Key Differentiators
1. **Timing:** 8:00 AM starts for quiet, private encounters (The "Anti-Sunrise" strategy).
2. **Behavioral Contract:** Engines to neutral within 30m; parallel approach only.
3. **Integrated Brand:** Unified quality and "Four Seasons" level maritime excellence.

## Current Progress (Final Snapshot)
- ✅ **Rebranded**: Full transition to "Bali Dolphin Tours."
- ✅ **Visual Identity**: V2 "Coastal Noir" implemented (Fraunces serif, Deep Indigo palette).
- ✅ **Logo**: Integrated custom single-line silhouette into Navbar/Footer.
- ✅ **CMS**: Sanity Studio functional at `/admin`; 3 SEO posts imported and keys fixed.
- ✅ **Payments**: Stripe Checkout flow built (Test Mode).
- ✅ **Infrastructure**: Next.js 15 project verified with successful production builds.
- ✅ **Expanded Tour Selection**: Added the middle Watch & Swim ($55) tier for a 3-tour grid (Watching $45, Swim $55, Swim & Snorkel $65).
- ✅ **Ethical Trust Seals**: Implemented a localized "Ethical Charter & Safety Seal" trust bar (`TrustCharter.tsx`) below package selectors to replace OTA listings.
- ✅ **SEO Products**: Registered three individual JSON-LD Product Schemas in layout for Google Rich Snippets.

## Active "To-Do" List

### Strategy & Branding
- [x] **Brand Audit:** Confirm if "V2 Coastal Noir" resonates during initial traveler testing.
- [x] **Emotional Storytelling:** Draft the "Process" copy (The Feeling of the 8 AM Sea).
- [x] **Logo Refinement:** Play with `w-10 h-10` size in `Navbar.tsx` as needed.
- [x] **CRO & Funnel:** Embed the Package Selector and Testimonials directly on the Homepage (shortening the funnel by skipping the separate `/tours` page).
- [ ] **OTA Profile Setup:** Register Google Business & TripAdvisor listings to collect official review badges.

### Content & Social Proof
- [x] **Instagram Outreach:** Contact regular travelers using the script in our history for Reel permissions.
- [x] **Thorough Blogs:** Expand the 3 imported posts into long-form authority pillars (1,500+ words).
- [x] **Social Proof:** Insert verified customer review/testimonial cards onto the Homepage.
- [ ] **Realistic Media Audit:** Replace the temporary image placeholders with custom authentic user-generated images.

### Product & Operations
- [x] **Logistics**: Write "What to Bring" (Reef booties, polarized glasses, etc.) and the "8 AM Schedule" copy.
- [x] **Pickups**: Implement Add-on pricing for Ubud ($42) and Canggu/Seminyak/Kuta ($60) in Stripe.
- [x] **Chat**: Integrate a direct WhatsApp button (The "operating system" of Bali).
- [x] **WhatsApp Configuration**: Update the placeholder phone number `6281234567890` in `src/components/WhatsAppButton.tsx` with your official Balinese WhatsApp number.
- [x] **Dispatch Automation**: Build Make.com scenario (Stripe Webhook -> WhatsApp Dispatch).
- [x] **Mobile UX**: Add Mobile-Sticky Bottom Checkout Bar with dynamic summary calculation.
- [ ] **GoPro Rental**: Add GoPro Hero 11 Rental ($25 USD) checkbox and pricing mapping (queued until physically present/captains vetted).
- [x] **Stripe Live Mapping:** Map active Stripe Product & Price IDs to metadata in production Stripe settings. (Verified active products synced successfully)
- [ ] **Captain Onboarding & Audits:** Draft a simple mobile captain handbook/charter agreement to ensure off-site captain compliance with the 100% ethical parallel approach rules.

## Referenced Files
- `.agents/branding-guide.md`: The visual "Bible" (Colors, Fonts, Logo rules).
- `.agents/product-marketing.md`: Positioning, Personas, and Moat analysis.
- `blog_drafts.md`: The SEO content strategy and raw text for initial posts.
- `scripts/import-blogs.mjs`: Utility for pushing content to Sanity (Requires Write Token).
