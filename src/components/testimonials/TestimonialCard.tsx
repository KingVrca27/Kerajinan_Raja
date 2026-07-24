"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { TestimonialItem } from "@/src/constants/testimonials";

export interface TestimonialCardProps {
  /** Objek data testimoni individual (avatar, nama, kota, rating, ulasan) */
  testimonial: TestimonialItem;
  /** Kelas CSS tambahan */
  className?: string;
}

/**
 * Komponen `TestimonialCard` merender satu kartu ulasan pelanggan
 * menampilkan avatar, nama, kota asal, 5 bintang rating, serta teks komentar ulasan.
 */
export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  className = "",
}) => {
  const { name, city, rating, comment, avatar } = testimonial;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative flex flex-col justify-between rounded-3xl border border-primary/10 bg-white p-6 sm:p-7 shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${className}`}
    >
      {/* Background Accent Highlight Glow saat Hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      <div className="space-y-4">
        {/* Baris Atas: Rating Bintang 5 & Ikon Kutipan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < rating
                    ? "fill-amber-400 stroke-amber-400"
                    : "fill-gray-200 stroke-gray-300"
                }`}
              />
            ))}
          </div>
          <Quote className="h-6 w-6 text-primary/20 transition-colors group-hover:text-primary/40" />
        </div>

        {/* Teks Komentar / Ulasan Pelanggan */}
        <p className="font-body text-sm text-text-primary/90 leading-relaxed italic">
          &ldquo;{comment}&rdquo;
        </p>
      </div>

      {/* Baris Bawah: Avatar, Nama, dan Kota Pelanggan */}
      <div className="mt-6 flex items-center gap-3.5 pt-4 border-t border-primary/10">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20 shadow-xs">
          <Image
            src={avatar}
            alt={`Avatar ${name}`}
            fill
            sizes="48px"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="font-heading text-sm font-bold text-text-primary truncate">
            {name}
          </h4>
          <span className="font-body text-xs text-text-secondary truncate">
            {city}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
