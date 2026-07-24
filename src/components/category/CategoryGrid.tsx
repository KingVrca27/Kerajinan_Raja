"use client";

import React from "react";
import { motion } from "framer-motion";
import { Category } from "@/src/types/category";
import CategoryCard from "@/src/components/category/CategoryCard";

export interface CategoryGridProps {
  categories: Category[];
  className?: string;
}

// Framer Motion variants untuk container (stagger) & item (fade-in slide up)
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  className = "",
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 ${className}`}
    >
      {categories.map((category) => (
        <motion.div
          key={category.id}
          variants={itemVariants}
          className="flex w-[calc(50%-0.5rem)] min-w-[140px] max-w-[210px] flex-1 sm:w-[calc(33.333%-1rem)] lg:w-[190px] xl:w-[210px]"
        >
          <CategoryCard category={category} className="w-full h-full" />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CategoryGrid;
