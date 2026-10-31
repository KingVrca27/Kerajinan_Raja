"use client";

import React from "react";
import { motion } from "framer-motion";
import { WhyChooseUsItem } from "@/src/constants/whyChooseUs";

export interface WhyChooseUsCardProps {
  /** Objek data keunggulan individual (ikon, judul, deskripsi) */
  item: WhyChooseUsItem;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `WhyChooseUsCard` merender satu kartu keunggulan produk/layanan
 * dengan ikon yang menarik, judul, deskripsi singkat, serta animasi hover interaktif.
 */
export const WhyChooseUsCard: React.FC<WhyChooseUsCardProps> = ({
  item,
  className = "",
}) => {
  const IconComponent = item.icon;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative flex h-full flex-col rounded-3xl border border-primary/10 bg-white p-6 sm:p-7 shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${className}`}
    >
      {/* Background Accent Highlight Glow pada saat Hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      {/* Container Ikon */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-xs">
        <IconComponent className="h-7 w-7 stroke-[1.75]" />
      </div>

      {/* Judul Keunggulan */}
      <h3 className="font-heading text-lg font-bold text-text-primary group-hover:text-primary transition-colors sm:text-xl">
        {item.title}
      </h3>

      {/* Deskripsi Keunggulan */}
      <p className="mt-2.5 font-body text-sm text-text-secondary leading-relaxed">
        {item.description}
      </p>
    </motion.div>
  );
};

export default WhyChooseUsCard;
