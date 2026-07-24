import { Metadata } from "next";
import WishlistClientView from "@/src/components/wishlist/WishlistClientView";

/**
 * Metadata SEO Next.js 15 untuk halaman Wishlist / Produk Favorit.
 */
export const metadata: Metadata = {
  title: "Produk Favorit",
  description:
    "Daftar produk kerajinan tangan Lombok favorit yang tersimpan dalam koleksi pribadi Anda di Kerajinan Raja.",
  alternates: {
    canonical: "/wishlist",
  },
  openGraph: {
    title: "Produk Favorit | Kerajinan Raja",
    description:
      "Daftar produk kerajinan tangan Lombok favorit yang tersimpan dalam koleksi pribadi Anda di Kerajinan Raja.",
    url: "https://kerajinanraja.com/wishlist",
    images: ["/images/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Produk Favorit | Kerajinan Raja",
    description:
      "Daftar produk kerajinan tangan Lombok favorit yang tersimpan dalam koleksi pribadi Anda di Kerajinan Raja.",
    images: ["/images/og-image.jpg"],
  },
};

/**
 * Halaman Server Component Wishlist (App Router /wishlist).
 */
export default function WishlistPage() {
  return <WishlistClientView />;
}
