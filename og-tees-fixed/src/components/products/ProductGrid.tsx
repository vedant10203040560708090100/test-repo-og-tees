'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SlidersHorizontal, X, ChevronDown, LayoutGrid, Search } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  initialCategory?: string;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

const categoryLabels: Record<string, string> = {
  tshirt: 'T-Shirts',
  hoodie: 'Hoodies',
  sweatshirt: 'Sweatshirts',
  polo: 'Polos',
  tank: 'Tanks',
  longsleeve: 'Long Sleeves',
  hat: 'Hats',
  bag: 'Bags',
};

// ─── Price range slider ────────────────────────────────────────────────────────

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function PriceRangeSlider({ min, max, value, onChange }: PriceRangeSliderProps) {
  const handleLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), value[1] - 1);
    onChange([v, value[1]]);
  };
  const handleHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), value[0] + 1);
    onChange([value[0], v]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#6B7280]">
        <span className="font-medium text-[#1A1A1A]">${value[0].toFixed(2)}</span>
        <span className="font-medium text-[#1A1A1A]">${value[1].toFixed(2)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-gray-200 rounded-full" />
        <div
          className="absolute h-1.5 bg-[#10b981] rounded-full"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={0.5}
          value={value[0]}
          onChange={handleLow}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={0.5}
          value={value[1]}
          onChange={handleHigh}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
}

// ─── Filter section wrapper ────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-1 text-sm font-semibold text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#10b981] rounded"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ProductGrid({ products, initialCategory }: ProductGridProps) {
  // Derive filter options from products
  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );
  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );
  const allColorNames = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => names.add(c.name)));
    return [...names].sort();
  }, [products]);
  const priceRange = useMemo(() => {
    const prices = products.map((p) => p.priceBase);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set(initialCategory ? [initialCategory] : [])
  );
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [priceFilter, setPriceFilter] = useState<[number, number]>([
    priceRange.min,
    priceRange.max,
  ]);
  const [sort, setSort] = useState<SortOption>('featured');
  const [search, setSearch] = useState('');

  // Mobile filter sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleSet = useCallback(
    (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
      setFn((prev) => {
        const next = new Set(prev);
        next.has(value) ? next.delete(value) : next.add(value);
        return next;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setSelectedColors(new Set());
    setPriceFilter([priceRange.min, priceRange.max]);
    setSearch('');
  }, [priceRange]);

  const hasActiveFilters =
    selectedCategories.size > 0 ||
    selectedBrands.size > 0 ||
    selectedColors.size > 0 ||
    priceFilter[0] > priceRange.min ||
    priceFilter[1] < priceRange.max ||
    search.trim().length > 0;

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (selectedCategories.size > 0) {
      result = result.filter((p) => selectedCategories.has(p.category));
    }
    if (selectedBrands.size > 0) {
      result = result.filter((p) => selectedBrands.has(p.brand));
    }
    if (selectedColors.size > 0) {
      result = result.filter((p) =>
        p.colors.some((c) => selectedColors.has(c.name))
      );
    }
    result = result.filter(
      (p) => p.priceBase >= priceFilter[0] && p.priceBase <= priceFilter[1]
    );

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.priceBase - b.priceBase);
        break;
      case 'price-desc':
        result.sort((a, b) => b.priceBase - a.priceBase);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, search, selectedCategories, selectedBrands, selectedColors, priceFilter, sort]);

  // Color hex map for swatch rendering
  const colorHexMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => p.colors.forEach((c) => { map[c.name] = c.hex; }));
    return map;
  }, [products]);

  const FilterPanelContent = (
    <div className="space-y-5">
      {/* Category */}
      <FilterSection title="Category">
        {allCategories.map((cat) => (
          <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedCategories.has(cat)}
              onChange={() => toggleSet(selectedCategories, setSelectedCategories, cat)}
              className="w-4 h-4 rounded border-gray-300 text-[#10b981] accent-[#10b981] cursor-pointer"
            />
            <span className="text-sm text-[#1A1A1A] group-hover:text-[#10b981] transition-colors">
              {categoryLabels[cat] ?? cat}
            </span>
            <span className="ml-auto text-xs text-[#6B7280]">
              {products.filter((p) => p.category === cat).length}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand">
        {allBrands.map((brand) => (
          <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedBrands.has(brand)}
              onChange={() => toggleSet(selectedBrands, setSelectedBrands, brand)}
              className="w-4 h-4 rounded border-gray-300 accent-[#10b981] cursor-pointer"
            />
            <span className="text-sm text-[#1A1A1A] group-hover:text-[#10b981] transition-colors line-clamp-1">
              {brand}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {allColorNames.map((name) => {
            const hex = colorHexMap[name] ?? '#ccc';
            const selected = selectedColors.has(name);
            return (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={`Filter by ${name}`}
                onClick={() => toggleSet(selectedColors, setSelectedColors, name)}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-1 ${
                  selected
                    ? 'border-[#10b981] scale-110'
                    : 'border-white shadow-[0_0_0_1px_#e5e7eb] hover:scale-110'
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
        {selectedColors.size > 0 && (
          <p className="text-xs text-[#6B7280] mt-2">
            {[...selectedColors].join(', ')}
          </p>
        )}
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range" defaultOpen={false}>
        <PriceRangeSlider
          min={priceRange.min}
          max={priceRange.max}
          value={priceFilter}
          onChange={setPriceFilter}
        />
      </FilterSection>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full py-2 text-sm font-semibold text-[#10b981] border border-[#10b981] rounded-xl hover:bg-[#10b981]/8 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar: search + sort + mobile filter toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          {/* Product count */}
          <p className="text-sm text-[#6B7280] whitespace-nowrap hidden sm:block">
            <span className="font-semibold text-[#1A1A1A]">{filteredProducts.length}</span> of{' '}
            {products.length} products
          </p>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent cursor-pointer text-[#1A1A1A]"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:border-[#10b981] hover:text-[#10b981] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#10b981] text-white text-[10px] font-bold">
                {selectedCategories.size + selectedBrands.size + selectedColors.size +
                  (priceFilter[0] > priceRange.min || priceFilter[1] < priceRange.max ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile product count */}
      <p className="text-sm text-[#6B7280] mb-4 sm:hidden">
        Showing{' '}
        <span className="font-semibold text-[#1A1A1A]">{filteredProducts.length}</span> of{' '}
        {products.length} products
      </p>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#10b981]" />
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-[#10b981] hover:underline focus-visible:outline-none"
                >
                  Clear all
                </button>
              )}
            </div>
            {FilterPanelContent}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <LayoutGrid className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                No products found
              </h3>
              <p className="text-sm text-[#6B7280] mb-6 max-w-xs">
                Try adjusting your filters or search terms to find what you&apos;re looking for.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#10b981]" />
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="p-1.5 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {FilterPanelContent}
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full py-3 rounded-xl bg-[#10b981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
              >
                Show {filteredProducts.length} Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
