import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://balidolphintours.com"),
  title: "Bali Dolphin Tours | Private Dolphin Tours",
  description: "Experience the magic of Lovina's wild dolphins in a quiet, respectful setting. Private, peaceful tours led by our professional team of captains.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtagId = process.env.NEXT_PUBLIC_GTAG_ID;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://balidolphintours.com/#organization",
        "name": "Bali Dolphin Tours",
        "url": "https://balidolphintours.com",
        "logo": "https://balidolphintours.com/logo.svg",
        "image": "https://balidolphintours.com/hero_dolphins.png",
        "telephone": "+6285190422839",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Lovina Beach",
          "addressLocality": "Singaraja",
          "addressRegion": "Bali",
          "postalCode": "81152",
          "addressCountry": "ID"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "-8.158333",
          "longitude": "115.025"
        }
      },
      {
        "@type": "Product",
        "@id": "https://balidolphintours.com/#tour-watching",
        "name": "7:00 AM Private Dolphin Watching Tour",
        "description": "Premium 7:00 AM private outrigger tour to view wild Spinner and Bottlenose dolphins in Lovina, Bali with zero chasing. Includes local coffee, tea, and fresh fruits.",
        "image": "https://balidolphintours.com/hero_dolphins.png",
        "brand": {
          "@type": "Brand",
          "name": "Bali Dolphin Tours"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://balidolphintours.com/checkout?tour=seven-am-ethical",
          "priceCurrency": "USD",
          "price": "45.00",
          "valueAddedTaxIncluded": "true",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://balidolphintours.com/#tour-swim",
        "name": "7:00 AM Private Dolphin Watching & Swimming Tour",
        "description": "Swim alongside wild dolphin families in Lovina, Bali using safe boat outrigger holding bars on a 7:00 AM private tour. Vetted captain, life jackets, and refreshments included.",
        "image": "https://balidolphintours.com/hero_dolphins.png",
        "brand": {
          "@type": "Brand",
          "name": "Bali Dolphin Tours"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://balidolphintours.com/checkout?tour=dolphin-swim",
          "priceCurrency": "USD",
          "price": "55.00",
          "valueAddedTaxIncluded": "true",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "Product",
        "@id": "https://balidolphintours.com/#tour-swim-snorkel",
        "name": "7:00 AM Private Dolphin Watching Tour + Swim & Snorkel",
        "description": "Our signature double encounter in Lovina, Bali. View and swim with wild dolphins, then snorkel Lovina's vibrant coral reefs. Includes premium gear, local guide, and refreshments.",
        "image": "https://balidolphintours.com/snorkeling_lovina.png",
        "brand": {
          "@type": "Brand",
          "name": "Bali Dolphin Tours"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://balidolphintours.com/checkout?tour=swim-snorkel",
          "priceCurrency": "USD",
          "price": "65.00",
          "valueAddedTaxIncluded": "true",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-cloud-dancer" suppressHydrationWarning>
        {gtagId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gtagId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
