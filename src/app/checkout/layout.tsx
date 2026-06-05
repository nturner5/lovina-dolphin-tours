import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Secure Booking | Bali Dolphin Tours",
  description: "Secure your private outrigger boat for a quiet, ethical dolphin tour in Lovina, Bali.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
