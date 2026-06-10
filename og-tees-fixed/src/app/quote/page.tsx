import { ArrowRight, Truck, Clock, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const quantityTiers = [
  { qty: '25–47', price: '$11–$14', note: '25-piece minimum' },
  { qty: '48–99', price: '$9–$12', note: 'Group orders' },
  { qty: '100+', price: 'Contact us', note: 'Custom pricing' },
]

const included = [
  'Up to 2 print locations',
  'Standard screen printing',
  'Free artwork setup',
  'Digital proof before printing',
  'Ships in 7–10 business days',
]

export default function QuotePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gray-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Get a Quote</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            25-piece minimum order. See our pricing tiers below and start designing — your final quote is generated automatically at checkout.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Price Per Shirt</h2>
          <p className="text-gray-500 text-center mb-10">Based on quantity ordered. Garment cost varies by style.</p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Print + Setup</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {quantityTiers.map((tier, i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-0 ${i === 0 ? 'bg-emerald-50' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{tier.qty}</td>
                    <td className="px-6 py-4 text-gray-700">{tier.price}</td>
                    <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">
                      {i === 0 && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> {tier.note}</span>}
                      {i !== 0 && tier.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Print pricing is per shirt for standard 1-color front print. Additional colors and locations available at checkout.</p>
        </div>
      </section>

      {/* What&apos;s included */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Every Order Includes</h2>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">25 min.</div>
                <div className="text-sm text-gray-500 mt-1">Minimum order size</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <Clock className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">7–10</div>
                <div className="text-sm text-gray-500 mt-1">Business days</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <Truck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">Free</div>
                <div className="text-sm text-gray-500 mt-1">Artwork setup</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">Proof</div>
                <div className="text-sm text-gray-500 mt-1">Before we print</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom / large order CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Need 100+ Shirts or a Custom Quote?</h2>
          <p className="text-gray-500 mb-8">
            For large orders, rush jobs, multi-color prints, or specialty garments — reach out directly and we&apos;ll put together a custom quote within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:kyle@og-tees.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              Email Us a Quote Request
            </a>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
            >
              Browse Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">Or call/text: available upon request &mdash; Mon–Fri 9am–5pm CST</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
