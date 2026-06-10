import { NextRequest, NextResponse } from 'next/server'
import { mockProducts, searchProducts, getProductsByCategory } from '@/data/products'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const query = searchParams.get('q')
  const distributor = searchParams.get('distributor')

  let products = mockProducts

  if (query) {
    products = searchProducts(query)
  } else if (category && category !== 'all') {
    products = getProductsByCategory(category)
  }

  if (distributor) {
    products = products.filter(p => p.distributor === distributor)
  }

  return NextResponse.json({ products, total: products.length })
}
