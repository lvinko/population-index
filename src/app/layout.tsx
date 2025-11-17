import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/config/metadata";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.images.og.url,
        width: siteConfig.images.og.width,
        height: siteConfig.images.og.height,
        alt: siteConfig.images.og.alt,
        type: siteConfig.images.og.type,
      },
      {
        url: siteConfig.images.logo.url,
        width: siteConfig.images.logo.width,
        height: siteConfig.images.logo.height,
        alt: siteConfig.images.logo.alt,
        type: siteConfig.images.logo.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.images.og.url,
        alt: siteConfig.images.og.alt,
      },
    ],
    creator: "@populationindex",
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
    // Add verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "Демографія, Статистика, Аналітика",
  classification: "Демографічні дані та статистика населення України",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" data-theme="light" className="bg-base-100">
      <head>
        <link rel="canonical" href={siteConfig.url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: siteConfig.name,
              description: siteConfig.description,
              url: siteConfig.url,
              applicationCategory: "DataVisualizationApplication",
              operatingSystem: "Web",
              image: [
                `${siteConfig.url}${siteConfig.images.og.url}`,
                `${siteConfig.url}${siteConfig.images.logo.url}`,
              ],
              logo: {
                "@type": "ImageObject",
                url: `${siteConfig.url}${siteConfig.images.logo.url}`,
                width: siteConfig.images.logo.width,
                height: siteConfig.images.logo.height,
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "UAH",
              },
              author: {
                "@type": "Organization",
                name: siteConfig.author,
                logo: {
                  "@type": "ImageObject",
                  url: `${siteConfig.url}${siteConfig.images.logo.url}`,
                },
              },
              publisher: {
                "@type": "Organization",
                name: siteConfig.author,
                logo: {
                  "@type": "ImageObject",
                  url: `${siteConfig.url}${siteConfig.images.logo.url}`,
                },
              },
              inLanguage: "uk-UA",
              featureList: [
                "Інтерактивна карта населення України",
                "Прогнозування населення",
                "Візуалізація демографічних даних",
                "Аналіз по регіонах",
                "Статистика міграції",
                "Динаміка народжуваності та смертності",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "Демографічні дані населення України",
              description: "Статистичні дані про населення України по регіонах з 2003 року",
              url: siteConfig.url,
              image: `${siteConfig.url}${siteConfig.images.og.url}`,
              keywords: siteConfig.keywords.join(", "),
              license: "https://creativecommons.org/licenses/by/4.0/",
              creator: {
                "@type": "Organization",
                name: "Державна служба статистики України",
                url: "https://www.ukrstat.gov.ua/",
                logo: {
                  "@type": "ImageObject",
                  url: `${siteConfig.url}/logo-data-bank.png`,
                },
              },
              publisher: {
                "@type": "Organization",
                name: siteConfig.author,
                logo: {
                  "@type": "ImageObject",
                  url: `${siteConfig.url}${siteConfig.images.logo.url}`,
                },
              },
              temporalCoverage: "2003/2024",
              spatialCoverage: {
                "@type": "Country",
                name: "Україна",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-100 text-base-content min-h-screen flex flex-col`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
