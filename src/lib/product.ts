import { Product } from "@/src/types/product";
import PRODUCTS from "@/src/constants/products";
import CATEGORIES from "@/src/constants/categories";

export interface FilterOptions {
  category?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchKeyword?: string;
  sortBy?: "price-asc" | "price-desc" | "rating" | "latest" | "name-asc" | "name-desc";
}

/**
 * Mengambil seluruh data daftar produk Putra Art Shop.
 * Mengutamakan data produk dari localStorage (admin storage) jika berjalan di browser.
 * 
 * @returns Array berisi seluruh produk.
 */
export const getAllProducts = (): Product[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("kerajinan-raja-admin-products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Gagal membaca produk dari storage:", e);
    }
  }
  return PRODUCTS;
};

/**
 * Mencari dan mengambil satu produk spesifik berdasarkan ID produk.
 * 
 * @param id - String ID produk yang dicari (contoh: "prod-1").
 * @returns Objek Product jika ditemukan, atau undefined jika tidak ada.
 */
export const getProductById = (id: string): Product | undefined => {
  if (!id) return undefined;
  const products = getAllProducts();
  return products.find((product) => product.id === id);
};

/**
 * Mencari dan mengambil satu produk spesifik berdasarkan Slug URL.
 * 
 * @param slug - String slug produk (contoh: "vas-kayu-jati-ukir-vintage").
 * @returns Objek Product jika ditemukan, atau undefined jika tidak ada.
 */
export const getProductBySlug = (slug: string): Product | undefined => {
  if (!slug) return undefined;
  const products = getAllProducts();
  return products.find((product) => product.slug === slug);
};

/**
 * Mengambil seluruh produk berdasarkan nama kategori tertentu.
 * 
 * @param category - Slug atau nama kategori produk (contoh: "kayu", "rotan", "bambu", "souvenir").
 * @returns Array produk yang tergolong dalam kategori tersebut.
 */
export const getProductsByCategory = (category: string): Product[] => {
  const products = getAllProducts();
  if (!category || category === "semua" || category === "all") {
    return products;
  }
  const cleanCat = category.toLowerCase().trim();
  return products.filter(
    (product) =>
      product.category.toLowerCase() === cleanCat ||
      product.category.toLowerCase().replace(/\s+/g, "-") === cleanCat
  );
};

/**
 * Mengambil daftar produk yang ditandai sebagai Produk Unggulan (`isFeatured === true`).
 * 
 * @returns Array produk unggulan.
 */
export const getFeaturedProducts = (): Product[] => {
  return getAllProducts().filter((product) => product.isFeatured);
};

/**
 * Mengambil daftar produk yang ditandai sebagai Produk Terlaris (`isBestSeller === true`).
 * 
 * @returns Array produk terlaris.
 */
export const getBestSellerProducts = (): Product[] => {
  return getAllProducts().filter((product) => product.isBestSeller);
};

/**
 * Mengambil daftar produk yang ditandai sebagai Produk Terbaru (`isNew === true`).
 * 
 * @returns Array produk terbaru.
 */
export const getNewProducts = (): Product[] => {
  return getAllProducts().filter((product) => product.isNew);
};

/**
 * Mengambil rekomendasi produk terkait berdasarkan kategori produk referensi (membuang produk referensi sendiri).
 * 
 * @param productId - ID produk acuan yang sedang dilihat.
 * @param limit - Jumlah maksimal produk terkait yang dikembalikan (default: 4).
 * @returns Array produk terkait.
 */
export const getRelatedProducts = (
  productId: string,
  limit: number = 4
): Product[] => {
  const products = getAllProducts();
  const currentProduct = getProductById(productId);
  if (!currentProduct) return products.slice(0, limit);

  const related = products.filter(
    (product) =>
      product.category.toLowerCase() === currentProduct.category.toLowerCase() &&
      product.id !== productId
  );

  // Jika produk dengan kategori sama kurang dari limit, penuhi dengan produk lain
  if (related.length < limit) {
    const fallback = products.filter(
      (product) => product.id !== productId && !related.includes(product)
    );
    return [...related, ...fallback].slice(0, limit);
  }

  return related.slice(0, limit);
};

