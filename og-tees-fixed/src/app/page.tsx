import Link from 'next/link'
import { ArrowRight, Star, Truck, Shield, Palette, Zap } from 'lucide-react'

const categories = [
  { name: 'T-Shirts', slug: 'tshirt', icon: '👕', count: '50+ styles' },
  { name: 'Hoodies', slug: 'hoodie', icon: '🧥', count: '30+ styles' },
  { name: 'Long Sleeve', slug: 'longsleeve', icon: '👔', count: '20+ styles' },
  { name: 'Polos', slug: 'polo', icon: '🏌️', count: '15+ styles' },
  { name: 'Tank Tops', slug: 'tank', icon: '🎽', count: '10+ styles' },
  { name: 'Hats', slug: 'hat', icon: '🧢', count: '25+ styles' },
]

const howItWorks = [
  { step: '1', title: 'Choose Your Garment', desc: 'Browse 200+ styles from top brands like Gildan, Bella+Canvas, and Next Level.' },
  { step: '2', title: 'Design It', desc: 'Use our online designer to add text, clipart, or your own artwork. AI design help available.' },
  { step: '3', title: 'Place Your Order', desc: 'Select sizes, quantities, and check out securely. 25-piece minimum order.' },
  { step: '4', title: 'We Print & Ship', desc: 'Your order is screen printed and shipped directly to you, typically in 7-10 business days.' },
]

const testimonials = [
  { name: 'Sarah M.', text: 'Ordered shirts for our company retreat. The quality blew us away and delivery was faster than expected!', stars: 5 },
  { name: 'Marcus T.', text: 'Used the designer tool and it was super easy. My band tees came out exactly like I designed them.', stars: 5 },
  { name: 'Coach Rivera', text: 'Perfect for my youth sports team. Great prices on bulk orders and the uniforms look professional.', stars: 5 },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-emerald-500">OG</span>
                <span className="text-gray-900"> TEES</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Products</Link>
              <Link href="/quote" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Quote</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">About Us</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                Start Designing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-4 h-4" />
              AI-Powered Design Tool Available
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Custom Tees,
              <br />
              <span className="text-emerald-500">Your Way.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Design and order premium screen-printed apparel online. Choose from hundreds of garment styles,
              create your design with our powerful online tool, and get print-quality results shipped to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105"
              >
                Browse Products
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-bold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all"
              >
                View Pricing
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-gray-400">
              <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-400" /> 25-piece minimum</div>
              <div className="flex items-center gap-1"><Truck className="w-4 h-4 text-blue-400" /> Ships in 7-10 days</div>
              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> 500+ happy customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Shop by Category</h2>
            <p className="text-gray-500 text-lg">From everyday tees to premium hoodies — we&apos;ve got your style.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 group"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <div className="font-bold text-gray-900 group-hover:text-emerald-500 transition-colors">{cat.name}</div>
                <div className="text-xs text-gray-400 mt-1">{cat.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">From idea to doorstep in 4 simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white bg-emerald-500 mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Palette className="w-10 h-10 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold mb-2">AI Design Assistant</h3>
              <p className="opacity-80 text-sm">Describe your idea and our AI generates print-ready artwork instantly.</p>
            </div>
            <div>
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
              <p className="opacity-80 text-sm">Professional screen printing on premium blanks from Gildan, Bella+Canvas, and more.</p>
            </div>
            <div>
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
              <p className="opacity-80 text-sm">Most orders ship within 7-10 business days. Rush options available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Ready to create something awesome?</h2>
          <p className="text-gray-400 text-lg mb-8">Browse our full catalog and start designing your custom apparel today.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105"
          >
            Shop All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-black mb-3">
                <span className="text-emerald-400">OG</span>
                <span className="text-white"> TEES</span>
              </div>
              <p className="text-sm leading-relaxed">Premium custom screen printing for everyone. Quality garments, professional results.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/quote" className="hover:text-white transition-colors">Get a Quote</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sizing Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:kyle@og-tees.com" className="hover:text-white transition-colors">kyle@og-tees.com</a></li>
                <li className="text-gray-500">Mon-Fri 9am-5pm CST</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            <p>&copy; 2025 OG Tees. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
