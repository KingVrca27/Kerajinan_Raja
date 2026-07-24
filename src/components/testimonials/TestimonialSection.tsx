"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";
import { TESTIMONIAL_CONTENT } from "@/src/constants/testimonials";
import TestimonialGrid from "./TestimonialGrid";

export interface TestimonialSectionProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `TestimonialSection` merender seksi utama Testimoni Pelanggan.
 * Menyajikan badge kecil, judul utama, deskripsi singkat, dan grid kartu ulasan pelanggan.
 */
export const TestimonialSection: React.FC<TestimonialSectionProps> = ({
  className = "",
}) => {
  const { badge, title, description, items } = TESTIMONIAL_CONTENT;

  return (
    <section
      id="testimoni"
      className={`py-16 sm:py-20 lg:py-24 bg-background ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header (Badge, Judul Utama, Deskripsi) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4"
        >
          {/* Badge Kecil */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 font-body text-xs font-bold text-primary border border-primary/20 shadow-2xs">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              <span>{badge}</span>
            </span>
          </div>

          {/* Judul Utama */}
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-tight">
            {title}
          </h2>

          {/* Deskripsi Singkat */}
          <p className="font-body text-base sm:text-lg text-text-secondary leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Grid Testimoni Pelanggan */}
        <TestimonialGrid items={items} />
      </div>
    </section>
  );
};

export default TestimonialSection;
