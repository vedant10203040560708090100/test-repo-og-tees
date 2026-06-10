'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, Palette } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  // Trap focus / prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const total = getTotal();

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#10b981]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">Your Cart</h2>
            {items.length > 0 && (
              <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full bg-[#10b981] text-white text-xs font-bold">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-lg hover:bg-gray-100 text-[#6B7280] hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F8F8F8] flex items-center justify-center mb-5">
              <Palette className="w-10 h-10 text-[#10b981]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-[#6B7280] mb-8 max-w-xs leading-relaxed">
              You haven&apos;t added anything yet. Start by designing a product
              you&apos;ll love.
            </p>
            <Link
              href="/design"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] shadow-sm"
            >
              Start Designing
            </Link>
          </div>
        ) : (
          <>
            {/* Cart items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => {
                const colorData = item.product.colors.find(
                  (c) => c.name === item.color
                );
                const imageSrc =
                  item.designPreviewUrl ??
                  colorData?.images.front ??
                  '';
                const itemTotal = (item.unitPrice + item.printPrice) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-[#F8F8F8]/50"
                  >
                    {/* Product image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={item.product.name}
                          fill
                          className="object-contain p-1"
                          sizes="80px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Palette className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[#6B7280] truncate">
                            {item.product.brand}
                          </p>
                          <h4 className="text-sm font-semibold text-[#1A1A1A] leading-snug line-clamp-1">
                            {item.product.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {colorData && (
                          <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
                            style={{ backgroundColor: colorData.hex }}
                            title={item.color}
                          />
                        )}
                        <span className="text-xs text-[#6B7280]">
                          {item.color}
                        </span>
                        <span className="text-xs text-[#6B7280]">/</span>
                        <span className="text-xs text-[#6B7280]">{item.size}</span>
                      </div>

                      {/* Quantity stepper + price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-[#6B7280] hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#10b981]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[#1A1A1A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-[#6B7280] hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#10b981]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#1A1A1A]">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: subtotal + actions */}
            <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-white">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span className="text-lg font-bold text-[#1A1A1A]">
                  ${total.toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-[#6B7280]">
                Shipping and taxes calculated at checkout.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center w-full py-3.5 rounded-xl bg-[#10b981] text-white text-sm font-bold hover:bg-[#059669] active:bg-[#059669] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
                >
                  Checkout &rarr;
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-[#1A1A1A] text-[#1A1A1A] text-sm font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
