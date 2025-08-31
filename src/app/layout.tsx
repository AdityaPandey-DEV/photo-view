import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ceesin.vercel.app'),
  title: {
    default: "Ceesin - VIP Photography Investment Platform | Professional Photo Services",
    template: "%s | Ceesin - Photography Investment Platform"
  },
  description: "Ceesin is the leading VIP Photography Investment Platform. Join thousands of successful photographers earning monthly returns. Professional photo editing, portfolio building, and investment opportunities with 99.8% success rate.",
  keywords: [
    "ceesin",
    "photography investment",
    "VIP photography platform",
    "photo editing services",
    "photography portfolio",
    "photo retouching",
    "3D photography",
    "photography business",
    "photo investment platform",
    "professional photography",
    "photography earnings",
    "photo editing platform"
  ],
  authors: [{ name: "Ceesin Team" }],
  creator: "Ceesin",
  publisher: "Ceesin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ceesin.vercel.app",
    siteName: "Ceesin",
    title: "Ceesin - VIP Photography Investment Platform",
    description: "Join thousands of successful photographers earning monthly returns on Ceesin. Professional photo services with 99.8% success rate.",
    images: [
      {
        url: "https://ceesin.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ceesin - VIP Photography Investment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ceesin - VIP Photography Investment Platform",
    description: "Join thousands of successful photographers earning monthly returns on Ceesin. Professional photo services with 99.8% success rate.",
    images: ["https://ceesin.vercel.app/twitter-image.jpg"],
    creator: "@ceesin",
    site: "@ceesin",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://ceesin.vercel.app",
  },
  category: "photography",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://ceesin.vercel.app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="msapplication-TileColor" content="#1e3a8a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//checkout.razorpay.com" />
      </head>
      <body className="antialiased">
        {children}
        
        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ceesin",
              "url": "https://ceesin.vercel.app",
              "logo": "https://ceesin.vercel.app/logo.png",
              "description": "VIP Photography Investment Platform offering professional photo services and investment opportunities",
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/ceesin",
                "https://facebook.com/ceesin",
                "https://instagram.com/ceesin",
                "https://linkedin.com/company/ceesin"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@ceesin.com"
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              },
              "serviceArea": {
                "@type": "Country",
                "name": "India"
              }
            })
          }}
        />
        
        {/* Razorpay Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        
        {/* Google Analytics (replace with your GA4 ID) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  );
}
