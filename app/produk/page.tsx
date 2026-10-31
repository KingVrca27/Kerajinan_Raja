import { Suspense } from "react";
import { Metadata } from "next";
import ProductCatalogView from "@/src/components/product/ProductCatalogView";

/**
 * Metadata SEO Next.js 15 untuk halaman Semua Produk.
 */
export const metadata: Metadata = {
  title: "Semua Produk",
  description:
    "Temukan berbagai kerajinan tangan berkualitas dari Putra Art Shop. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
  alternates: {
    canonical: "/produk",
  },
  openGraph: {
    title: "Semua Produk | Putra Art Shop",
    description:
      "Temukan berbagai kerajinan tangan berkualitas dari Putra Art Shop. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
    url: "/produk",
    images: ["/images/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Semua Produk | Putra Art Shop",
    description:
      "Temukan berbagai kerajinan tangan berkualitas dari Putra Art Shop. Jelajahi produk rotan, kayu, bambu, souvenir, dan dekorasi rumah estetik asli buatan pengrajin Lombok.",
    images: ["/images/og-image.jpg"],
  },
};

/**
 * Halaman Server Component Katalog Semua Produk (App Router /produk).
 */
export default function ProdukPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center font-body text-sm text-text-secondary">
        Memuat katalog produk...
      </div>
    }>
      <ProductCatalogView />
    </Suspense>
  );
}

