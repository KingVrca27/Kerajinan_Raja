import { Metadata } from "next";
import ProductCatalogView from "@/src/components/product/ProductCatalogView";

/**
 * Metadata SEO Next.js 15 untuk halaman Semua Produk.
 */
export const metadata: Metadata = {
  title: "Semua Produk",
  description:
    "Temukan berbagai kerajinan tangan berkualitas dari Kerajinan Raja. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
  alternates: {
    canonical: "/produk",
  },
  openGraph: {
    title: "Semua Produk | Kerajinan Raja",
    description:
      "Temukan berbagai kerajinan tangan berkualitas dari Kerajinan Raja. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
    url: "https://kerajinanraja.com/produk",
    images: ["/images/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semua Produk | Kerajinan Raja",
    description:
      "Temukan berbagai kerajinan tangan berkualitas dari Kerajinan Raja. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
    images: ["/images/og-image.jpg"],
  },
};

/**
 * Halaman Server Component Katalog Semua Produk (App Router /produk).
 */
export default function ProdukPage() {
  return <ProductCatalogView />;
}
