import React from "react";
import Image from "next/image";

export interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-secondary/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo Putra Art Shop"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="font-heading text-xl font-bold tracking-tight text-primary md:text-2xl">
            Putra Art Shop
          </span>
        </div>

        {/* Navigation Menu Placeholder */}
        <nav className="hidden items-center space-x-8 text-sm font-medium text-text-secondary md:flex">
          <span className="cursor-pointer transition-colors hover:text-primary">[Menu Item 1]</span>
          <span className="cursor-pointer transition-colors hover:text-primary">[Menu Item 2]</span>
          <span className="cursor-pointer transition-colors hover:text-primary">[Menu Item 3]</span>
        </nav>

        {/* Cart / Action Placeholder */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <span>🛒 [Cart]</span>
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">0</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
