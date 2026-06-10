import { ArrowRight, Printer, Heart, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const values = [
  {
    icon: <Printer className="w-7 h-7 text-emerald-500" />,
    title: 'Real Screen Printing',
    desc: 'We do actual screen printing — not DTG, not iron-on. Vibrant, durable prints that hold up wash after wash.',
  },
  {
    icon: <Heart className="w-7 h-7 text-emerald-500" />,
    title: 'Small Business, Big Quality',
    desc: "We're a local shop that competes on quality, not just price. Every order gets personal attention before it ships.",
  },
  {
    icon: <Zap className="w-7 h-7 text-emerald-500" />,
    title: 'Fast Turnaround',
    desc: 'Most orders ship in 7–10 business days. Rush options available — just ask.',
  },
  {
    icon: <Shield className="w-7 h-7 text-emerald-500" />,
    title: 'Satisfaction Guaranteed',
    desc: "If your order isn't right, we make it right. No runaround, no hassle.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gray-900 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Local. Independent. Legit.
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              We&apos;re OG Tees.
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              A screen printing shop built for people who actually care about what their shirts look like.
              From custom team gear to band merch to company swag — we print it right.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  OG Tees was started by Kyle — a screen printer who got tired of seeing shops charge a fortune for mediocre work or turn away small orders. The idea was simple: bring professional-grade screen printing to everyone, no matter the order size.
                </p>
                <p>
                  We source premium blanks from SanMar and SSActivewear — the same distributors used by the top print shops in the country — and we print them in-house with the same care we&apos;d give our own gear.
                </p>
                <p>
                  Whether you need 25 shirts for a friend group or 600 for a corporate event, you get the same quality and the same service.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-black text-gray-900">500+</div>
                  <div className="text-gray-500 mt-1">Happy customers</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900">25 min.</div>
                  <div className="text-gray-500 mt-1">Minimum order size</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900">200+</div>
                  <div className="text-gray-500 mt-1">Garment styles available</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900">7–10</div>
                  <div className="text-gray-500 mt-1">Business day turnaround</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">How We Do It</h2>
          <p className="text-gray-500 text-center mb-12">A few things we take seriously.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-500 mb-8">
            Questions about an order, a custom job, or just want to chat about your project? Reach out — Kyle responds personally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:kyle@og-tees.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              kyle@og-tees.com
            </a>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
            >
              Start Designing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
