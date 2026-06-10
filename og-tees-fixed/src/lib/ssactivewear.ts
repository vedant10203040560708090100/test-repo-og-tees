/**
 * SSActivewear API Client
 *
 * SSActivewear's API is REST-based (JSON). Base URL:
 *   https://api.ssactivewear.com/V2/
 *
 * Auth: HTTP Basic auth with your SS account number and API key.
 *   Authorization: Basic base64(accountNumber:apiKey)
 *
 * Key endpoints used here:
 *   GET  /products/                     - list all products
 *   GET  /products/{styleId}/           - single product detail
 *   GET  /inventory/{styleId}/          - inventory by color/size
 *   POST /orders/                       - place an order
 *
 * Full docs: https://api.ssactivewear.com/V2/docs/
 *
 * Required env vars:
 *   SSACTIVEWEAR_ACCOUNT, SSACTIVEWEAR_API_KEY
 *
 * This file returns mock data when credentials are absent.
 */

const SS_BASE_URL = 'https://api.ssactivewear.com/V2'
const SS_ACCOUNT = process.env.SSACTIVEWEAR_ACCOUNT
const SS_API_KEY = process.env.SSACTIVEWEAR_API_KEY

function credentialsPresent(): boolean {
  return !!(SS_ACCOUNT && SS_API_KEY)
}

function buildAuthHeader(): string {
  const raw = `${SS_ACCOUNT}:${SS_API_KEY}`
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(raw).toString('base64')
      : btoa(raw)
  return `Basic ${encoded}`
}

async function ssApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SS_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[ssactivewear] ${res.status} ${res.statusText}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SSProductVariant {
  sku: string
  styleId: number
  colorName: string
  sizeName: string
  gtin: string
  caseSize: number
  weight: number
  msrp: number
  ourPrice: number
  casePrice: number
}

export interface SSProductImage {
  colorName: string
  frontModel?: string
  frontFlat?: string
  backModel?: string
  backFlat?: string
}

export interface SSProduct {
  styleId: number
  title: string
  brandName: string
  styleName: string
  description: string
  categoryName: string
  variants: SSProductVariant[]
  images: SSProductImage[]
  newStyle: boolean
  closeout: boolean
}

export interface SSOrderLine {
  sku: string
  quantity: number
}

