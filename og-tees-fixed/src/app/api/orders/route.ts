import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const orderNumber = searchParams.get('orderNumber')

  try {
    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: { include: { product: true } } },
      })
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      return NextResponse.json({ order })
    }

    if (email) {
      const orders = await prisma.order.findMany({
        where: { customerEmail: email },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ orders })
    }

    return NextResponse.json({ error: 'Email or order number required' }, { status: 400 })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
