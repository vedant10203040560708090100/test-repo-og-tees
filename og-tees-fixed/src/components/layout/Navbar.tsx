'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const navLinks = [
  { label: 'Products', href: '/products' },
  { label: 'Quote', href: '/quote' },
  { label: 'About Us', href: '/about' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { getTotalItems, toggleCart } = useCartStore();
  const itemCount = getTotalItems();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-200 bg-white ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] rounded"
          >
            <span className="font-black text-2xl text-[#1A1A1A] tracking-tight leading-none">
              OG
            </span>
            <span className="font-black text-2xl text-[#10b981] tracking-tight leading-none">
              TEES
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] ${
                      isActive
                        ? 'text-[#10b981] bg-[#10b981]/8'
                        : 'text-[#1A1A1A] hover:text-[#10b981] hover:bg-[#10b981]/8'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right side: Cart + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={toggleCart}
              aria-label={`Cart, ${itemCount} items`}
              className="relative p-2 rounded-lg text-[#1A1A1A] hover:text-[#10b981] hover:bg-[#10b981]/8 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#10b981] text-white text-[10px] font-bold leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-lg text-[#1A1A1A] hover:text-[#10b981] hover:bg-[#10b981]/8 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            mobileOpen ? 'max-h-64 pb-3' : 'max-h-0'
          }`}
        >
          <ul className="flex flex-col gap-1 pt-1 border-t border-gray-100">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] ${
                      isActive
                        ? 'text-[#10b981] bg-[#10b981]/8'
                        : 'text-[#1A1A1A] hover:text-[#10b981] hover:bg-[#10b981]/8'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
