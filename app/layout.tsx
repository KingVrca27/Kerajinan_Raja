import type { Metadata } from "next";
import { Inter, Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import MainLayout from "@/src/components/layout/MainLayout";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/src/components/seo/JsonLd";
import DynamicFavicon from "@/src/components/common/DynamicFavicon";

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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Putra Art Shop | Kerajinan Tangan Asli Lombok",
    template: "%s | Putra Art Shop",
  },
  description:
    "Putra Art Shop menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah dan pengiriman ke seluruh Indonesia.",
  keywords: [
    "Putra Art Shop",
    "Kerajinan Lombok",
    "Kerajinan Tangan Lombok",
    "Ukiran Kayu Lombok",
    "Kerajinan Rotan Lombok",
    "Handmade Lombok",
    "Souvenir Lombok",
    "Dekorasi Kayu",
    "Pengrajin Lokal NTB",
  ],
  authors: [{ name: "Putra Art Shop", url: siteUrl || "/" }],
  creator: "Putra Art Shop",
  publisher: "Putra Art Shop",
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
    url: siteUrl || "/",
    siteName: "Putra Art Shop",
    title: "Putra Art Shop | Kerajinan Tangan Asli Lombok",
    description:
      "Putra Art Shop menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah dan pengiriman ke seluruh Indonesia.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Putra Art Shop - Kerajinan Tangan Asli Lombok",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Putra Art Shop | Kerajinan Tangan Asli Lombok",
    description:
      "Putra Art Shop menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah dan pengiriman ke seluruh Indonesia.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <DynamicFavicon />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
