import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

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
  title: "Lovina Ethical Marine | Private Dolphin Tours",
  description: "Experience the magic of Lovina's wild dolphins without the chase. Private, quiet, and respectful tours led by our professional team of captains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://lovinaethicalmarine.com/#organization",
        "name": "Lovina Ethical Marine",
        "url": "https://lovinaethicalmarine.com",
        "logo": "https://lovinaethicalmarine.com/logo.svg",
        "image": "https://lovinaethicalmarine.com/hero_dolphins.png",
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
        "@id": "https://lovinaethicalmarine.com/#tour",
        "name": "Private Anti-Sunrise Ethical Dolphin Tour",
        "description": "Premium 8:00 AM private outrigger tour to view wild Spinner and Bottlenose dolphins in Lovina, Bali with zero chasing. Includes reef snorkeling, coffee, and refreshments.",
        "image": "https://lovinaethicalmarine.com/hero_dolphins.png",
        "brand": {
          "@type": "Brand",
          "name": "Lovina Ethical Marine"
        },
        "offers": {
          "@type": "Offer",
          "url": "https://lovinaethicalmarine.com/checkout",
          "priceCurrency": "USD",
          "price": "45.00",
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
    >
      <body className="min-h-full flex flex-col bg-cloud-dancer">
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
