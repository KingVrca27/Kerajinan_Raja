import React from "react";
import { Product } from "@/src/types/product";
import SITE_CONFIG from "@/src/constants/site";

export interface OrganizationJsonLdProps {}

/**
 * Komponen `OrganizationJsonLd` merender skema JSON-LD Structured Data
 * untuk profil bisnis dan identitas organisasi Kerajinan Raja.
 */
export const OrganizationJsonLd: React.FC<OrganizationJsonLdProps> = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: "https://kerajinanraja.com",
    logo: "https://kerajinanraja.com/images/logo.png",
    description: SITE_CONFIG.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lombok Timur",
      addressRegion: "Nusa Tenggara Barat",
      addressCountry: "ID",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${SITE_CONFIG.whatsappClean}`,
      contactType: "customer service",
      availableLanguage: ["Indonesian"],
    },
    sameAs: Object.values(SITE_CONFIG.socials),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
  );
};

export interface WebSiteJsonLdProps {}

/**
 * Komponen `WebSiteJsonLd` merender skema JSON-LD Structured Data
 * untuk mesin pencarian (SearchAction / Sitelinks Search Box).
 */
export const WebSiteJsonLd: React.FC<WebSiteJsonLdProps> = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: "https://kerajinanraja.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://kerajinanraja.com/produk?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteSchema),
      }}
    />
  );
};

export interface ProductJsonLdProps {
  /** Objek data produk untuk skema e-commerce */
  product: Product;
}

/**
 * Komponen `ProductJsonLd` merender skema JSON-LD Structured Data
 * untuk halaman detail produk e-commerce Kerajinan Raja.
 */
export const ProductJsonLd: React.FC<ProductJsonLdProps> = ({ product }) => {
  const imageUrl = product.image.startsWith("http")
    ? product.image
    : `https://kerajinanraja.com${product.image.startsWith("/") ? "" : "/"}${product.image}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [imageUrl],
    description: product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: SITE_CONFIG.name,
    },
    offers: {
      "@type": "Offer",
      url: `https://kerajinanraja.com/produk/${product.slug}`,
      priceCurrency: "IDR",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(productSchema),
      }}
    />
  );
};
