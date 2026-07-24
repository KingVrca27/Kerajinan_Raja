"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { FAQ_CONTENT } from "@/src/constants/faq";
import FAQAccordion from "./FAQAccordion";

export interface FAQSectionProps {
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FAQSection` merender seksi utama FAQ (Pertanyaan yang Sering Diajukan).
 * Menyajikan badge kecil, judul utama, deskripsi singkat, dan komponen accordion 8 FAQ.
 */
export const FAQSection: React.FC<FAQSectionProps> = ({
  className = "",
}) => {
  const { badge, title, description, items } = FAQ_CONTENT;

  return (
    <section
      id="faq"
      className={`py-16 sm:py-20 lg:py-24 bg-secondary/30 border-t border-primary/10 ${className}`}
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
              <HelpCircle className="h-3.5 w-3.5" />
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

        {/* Accordion FAQ 1 Kolom */}
        <FAQAccordion items={items} />
      </div>
    </section>
  );
};

export default FAQSection;
