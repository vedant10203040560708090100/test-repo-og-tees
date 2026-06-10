import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendAdminOrderEmail } from '@/lib/email'
import { getProductById } from '@/data/products'
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const metadata = session.metadata ?? {}
      const items = JSON.parse(metadata.items || '[]')
      const shipping = parseFloat(metadata.shipping || '0')
      const tax = parseFloat(metadata.tax || '0')

      const orderItems = []
      let subtotal = 0

      for (const item of items) {
        const product = getProductById(item.productId)
        if (!product) continue

        const printPrice = 8 * 1.4
        const unitTotal = (product.priceBase + printPrice) * item.quantity
        subtotal += unitTotal

        orderItems.push({
          productId: item.productId,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: product.priceBase,
          printPrice,
          total: unitTotal,
        })
      }

      const orderNumber = `OGT-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`
      const customerDetails = session.customer_details
      const customerName = customerDetails?.name || 'Customer'
      const customerEmail = session.customer_email || customerDetails?.email || ''
      const shippingAddr = customerDetails?.address

      const shippingAddressObj = {
        name: customerName,
        line1: shippingAddr?.line1 || '',
        line2: shippingAddr?.line2 || '',
        city: shippingAddr?.city || '',
        state: shippingAddr?.state || '',
        zip: shippingAddr?.postal_code || '',
        country: shippingAddr?.country || 'US',
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          status: 'confirmed',
          customerName,
          customerEmail,
          customerPhone: customerDetails?.phone || null,
          shippingAddress: JSON.stringify(shippingAddressObj),
          subtotal,
          shipping,
          tax,
          total: subtotal + shipping + tax,
          stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripeSessionId: session.id,
          items: {
            create: orderItems,
          },
        },
        include: { items: { include: { product: true } } },
      })

      // Parse shippingAddress back to object for email functions
      const orderForEmail = {
        ...order,
        shippingAddress: shippingAddressObj,
      }

      await Promise.all([
        sendOrderConfirmationEmail(orderForEmail),
        sendAdminOrderEmail(orderForEmail, []),
      ])

      console.log(`Order ${orderNumber} created successfully`)
    } catch (err) {
      console.error('Error processing order:', err)
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
