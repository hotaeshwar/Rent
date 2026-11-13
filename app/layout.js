import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  metadataBase: new URL("https://Rent.buildingindiadigital.com"),
  title: "BiD Rent Manager - PG, Hostel & Rental Property Management SaaS",
  description:
    "Secure, real-time property, room, tenant, rent collection, digital invoices, and maintenance management for modern landlords and PG owners.",
  applicationName: "BiD Rent Manager",
  authors: [{ name: "Building India Digital" }],
  keywords: [
    "PG Manager",
    "Hostel Management",
    "Rent Collection",
    "Digital Invoices",
    "BiD Rent Manager",
  ],
  icons: {
    icon: "/images/bid-logo.png",
    shortcut: "/images/bid-logo.png",
    apple: "/images/bid-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://Rent.buildingindiadigital.com",
    siteName: "BiD Rent Manager",
    title: "BiD Rent Manager - PG & Rental Property Management SaaS",
    description:
      "Digital rent invoicing, tenant onboarding, automated maintenance tracking, and instant WhatsApp billing receipts.",
    images: [
      {
        url: "/images/bid-logo.png",
        width: 1200,
        height: 630,
        alt: "BiD Rent Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BiD Rent Manager - PG & Rental Property Management SaaS",
    description:
      "Digital rent invoicing, tenant onboarding, automated maintenance tracking, and instant WhatsApp billing receipts.",
    images: ["/images/bid-logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#F8FAF9] text-[#172B25] font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
