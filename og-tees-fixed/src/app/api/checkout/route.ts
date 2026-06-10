import { NextRequest, NextResponse } from 'next/server'
import { stripe, calculateOrderTotal, calculateShipping, calculatePrintPrice } from '@/lib/stripe'
import { getProductById } from '@/data/products'

export async function POST(request: NextRequest) {
  try {
    const { items, customerEmail, successUrl, cancelUrl } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const lineItems = []
    const enrichedItems = []

    for (const item of items) {
      const product = getProductById(item.productId)
      if (!product) continue

      const printPrice = calculatePrintPrice(item.sides || 1)
      const unitPrice = product.priceBase
      const totalPerItem = (unitPrice + printPrice) * item.quantity

      enrichedItems.push({ unitPrice, printPrice, quantity: item.quantity })

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${product.brand} ${product.name} - ${item.color} / ${item.size}`,
            description: `Custom screen print${item.designName ? `: ${item.designName}` : ''}`,
            images: [],
          },
          unit_amount: Math.round((unitPrice + printPrice) * 100),
        },
        quantity: item.quantity,
      })
    }

    const totalQuantity = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0)
    const shipping = calculateShipping(totalQuantity)
    const { tax } = calculateOrderTotal(enrichedItems, shipping)

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shipping' },
        unit_amount: Math.round(shipping * 100),
      },
      quantity: 1,
    })

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tax' },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: successUrl || `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appUrl}/cart`,
      metadata: {
        items: JSON.stringify(items),
        shipping: shipping.toString(),
        tax: tax.toString(),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      billing_address_collection: 'required',
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
