"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { FAQItemData } from "@/src/constants/faq";

export interface FAQItemProps {
  /** Objek data FAQ (id, question, answer) */
  item: FAQItemData;
  /** Status apakah item ini sedang terbuka */
  isOpen: boolean;
  /** Callback untuk mengubah (toggle) status terbuka/tertutup */
  onToggle: () => void;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `FAQItem` merender satu baris pertanyaan dan jawaban accordion
 * dilengkapi dengan tombol ikon Plus/Minus dan animasi halus Framer Motion.
 */
export const FAQItem: React.FC<FAQItemProps> = ({
  item,
  isOpen,
  onToggle,
  className = "",
}) => {
  const { question, answer } = item;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 ${
        isOpen
          ? "border-primary/30 bg-white shadow-md"
          : "border-primary/10 bg-white/80 hover:border-primary/25 hover:bg-white hover:shadow-xs"
      } ${className}`}
    >
      {/* Header Tombol Pertanyaan */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left focus:outline-none cursor-pointer"
      >
        <span className="font-heading text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
          {question}
        </span>

        {/* Tombol Ikon Plus / Minus dengan Animasi Rotasi */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
            isOpen
              ? "bg-primary text-white shadow-xs"
              : "bg-primary/10 text-primary group-hover:bg-primary/20"
          }`}
        >
          {isOpen ? (
            <Minus className="h-4 w-4 stroke-[2.5]" />
          ) : (
            <Plus className="h-4 w-4 stroke-[2.5]" />
          )}
        </div>
      </button>

      {/* Teks Jawaban dengan Animasi Expand / Collapse */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6 font-body text-sm sm:text-base text-text-secondary leading-relaxed border-t border-primary/5 mt-1">
              <p className="pt-3">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQItem;