/**
 * Mencari produk berdasarkan kata kunci teks pada Nama, Kategori, atau Deskripsi produk.
 * 
 * @param keyword - Kata kunci pencarian yang dimasukkan pengguna.
 * @returns Array produk yang cocok dengan kata kunci.
 */
export const searchProducts = (keyword: string): Product[] => {
  const products = getAllProducts();
  if (!keyword || keyword.trim() === "") {
    return products;
  }
  const cleanKeyword = keyword.toLowerCase().trim();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(cleanKeyword) ||
      product.category.toLowerCase().includes(cleanKeyword) ||
      product.description.toLowerCase().includes(cleanKeyword)
  );
};

/**
 * Menyaring dan mengurutkan daftar produk sesuai dengan opsi filter yang kompleks.
 * 
 * @param options - Objek opsi filter (kategori, harga minimum/maksimum, status, keyword, sorting).
 * @returns Array produk terfilter dan terurut.
 */
export const filterProducts = (options: FilterOptions): Product[] => {
  let result = getAllProducts();

  // Filter Kategori
  if (options.category && options.category !== "semua" && options.category !== "all") {
    const cleanCat = options.category.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.category.toLowerCase() === cleanCat ||
        p.category.toLowerCase().replace(/\s+/g, "-") === cleanCat
    );
  }

  // Filter Flag Badges
  if (options.isFeatured !== undefined) {
    result = result.filter((p) => p.isFeatured === options.isFeatured);
  }

  if (options.isBestSeller !== undefined) {
    result = result.filter((p) => p.isBestSeller === options.isBestSeller);
  }

  if (options.isNew !== undefined) {
    result = result.filter((p) => p.isNew === options.isNew);
  }

  // Filter Rentang Harga
  if (options.minPrice !== undefined) {
    result = result.filter((p) => p.price >= options.minPrice!);
  }

  if (options.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= options.maxPrice!);
  }

  // Filter Pencarian Teks
  if (options.searchKeyword && options.searchKeyword.trim() !== "") {
    const kw = options.searchKeyword.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)
    );
  }

  // Pengurutan (Sorting)
  if (options.sortBy) {
    switch (options.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "latest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
  }

  return result;
};

/**
 * Menghitung jumlah produk berdasarkan ID, Slug, atau Nama Kategori.
 * 
 * @param categoryIdentifier - ID, slug, atau nama kategori (contoh: "cat-1", "rotan", "Kayu", "souvenir").
 * @returns Jumlah integer produk yang tergolong dalam kategori tersebut.
 */
export const getProductCountByCategory = (categoryIdentifier: string): number => {
  if (!categoryIdentifier) return 0;
  const target = categoryIdentifier.toLowerCase().trim();
  const allProds = getAllProducts();

  // Cari kategori di daftar CATEGORIES jika identifier berupa ID atau slug
  const matchedCat = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === target ||
      c.slug.toLowerCase() === target ||
      c.name.toLowerCase() === target
  );

  const searchSlug = matchedCat ? matchedCat.slug.toLowerCase() : target;
  const searchName = matchedCat ? matchedCat.name.toLowerCase() : target;

  return allProds.filter(
    (product) =>
      product.category.toLowerCase() === searchSlug ||
      product.category.toLowerCase() === searchName ||
      product.category.toLowerCase().replace(/\s+/g, "-") === searchSlug ||
      product.category.toLowerCase().replace(/\s+/g, "-") === searchName
  ).length;
};

/**
 * Mengurutkan daftar produk berdasarkan kriteria pilihan pengguna.
 * 
 * @param products - Array berisi produk yang akan diurutkan.
 * @param sortBy - Opsi kriteria pengurutan ("latest", "price-asc", "price-desc", "name-asc", "name-desc", "rating").
 * @returns Array produk baru yang telah terurut tanpa mengubah array asli.
 */
export const sortProducts = (
  products: Product[],
  sortBy?: FilterOptions["sortBy"]
): Product[] => {
  if (!products || products.length === 0) return [];
  if (!sortBy) return products;

  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "latest":
      return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
};
