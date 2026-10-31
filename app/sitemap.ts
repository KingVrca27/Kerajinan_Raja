import { MetadataRoute } from "next";
import productRepository from "@/src/lib/productRepository";

/**
 * Generator Sitemap XML Otomatis untuk Next.js 15 App Router.
 * Mengindeks rute utama situs serta seluruh rute detail produk dinamis.
 *
 * Data produk diambil dari Supabase melalui productRepository —
 * tidak ada lagi ketergantungan pada data statis.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fallback ke localhost karena domain production (Putra Art Shop) belum dikonfigurasi secara final.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  // 1. Rute Halaman Statis Utama
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produk`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // 2. Rute Halaman Detail Produk Dinamis dari Supabase
  const products = await productRepository.getProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/produk/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
