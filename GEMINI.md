# Lovina Ethical Marine: Project Context

## Project Mission
To become the definitive standard for ethical marine encounters in North Bali. Operating under the "Integrated Brand" model, we provide white-labeled, elite maritime services that out-design and out-SEO local competitors.

## Tech Stack
- **Frontend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS.
- **CMS:** Sanity.io (Headless) for Blogs, Encounters, and Reels.
- **Payments:** Stripe Checkout (USD).
- **Domain:** lovinaethicalmarine.com
- **Repo:** https://github.com/nturner5/lovina-dolphin-tours

## Key Differentiators
1. **Timing:** 8:00 AM starts for quiet, private encounters (The "Anti-Sunrise" strategy).
2. **Behavioral Contract:** Engines to neutral within 30m; parallel approach only.
3. **Integrated Brand:** Unified quality and "Four Seasons" level maritime excellence.

## Current Progress (Final Snapshot)
- ✅ **Rebranded**: Full transition to "Lovina Ethical Marine."
- ✅ **Visual Identity**: V2 "Coastal Noir" implemented (Fraunces serif, Deep Indigo palette).
- ✅ **Logo**: Integrated custom single-line silhouette into Navbar/Footer.
- ✅ **CMS**: Sanity Studio functional at `/admin`; 3 SEO posts imported and keys fixed.
- ✅ **Payments**: Stripe Checkout flow built (Test Mode).
- ✅ **Infrastructure**: Next.js 15 project verified with successful production builds.

## Active "To-Do" List

### Strategy & Branding
- [x] **Brand Audit:** Confirm if "V2 Coastal Noir" resonates during initial traveler testing.
- [x] **Emotional Storytelling:** Draft the "Process" copy (The Feeling of the 8 AM Sea).
- [x] **Logo Refinement:** Play with `w-10 h-10` size in `Navbar.tsx` as needed.

### Content & Social Proof
- [ ] **Instagram Outreach:** Contact regular travelers using the script in our history for Reel permissions.
- [ ] **Placeholders**: Replace "Ambient Video" and "Ocean Texture" SVG placeholders with high-res 4K assets.
- [x] **Thorough Blogs:** Expand the 3 imported posts into long-form authority pillars (1,500+ words).

### Product & Operations
- [x] **Logistics**: Write "What to Bring" (Reef booties, polarized glasses, etc.) and the "8 AM Schedule" copy.
- [x] **Pickups**: Implement Add-on pricing for Ubud ($35) and Canggu/Seminyak/Kuta ($50) in Stripe.
- [x] **Chat**: Integrate a direct WhatsApp button (The "operating system" of Bali).
- [ ] **WhatsApp Configuration**: Update the placeholder phone number `6281234567890` in `src/components/WhatsAppButton.tsx` with your official Balinese WhatsApp number.
- [ ] **Language Switcher**: Add support for Russian and Chinese markets.
- [ ] **Dispatch Automation**: Build Make.com scenario (Stripe Webhook -> WhatsApp Dispatch).

## Referenced Files
- `.agents/branding-guide.md`: The visual "Bible" (Colors, Fonts, Logo rules).
- `.agents/product-marketing.md`: Positioning, Personas, and Moat analysis.
- `blog_drafts.md`: The SEO content strategy and raw text for initial posts.
- `scripts/import-blogs.mjs`: Utility for pushing content to Sanity (Requires Write Token).
