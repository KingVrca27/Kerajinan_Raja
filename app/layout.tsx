import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import MainLayout from "@/src/components/layout/MainLayout";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/src/components/seo/JsonLd";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kerajinanraja.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kerajinan Raja | Kerajinan Tangan Asli Lombok",
    template: "%s | Kerajinan Raja",
  },
  description:
    "Kerajinan Raja menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah melalui WhatsApp.",
  keywords: [
    "Kerajinan Raja",
    "Kerajinan Lombok",
    "Kerajinan Tangan Lombok",
    "Ukiran Kayu Lombok",
    "Kerajinan Rotan Lombok",
    "Handmade Lombok",
    "Souvenir Lombok",
    "Dekorasi Kayu",
    "Pengrajin Lokal NTB",
  ],
  authors: [{ name: "Kerajinan Raja", url: siteUrl }],
  creator: "Kerajinan Raja",
  publisher: "Kerajinan Raja",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Kerajinan Raja",
    title: "Kerajinan Raja | Kerajinan Tangan Asli Lombok",
    description:
      "Kerajinan Raja menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah melalui WhatsApp.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kerajinan Raja - Kerajinan Tangan Asli Lombok",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kerajinan Raja | Kerajinan Tangan Asli Lombok",
    description:
      "Kerajinan Raja menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah melalui WhatsApp.",
    images: ["/images/og-image.jpg"],
    creator: "@kerajinanraja",
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <body className="antialiased">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
