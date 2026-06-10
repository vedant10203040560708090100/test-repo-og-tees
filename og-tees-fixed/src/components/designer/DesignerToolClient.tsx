'use client'

import dynamic from 'next/dynamic'
import type { Product } from '@/types'

const DesignerTool = dynamic(
  () => import('@/components/designer/DesignerTool'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading designer...</p>
        </div>
      </div>
    ),
  }
)

export default function DesignerToolClient({ product }: { product: Product }) {
  return <DesignerTool product={product} />
}
