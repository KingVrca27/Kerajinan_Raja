import { Metadata } from "next";
import Hero from "@/src/components/home/Hero";
import CategorySection from "@/src/components/category/CategorySection";
import NewProducts from "@/src/components/home/NewProducts";
import BestSellerProducts from "@/src/components/home/BestSellerProducts";
import FeaturedProducts from "@/src/components/home/FeaturedProducts";
import AboutSection from "@/src/components/home/AboutSection";
import { WhyChooseUsSection } from "@/src/components/why-choose-us";
import { TestimonialSection } from "@/src/components/testimonials";
import { FAQSection } from "@/src/components/faq";

export const metadata: Metadata = {
  title: "Kerajinan Raja | Kerajinan Tangan Asli Lombok",
  description:
    "Kerajinan Raja menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah melalui WhatsApp.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kerajinan Raja | Kerajinan Tangan Asli Lombok",
    description:
      "Kerajinan Raja menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan pemesanan mudah melalui WhatsApp.",
    url: "https://kerajinanraja.com",
    images: ["/images/og-image.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <CategorySection />
      <NewProducts />
      <BestSellerProducts />
      <FeaturedProducts />
      <AboutSection />
      <WhyChooseUsSection />
      <TestimonialSection />
      <FAQSection />
    </>
  );
}
