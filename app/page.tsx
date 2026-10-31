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
import { heroBannerRepository, aboutRepository } from "@/src/lib/cmsRepository";

export const metadata: Metadata = {
  title: "Putra Art Shop | Kerajinan Tangan Asli Lombok",
  description:
    "Putra Art Shop menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan layanan pelanggan terbaik.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Putra Art Shop | Kerajinan Tangan Asli Lombok",
    description:
      "Putra Art Shop menyediakan berbagai kerajinan tangan khas Lombok, Nusa Tenggara Barat. Produk handmade berkualitas dari pengrajin lokal dengan layanan pelanggan terbaik.",
    url: "/",
    images: ["/images/og-image.jpg"],
  },
};



export default async function Home() {
  const activeBanners = await heroBannerRepository.getActiveHomepageBanners();

  const aboutHeroSection = await aboutRepository.getBySection("hero");

  return (
    <>
      <Hero banners={activeBanners} />
      <CategorySection />
      <NewProducts />
      <BestSellerProducts />
      <FeaturedProducts />
      <AboutSection aboutData={aboutHeroSection} />
      <WhyChooseUsSection />
      <TestimonialSection />
      <FAQSection />
    </>
  );
}

