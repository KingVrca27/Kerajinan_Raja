"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FAQItemData } from "@/src/constants/faq";
import FAQItem from "./FAQItem";

export interface FAQAccordionProps {
  /** Array daftar item FAQ yang akan dirender */
  items: FAQItemData[];
  /** Kelas CSS tambahan */
  className?: string;
}

// Framer Motion Stagger Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Komponen `FAQAccordion` merender kumpulan item FAQ dalam format 1 kolom
 * ber-max-width nyaman untuk pembacaan di Desktop, Tablet, dan Mobile.
 */
export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  className = "",
}) => {
  // State untuk menyimpan ID item FAQ yang sedang terbuka (default: item pertama terbuka)
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const handleToggle = (id: string) => {
    setOpenId((prevOpenId) => (prevOpenId === id ? null : id));
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`mx-auto max-w-3xl space-y-4 ${className}`}
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          <FAQItem
            item={item}
            isOpen={openId === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default FAQAccordion;
