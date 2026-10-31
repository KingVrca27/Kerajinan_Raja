/**
 * @file src/lib/globalSearchRepository.ts
 * Repository pattern untuk Realtime Global Search di Header Admin Panel (FITUR 7).
 * Mencakup 9 Modul: Produk, Kategori, Pesanan, Customer, Review, Promo, FAQ, Banner, Media.
 */

import { supabase } from "@/src/lib/supabase";
import type { GlobalSearchResults, GlobalSearchResultItem } from "@/src/types/adminMonitoring";

export const globalSearchRepository = {
  async searchAll(query: string): Promise<GlobalSearchResults> {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return {};

    const results: GlobalSearchResults = {
      Produk: [],
      Kategori: [],
      Pesanan: [],
      Customer: [],
      Review: [],
      Promo: [],
      FAQ: [],
      Banner: [],
      Media: [],
    };

    try {
      const [
        productsRes,
        categoriesRes,
        ordersRes,
        customersRes,
        reviewsRes,
        promosRes,
        faqsRes,
        bannersRes,
      ] = await Promise.all([
        supabase.from("products").select("id, name, slug, price, status").ilike("name", `%${q}%`).limit(5),
        supabase.from("categories").select("id, name, slug").ilike("name", `%${q}%`).limit(5),
        supabase.from("orders").select("id, order_number, total, status").ilike("order_number", `%${q}%`).limit(5),
        supabase.from("customers").select("id, full_name, email").or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
        supabase.from("reviews").select("id, content, rating").ilike("content", `%${q}%`).limit(5),
        supabase.from("promotions").select("id, code, name").or(`code.ilike.%${q}%,name.ilike.%${q}%`).limit(5),
        supabase.from("faq").select("id, question").ilike("question", `%${q}%`).limit(5),
        supabase.from("hero_banners").select("id, title").ilike("title", `%${q}%`).limit(5),
      ]);

      if (productsRes.data) {
        results.Produk = productsRes.data.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `Rp ${Number(p.price).toLocaleString("id-ID")}`,
          module: "Produk",
          url: `/admin/dashboard/produk`,
          badge: p.status,
        }));
      }

      if (categoriesRes.data) {
        results.Kategori = categoriesRes.data.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: `Slug: /kategori/${c.slug}`,
          module: "Kategori",
          url: `/admin/dashboard/kategori`,
        }));
      }

      if (ordersRes.data) {
        results.Pesanan = ordersRes.data.map((o) => ({
          id: o.id,
          title: `#${o.order_number}`,
          subtitle: `Total: Rp ${Number(o.total).toLocaleString("id-ID")}`,
          module: "Pesanan",
          url: `/admin/dashboard/pesanan`,
          badge: o.status,
        }));
      }

      if (customersRes.data) {
        results.Customer = customersRes.data.map((c) => ({
          id: c.id,
          title: c.full_name,
          subtitle: c.email,
          module: "Customer",
          url: `/admin/dashboard/pelanggan`,
        }));
      }

      if (reviewsRes.data) {
        results.Review = reviewsRes.data.map((r) => ({
          id: r.id,
          title: r.content ? (r.content.length > 40 ? r.content.slice(0, 40) + "..." : r.content) : "Ulasan tanpa teks",
          subtitle: `Rating: ${r.rating}.0 Bintang`,
          module: "Review",
          url: `/admin/dashboard/review`,
        }));
      }

      if (promosRes.data) {
        results.Promo = promosRes.data.map((pr) => ({
          id: pr.id,
          title: `Kode: ${pr.code}`,
          subtitle: pr.name,
          module: "Promo",
          url: `/admin/dashboard/promosi`,
        }));
      }

      if (faqsRes.data) {
        results.FAQ = faqsRes.data.map((f) => ({
          id: f.id,
          title: f.question,
          module: "FAQ",
          url: `/admin/dashboard/faq`,
        }));
      }

      if (bannersRes.data) {
        results.Banner = bannersRes.data.map((b) => ({
          id: b.id,
          title: b.title,
          module: "Banner",
          url: `/admin/dashboard/cms/banner`,
        }));
      }
    } catch (e) {
      console.error("[globalSearchRepository.searchAll]", e);
    }

    return results;
  },
};
