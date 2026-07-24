"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Truck,
  Award,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { CONTENT } from "@/src/constants/content";

export interface HeroProps {}

// Pemetaan ikon berdasarkan kata kunci highlight
const ICON_MAP: Record<string, LucideIcon> = {
  "Handmade": Sparkles,
  "Kualitas Premium": Award,
  "Pengiriman Seluruh Indonesia": Truck,
  "Pelayanan Cepat": ShieldCheck,
};

export const Hero: React.FC<HeroProps> = () => {
  const { hero } = CONTENT;

  return (
    <section className="relative overflow-hidden bg-background py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 lg:gap-16">
          
          {/* Left Column: Text & CTA Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start text-left"
          >
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 font-body text-xs font-semibold text-primary sm:text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{hero.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl md:text-4xl lg:text-5xl lg:leading-tight">
              {hero.title}
            </h1>

            {/* Description */}
            <p className="mt-4 font-body text-base text-text-secondary sm:text-lg sm:leading-relaxed">
              {hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              {/* Primary Button */}
              <a
                href={hero.buttons.primary.href}
                className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
              >
                <span>{hero.buttons.primary.text}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              {/* Secondary WhatsApp Button */}
              <a
                href={hero.buttons.secondary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-6 py-3.5 font-body text-sm font-semibold text-white shadow-md shadow-whatsapp/20 transition-all hover:bg-whatsapp/90 hover:shadow-lg hover:shadow-whatsapp/30"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>{hero.buttons.secondary.text}</span>
              </a>
            </div>

            {/* Highlight Badges (4 Points) */}
            <div className="mt-10 grid w-full grid-cols-2 gap-3 border-t border-primary/10 pt-6 sm:gap-4">
              {hero.highlights.map((label, idx) => {
                const IconComponent = ICON_MAP[label] || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-medium text-text-primary sm:text-sm"
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0 text-accent" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column: Hero Image Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Background Decorative Frame Card */}
            <div className="relative w-full overflow-hidden rounded-3xl border border-primary/10 bg-secondary/60 p-4 shadow-xl sm:p-6">
              <Image
                src={hero.image.src}
                alt={hero.image.alt}
                width={600}
                height={500}
                priority
                className="h-auto w-full object-contain transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
