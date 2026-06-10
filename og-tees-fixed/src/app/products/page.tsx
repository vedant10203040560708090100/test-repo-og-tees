'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, ArrowRight, X } from 'lucide-react'
import type { Product } from '@/types'

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'T-Shirts', value: 'tshirt' },
  { label: 'Hoodies', value: 'hoodie' },
  { label: 'Long Sleeve', value: 'longsleeve' },
  { label: 'Polos', value: 'polo' },
  { label: 'Tank Tops', value: 'tank' },
  { label: 'Hats', value: 'hat' },
  { label: 'Bags', value: 'bag' },
]

function ProductCard({ product }: { product: Product }) {
  const firstColor = product.colors[0]
  const imgUrl = firstColor?.images?.front || `https://placehold.co/400x400/e5e7eb/6b7280?text=${encodeURIComponent(product.name)}`
  const estimatedTotal = (product.priceBase + 11.20).toFixed(2)

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 text-xs font-semibold px-2 py-1 rounded-full text-gray-600 border border-gray-200">
            {product.distributor === 'sanmar' ? 'SanMar' : 'SSActivewear'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{product.brand}</p>
        <h3 className="font-bold text-gray-900 mb-1 leading-snug">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3">Style #{product.styleNumber}</p>

        {/* Color swatches */}
        <div className="flex items-center gap-1 mb-3">
          {product.colors.slice(0, 6).map((color) => (
            <div
              key={color.name}
              className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          {product.colors.length > 6 && (
            <span className="text-xs text-gray-400">+{product.colors.length - 6}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">From</p>
            <p className="font-black text-gray-900">${estimatedTotal}<span className="text-xs font-normal text-gray-400"> ea.</span></p>
          </div>
          <Link
            href={`/design/${product.id}`}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            Design
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const initialQuery = searchParams.get('q') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState(initialQuery)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      if (query) params.set('q', query)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      setLoading(false)
    }
    fetchProducts()
  }, [category, query])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">All Products</h1>
              <p className="text-gray-500 mt-1">Choose a garment and start designing</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setQuery(searchInput) }}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400 w-64"
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(''); setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  category === cat.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try a different search or category</p>
            <button
              onClick={() => { setCategory('all'); setQuery(''); setSearchInput('') }}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">Showing {products.length} products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <ProductsContent />
    </Suspense>
  )
}
