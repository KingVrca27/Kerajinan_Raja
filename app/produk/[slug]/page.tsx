import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/src/lib/product";
import ProductDetailView from "@/src/components/product/ProductDetailView";
import { ProductJsonLd } from "@/src/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Prerender secara statis seluruh rute detail produk pada saat build time.
 */
export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

/**
 * Membuat metadata SEO dinamis berdasarkan data produk spesifik.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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
      title: `${product.name} | Kerajinan Raja`,
      description: product.description,
      url: `https://kerajinanraja.com/produk/${product.slug}`,
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
      title: `${product.name} | Kerajinan Raja`,
      description: product.description,
      images: [imageUrl],
    },
  };
}

/**
 * Halaman Dynamic Route Detail Produk (App Router /produk/[slug]).
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  // Jika slug produk tidak ditemukan di data, tampilkan Halaman 404 Not Found
  if (!product) {
    notFound();
  }

  // Ambil daftar produk terkait berdasarkan ID produk acuan
  const relatedProducts = getRelatedProducts(product.id);

  return (
    <>
      <ProductJsonLd product={product} />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