export interface SSShipTo {
  company?: string
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface SSOrderData {
  poNumber: string
  shipTo: SSShipTo
  shipMethod: string  // e.g. "UPS Ground", "FedEx 2Day"
  lines: SSOrderLine[]
  comments?: string
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: SSProduct[] = [
  {
    styleId: 1001,
    title: 'Essential T-Shirt',
    brandName: 'Port & Company',
    styleName: 'PC61',
    description: 'Mock SSActivewear product — credentials not configured.',
    categoryName: 'T-Shirts',
    variants: [
      { sku: 'PC61-BLK-M', styleId: 1001, colorName: 'Black', sizeName: 'M', gtin: '00000000001', caseSize: 12, weight: 0.3, msrp: 9.99, ourPrice: 3.49, casePrice: 3.25 },
      { sku: 'PC61-WHT-M', styleId: 1001, colorName: 'White', sizeName: 'M', gtin: '00000000002', caseSize: 12, weight: 0.3, msrp: 9.99, ourPrice: 3.49, casePrice: 3.25 },
      { sku: 'PC61-NVY-M', styleId: 1001, colorName: 'Navy',  sizeName: 'M', gtin: '00000000003', caseSize: 12, weight: 0.3, msrp: 9.99, ourPrice: 3.49, casePrice: 3.25 },
    ],
    images: [
      { colorName: 'Black', frontFlat: 'https://placehold.co/600x700/1A1A1A/FFFFFF?text=PC61+Black' },
    ],
    newStyle: false,
    closeout: false,
  },
  {
    styleId: 1002,
    title: 'Midweight Hooded Sweatshirt',
    brandName: 'Independent Trading Co.',
    styleName: 'SS4500',
    description: 'Mock SSActivewear hoodie product.',
    categoryName: 'Sweatshirts',
    variants: [
      { sku: 'SS4500-BLK-L', styleId: 1002, colorName: 'Black', sizeName: 'L', gtin: '00000000010', caseSize: 6, weight: 0.9, msrp: 39.99, ourPrice: 16.50, casePrice: 15.00 },
    ],
    images: [
      { colorName: 'Black', frontFlat: 'https://placehold.co/600x700/1A1A1A/FFFFFF?text=SS4500+Black' },
    ],
    newStyle: true,
    closeout: false,
  },
]

function buildMockInventory(): Record<string, number> {
  const sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL']
  const inv: Record<string, number> = {}
  for (const size of sizes) {
    inv[size] = Math.floor(Math.random() * 250) + 10
  }
  return inv
}

// ─── API CLIENT ────────────────────────────────────────────────────────────────

/**
 * Fetches a product list from GET /products/?mediaType=json
 * Optionally filtered by category.
 *
 * Production note: SSActivewear's product endpoint returns a large payload.
 * Consider paginating or caching results with Redis/DB.
 */
export async function getProducts(category?: string): Promise<SSProduct[]> {
  if (!credentialsPresent()) {
    console.warn('[ssactivewear] Credentials not configured — returning mock products')
    if (category) {
      return MOCK_PRODUCTS.filter(
        (p) => p.categoryName.toLowerCase() === category.toLowerCase()
      )
    }
    return MOCK_PRODUCTS
  }

  try {
    const path = category
      ? `/products/?mediaType=json&categoryName=${encodeURIComponent(category)}`
      : '/products/?mediaType=json'
    const data = await ssApiFetch<SSProduct[]>(path)
    return data
  } catch (err) {
    console.error('[ssactivewear] getProducts failed:', err)
    return MOCK_PRODUCTS
  }
}

/**
 * Fetches inventory for a specific style from GET /inventory/{styleId}/
 * Returns a map of sizeName -> quantity.
 *
 * Real response shape: Array of { sku, styleId, colorName, sizeName, qty }
 * This function sums quantities across all colors for a given size.
 */
export async function getInventory(
  styleId: string
): Promise<Record<string, number>> {
  if (!credentialsPresent()) {
    console.warn(
      `[ssactivewear] Credentials not configured — returning mock inventory for style ${styleId}`
    )
    return buildMockInventory()
  }

  try {
    const raw = await ssApiFetch<Array<{ sizeName: string; qty: number }>>(
      `/inventory/${styleId}/?mediaType=json`
    )
    // Sum quantities per size across all colors
    const totals: Record<string, number> = {}
    for (const row of raw) {
      totals[row.sizeName] = (totals[row.sizeName] ?? 0) + (row.qty ?? 0)
    }
    return totals
  } catch (err) {
    console.error(`[ssactivewear] getInventory(${styleId}) failed:`, err)
    return buildMockInventory()
  }
}

/**
 * Places an order via POST /orders/
 *
 * Real request body: { poNumber, shipMethod, shipTo, lines: [{ sku, qty }] }
 * Success response includes: { orderNumber, status, lines[] }
 */
export async function placeOrder(
  orderData: SSOrderData
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (!credentialsPresent()) {
    console.warn('[ssactivewear] Credentials not configured — simulating order placement')
    console.log('[ssactivewear] MOCK ORDER:', JSON.stringify(orderData, null, 2))
    return {
      success: true,
      orderId: `MOCK-SS-${Date.now()}`,
    }
  }

  const body = {
    poNumber: orderData.poNumber,
    shipMethod: orderData.shipMethod,
    shipTo: {
      company: orderData.shipTo.company ?? '',
      firstName: orderData.shipTo.firstName,
      lastName: orderData.shipTo.lastName,
      address1: orderData.shipTo.address1,
      address2: orderData.shipTo.address2 ?? '',
      city: orderData.shipTo.city,
      state: orderData.shipTo.state,
      zip: orderData.shipTo.zip,
      country: orderData.shipTo.country,
      phone: orderData.shipTo.phone ?? '',
      email: orderData.shipTo.email ?? '',
    },
    lines: orderData.lines.map((line) => ({
      sku: line.sku,
      qty: line.quantity,
    })),
    comments: orderData.comments ?? '',
  }

  try {
    const result = await ssApiFetch<{ orderNumber: string; status: string }>(
      '/orders/?mediaType=json',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )
    return { success: true, orderId: result.orderNumber }
  } catch (err: any) {
    console.error('[ssactivewear] placeOrder failed:', err)
    return { success: false, error: err.message ?? 'Unknown error' }
  }
}
