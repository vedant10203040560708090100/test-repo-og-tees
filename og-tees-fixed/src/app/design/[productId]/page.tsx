import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductById } from '@/data/products'
import { ChevronLeft } from 'lucide-react'
import DesignerToolClient from '@/components/designer/DesignerToolClient'

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const product = getProductById(productId)
  if (!product) return { title: 'Design Tool - OG Tees' }
  return {
    title: `Design ${product.name} - OG Tees`,
    description: `Customize your ${product.brand} ${product.name} with OG Tees' online designer.`,
  }
}

export default async function DesignPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const product = getProductById(productId)

  if (!product) notFound()

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-20 flex-shrink-0">
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-gray-900 text-sm truncate">
            {product.brand} {product.name}
          </span>
          <span className="text-xs text-gray-400 ml-2">Style #{product.styleNumber}</span>
        </div>
        <div className="text-2xl font-black">
          <span className="text-emerald-500">OG</span>
          <span className="text-gray-900"> TEES</span>
        </div>
      </div>

      {/* Designer Tool */}
      <div className="flex-1 overflow-hidden">
        <DesignerToolClient product={product} />
      </div>
    </div>
  )
}
