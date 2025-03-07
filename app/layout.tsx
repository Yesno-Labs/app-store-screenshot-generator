import type { Metadata } from "next";
import { Inter, DM_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Enhanced metadata for SEO
export const metadata: Metadata = {
  metadataBase: new URL("https://storesnaps.com"),
  title:
    "App Store Screenshot Generator | No account required. It’s fast & free.",
  description:
    "Create beautiful app store screenshots for iOS and Android in minutes. No design skills needed. Optimize your App Store and Google Play store listings.",
  keywords:
    "app screenshots, app store screenshots, play store screenshots, screenshot generator",
  openGraph: {
    title:
      "App Store Screenshot Generator | No account required. It’s fast & free.",
    description:
      "Create beautiful app store screenshots for iOS and Android in minutes. No design skills needed. Optimize your App Store and Google Play store listings.",
    url: "https://storesnaps.com",
    siteName: "App Store Screenshot Generator",
    images: [
      {
        url: "/og-image.png", // You'll need to create this image and add it to public folder
        width: 1200,
        height: 630,
        alt: "App Store Screenshot Generator Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "App Screenshot Generator | Create Beautiful Store Listing Screenshots",
    description:
      "Create stunning app store screenshots for iOS and Android in minutes. No design skills needed.",
    images: ["/twitter-image.png"], // You'll need to create this image and add it to public folder
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://storesnaps.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        {/* Schema markup for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "App Store Screenshot Generator",
              description:
                "Create stunning app store screenshots for iOS and Android in minutes.",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Yesno Labs",
                url: "https://www.yesnolabs.io",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${dmSans.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
