'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Palette } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

const categoryLabels: Record<Product['category'], string> = {
  tshirt: 'T-Shirt',
  hoodie: 'Hoodie',
  sweatshirt: 'Sweatshirt',
  polo: 'Polo',
  tank: 'Tank',
  longsleeve: 'Long Sleeve',
  hat: 'Hat',
  bag: 'Bag',
};

const PRINT_PRICE_ESTIMATE = 3.5; // per-unit estimate for 1-color screen print
const MAX_VISIBLE_SWATCHES = 6;

export default function ProductCard({ product }: ProductCardProps) {
  const [hoveredColorIdx, setHoveredColorIdx] = useState<number | null>(null);

  const displayColorIdx = hoveredColorIdx ?? 0;
  const displayColor = product.colors[displayColorIdx];
  const imageSrc = displayColor?.images.front ?? '';

  const visibleColors = product.colors.slice(0, MAX_VISIBLE_SWATCHES);
  const extraCount = Math.max(0, product.colors.length - MAX_VISIBLE_SWATCHES);
  const fromPrice = (product.priceBase + PRINT_PRICE_ESTIMATE).toFixed(2);

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image area */}
      <Link
        href={`/design/${product.id}`}
        className="relative block aspect-[3/4] bg-[#F8F8F8] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-inset"
        tabIndex={0}
        aria-label={`Design ${product.name} by ${product.brand}`}
      >
        {/* Category badge */}
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-[#1A1A1A] border border-gray-100 shadow-sm">
          {categoryLabels[product.category]}
        </span>

        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${displayColor?.name ?? ''} ${product.name}`}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Palette className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#10b981]/0 group-hover:bg-[#10b981]/5 transition-colors duration-200 pointer-events-none" />
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Brand + Name */}
        <div>
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
            {product.brand}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-[#1A1A1A] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-[#6B7280]">from</span>
          <span className="text-base font-bold text-[#1A1A1A]">
            ${fromPrice}
          </span>
          <span className="text-xs text-[#6B7280]">each</span>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleColors.map((color, idx) => (
            <button
              key={color.name}
              type="button"
              title={color.name}
              aria-label={`Select ${color.name}`}
              onMouseEnter={() => setHoveredColorIdx(idx)}
              onMouseLeave={() => setHoveredColorIdx(null)}
              onFocus={() => setHoveredColorIdx(idx)}
              onBlur={() => setHoveredColorIdx(null)}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-1 ${
                displayColorIdx === idx
                  ? 'border-[#10b981] scale-110'
                  : 'border-white shadow-[0_0_0_1px_#e5e7eb] hover:scale-110'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-[#6B7280] font-medium ml-0.5">
              +{extraCount} more
            </span>
          )}
          {hoveredColorIdx !== null && (
            <span className="ml-auto text-[11px] text-[#6B7280] font-medium truncate max-w-[90px]">
              {product.colors[hoveredColorIdx]?.name}
            </span>
          )}
        </div>

        {/* CTA button — pushed to bottom */}
        <div className="mt-auto pt-1">
          <Link
            href={`/design/${product.id}`}
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] active:bg-[#059669] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 shadow-sm"
          >
            Start Designing
          </Link>
        </div>
      </div>
    </article>
  );
}
