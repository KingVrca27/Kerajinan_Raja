"use client";

import React from "react";
import { motion } from "framer-motion";
import { WhyChooseUsItem } from "@/src/constants/whyChooseUs";
import WhyChooseUsCard from "./WhyChooseUsCard";

export interface WhyChooseUsGridProps {
  /** Array daftar item keunggulan yang akan dirender */
  items: WhyChooseUsItem[];
  /** Kelas CSS tambahan */
  className?: string;
}

// Framer Motion Variants untuk animasi Stagger & Fade-In
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Komponen `WhyChooseUsGrid` merender grid kartu keunggulan secara responsif:
 * - Mobile: 1 Kolom (`grid-cols-1`)
 * - Tablet: 2 Kolom (`md:grid-cols-2`)
 * - Desktop: 3 Kolom (`lg:grid-cols-3`)
 */
export const WhyChooseUsGrid: React.FC<WhyChooseUsGridProps> = ({
  items,
  className = "",
}) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${className}`}
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants} className="h-full">
          <WhyChooseUsCard item={item} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WhyChooseUsGrid;
