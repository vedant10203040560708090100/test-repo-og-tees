'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const { clearCart } = useCartStore()

  useEffect(() => {
    if (sessionId) {
      // Generate a display order number from session
      setOrderNumber(`OGT-${Date.now().toString().slice(-8).toUpperCase()}`)
      clearCart()
    }
  }, [sessionId, clearCart])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for your order. We&apos;re getting your custom tees ready to print.
        </p>

        {orderNumber && (
          <div className="bg-gray-50 rounded-xl px-6 py-4 mb-8">
            <p className="text-sm text-gray-500 mb-1">Your Order Number</p>
            <p className="text-2xl font-black text-emerald-500">{orderNumber}</p>
          </div>
        )}

        <div className="space-y-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Confirmation email sent</p>
              <p className="text-gray-500 text-xs mt-0.5">Check your inbox for order details and tracking info.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Production begins soon</p>
              <p className="text-gray-500 text-xs mt-0.5">Your design will be screen printed and shipped in 7-10 business days.</p>
            </div>
          </div>
        </div>

        <Link
          href="/products"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/" className="block mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}
