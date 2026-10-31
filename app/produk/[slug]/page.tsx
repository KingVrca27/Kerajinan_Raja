import { Metadata } from "next";
import { notFound } from "next/navigation";
import productRepository from "@/src/lib/productRepository";
import ProductDetailView from "@/src/components/product/ProductDetailView";
import { ProductJsonLd } from "@/src/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Gunakan ISR (Incremental Static Regeneration) dengan revalidasi 1 jam.
 * Produk yang ada saat build di-prerender, produk baru setelah build
 * di-render on-demand lalu dicache otomatis oleh Next.js.
 */
export const revalidate = 3600;

/**
 * Prerender secara statis seluruh rute detail produk pada saat build time.
 * Menggunakan productRepository.getProducts() agar slug berasal dari Supabase,
 * bukan lagi dari data statis.
 *
 * Jika slug baru ditambahkan setelah build, Next.js akan render on-demand
 * dan cache hasilnya (didukung oleh dynamicParams = true secara default).
 */
export async function generateStaticParams() {
  const products = await productRepository.getProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

/**
 * Membuat metadata SEO dinamis berdasarkan data produk dari Supabase.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan",
    };
  }

  const imageUrl = product.image.startsWith("http")
    ? product.image
    : product.image;

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `/produk/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Putra Art Shop`,
      description: product.description,
      url: `/produk/${product.slug}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Putra Art Shop`,
      description: product.description,
      images: [imageUrl],
    },
  };
}

/**
 * Halaman Dynamic Route Detail Produk (App Router /produk/[slug]).
 *
 * Seluruh data produk (detail + related) diambil dari Supabase melalui
 * productRepository — tidak ada lagi ketergantungan pada data statis.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch produk utama dari Supabase
  const product = await productRepository.getProductBySlug(slug);

  // Jika slug produk tidak ditemukan di database, tampilkan Halaman 404
  if (!product) {
    notFound();
  }

  // Fetch produk terkait berdasarkan ID produk acuan
  // (same category first, fallback ke kategori lain)
  const relatedProducts = await productRepository.getRelatedProducts(product.id);

  // Fetch ulasan yang sudah disetujui (atau tanpa perlu disetujui jika ingin langsung tampil,
  // di sini menggunakan fungsi getApprovedReviewsByProduct sesuai dengan repo yang dibuat)
  const { reviewRepository } = await import("@/src/lib/reviewRepository");
  const reviews = await reviewRepository.getApprovedReviewsByProduct(product.id);

  return (
    <>
      <ProductJsonLd product={product} />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
      />
    </>
  );
}

