"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants, BezierDefinition } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Leaf,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CONTENT } from "@/src/constants/content";
import { DbHeroBanner } from "@/src/lib/cmsRepository";

export interface HeroProps {
  banners?: DbHeroBanner[];
}

// ─── Feature Strip Data ───────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Kualitas Terjamin",
    desc: "Setiap produk melewati seleksi ketat dari pengrajin berpengalaman.",
  },
  {
    icon: Sparkles,
    title: "100% Handmade",
    desc: "Dibuat tangan satu per satu, bukan produksi massal.",
  },
  {
    icon: Leaf,
    title: "Ramah Lingkungan",
    desc: "Material alami lokal yang berkelanjutan dan eco-friendly.",
  },
  {
    icon: Crown,
    title: "Warisan Budaya",
    desc: "Desain khas yang melestarikan nilai seni tradisional Lombok.",
  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────
const EASE_OUT: BezierDefinition = [0.22, 1, 0.36, 1];

// Staggered fade-up for left column children
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

export const Hero: React.FC<HeroProps> = ({ banners }) => {
  const { hero } = CONTENT;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Normalize banners array, fallback to default content if empty
  const activeBanners = useMemo(() => {
    if (!banners || banners.length === 0) {
      return [
        {
          id: "fallback",
          title: hero.title,
          subtitle: hero.description,
          image_url: hero.image.src,
          link_url: hero.buttons.primary.href,
          link_text: "Jelajahi Produk",
          type: "hero",
          preTitle: hero.badge || "HANDMADE WITH PASSION",
        },
      ];
    }

    return banners.map((b) => ({
      id: b.id,
      title: b.title || hero.title,
      subtitle: b.subtitle || hero.description,
      image_url: b.image_url || hero.image.src,
      link_url: b.link_url || hero.buttons.primary.href,
      link_text: b.link_text || "Jelajahi Produk",
      type: b.type,
      preTitle:
        b.type === "promo"
          ? b.promo_code
            ? `PROMO CODE: ${b.promo_code}`
            : "SPECIAL PROMO"
          : hero.badge || "HANDMADE WITH PASSION",
    }));
  }, [banners, hero]);

  const totalBanners = activeBanners.length;
  const currentBanner = activeBanners[currentIndex];

  useEffect(() => {
    if (totalBanners > 1 && !isHovered) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalBanners);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [totalBanners, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalBanners - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION FULL SCREEN BACKGROUND
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-secondary/10 group/carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Homepage Banners"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={currentBanner.image_url}
                alt={currentBanner.title}
                fill
                priority={currentIndex === 0}
                unoptimized
                className="object-cover object-center"
              />
              {/* Overlay gradient agar teks di sebelah kiri tetap terbaca jelas */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent md:w-[75%] lg:w-[65%]"></div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8 lg:py-32 pointer-events-none">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-2xl text-left pointer-events-auto"
              >
                {/* Pre-Title / Subtitle */}
                {currentBanner.preTitle && (
                  <motion.div
                    variants={itemVariants}
                    className="mb-4 font-body text-xs font-bold uppercase tracking-[0.2em] text-[#9D734E] md:text-sm"
                  >
                    {currentBanner.preTitle}
                  </motion.div>
                )}

                {/* Main Headline */}
                <motion.h1
                  variants={itemVariants}
                  className="mb-6 font-playfair text-4xl font-bold leading-[1.1] tracking-tight text-[#3E2723] sm:text-5xl lg:text-[4.5rem]"
                >
                  {currentBanner.title}
                </motion.h1>

                {/* Garis Emas Dekoratif */}
                <motion.div
                  variants={itemVariants}
                  className="mb-6 flex items-center justify-start"
                  aria-hidden="true"
                >
                  <div className="h-1 w-1.5 rounded-full bg-[#9D734E]"></div>
                  <div className="h-px w-24 bg-[#9D734E]/60"></div>
                  <div className="h-1 w-1.5 rounded-full bg-[#9D734E]"></div>
                </motion.div>

                {/* Description */}
                <motion.p
                  variants={itemVariants}
                  className="mb-10 max-w-lg font-body text-base leading-relaxed text-gray-800 md:text-lg"
                >
                  {currentBanner.subtitle}
                </motion.p>

                {/* CTA Button */}
                <motion.div variants={itemVariants}>
                  <a
                    href={currentBanner.link_url}
                    className="group inline-flex items-center gap-3 rounded-xl bg-[#2d4231] px-8 py-4 font-body text-sm font-bold text-white shadow-xl shadow-[#2d4231]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1a291d] hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d4231] focus-visible:ring-offset-2"
                  >
                    <span>{currentBanner.link_text}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </a>
                </motion.div>


              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation & Indicators */}
        {totalBanners > 1 && (
          <>
            {/* Prev/Next Buttons */}
            <div className="absolute inset-y-0 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <button
                onClick={handlePrev}
                aria-label="Banner sebelumnya"
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/50 text-[#2d4231] opacity-0 backdrop-blur-sm transition-all hover:bg-white focus:opacity-100 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Banner berikutnya"
                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/50 text-[#2d4231] opacity-0 backdrop-blur-sm transition-all hover:bg-white focus:opacity-100 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
              <div className="pointer-events-auto flex gap-2">
                {activeBanners.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Ke banner ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-8 bg-[#2d4231]"
                        : "w-2 bg-gray-400 hover:bg-[#2d4231]/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default Hero;
