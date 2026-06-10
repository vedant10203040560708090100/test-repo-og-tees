/**
 * SanMar API Client
 *
 * SanMar's web services are SOAP-based. Production endpoints:
 *   - WSDL (Product):   https://www.sanmar.com/wsTest/SanMarProductService?wsdl
 *   - WSDL (Inventory): https://www.sanmar.com/wsTest/SanMarWebService?wsdl
 *   - WSDL (Order):     https://www.sanmar.com/wsTest/SanMarPurchaseOrderService?wsdl
 *
 * Authentication uses a soap:Header with:
 *   <ns:sanmarUserName>YOUR_USERNAME</ns:sanmarUserName>
 *   <ns:sanmarPassword>YOUR_PASSWORD</ns:sanmarPassword>
 *   <ns:sanmarCustomerNumber>YOUR_CUSTOMER_NUMBER</ns:sanmarCustomerNumber>
 *
 * Required env vars:
 *   SANMAR_USERNAME, SANMAR_PASSWORD, SANMAR_CUSTOMER_NUMBER
 *
 * This file returns mock data when credentials are absent so the app runs
 * in development without a SanMar account.
 */

const SANMAR_USERNAME = process.env.SANMAR_USERNAME
const SANMAR_PASSWORD = process.env.SANMAR_PASSWORD
const SANMAR_CUSTOMER_NUMBER = process.env.SANMAR_CUSTOMER_NUMBER

function credentialsPresent(): boolean {
  return !!(SANMAR_USERNAME && SANMAR_PASSWORD && SANMAR_CUSTOMER_NUMBER)
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SanmarSize {
  sizeIndex: string
  sizeName: string
  gtin: string
  caseQty: number
}

export interface SanmarColor {
  colorName: string
  colorSquareImage: string
  productImage: string
  colorSwatchImage: string
}

export interface SanmarProduct {
  styleNumber: string
  productTitle: string
  brandName: string
  categoryName: string
  description: string
  sizes: SanmarSize[]
  colors: SanmarColor[]
  retailPrice: number
  casePrice: number
  piecePrice: number
  weight: number
  countryOfOrigin: string
}

export interface SanmarOrderLine {
  styleNumber: string
  colorName: string
  sizeName: string
  quantity: number
}

export interface SanmarOrderData {
  purchaseOrderNumber: string
  shipToName: string
  shipToAddress1: string
  shipToAddress2?: string
  shipToCity: string
  shipToState: string
  shipToZip: string
  shipToCountry: string
  shipMethod: 'Ground' | '2Day' | 'Overnight'
  lines: SanmarOrderLine[]
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']

function buildMockInventory(): Record<string, number> {
  const inv: Record<string, number> = {}
  for (const size of MOCK_SIZES) {
    inv[size] = Math.floor(Math.random() * 300) + 20
  }
  return inv
}

const MOCK_PRODUCT: SanmarProduct = {
  styleNumber: 'G500',
  productTitle: 'Heavy Cotton T-Shirt',
  brandName: 'Gildan',
  categoryName: 'T-Shirts',
  description: 'Mock SanMar product returned because credentials are not configured.',
  sizes: MOCK_SIZES.map((s, i) => ({ sizeIndex: String(i), sizeName: s, gtin: `0000000000${i}`, caseQty: 12 })),
  colors: [
    { colorName: 'White', colorSquareImage: '', productImage: '', colorSwatchImage: '' },
    { colorName: 'Black', colorSquareImage: '', productImage: '', colorSwatchImage: '' },
    { colorName: 'Navy', colorSquareImage: '', productImage: '', colorSwatchImage: '' },
  ],
  retailPrice: 9.99,
  casePrice: 3.25,
  piecePrice: 3.25,
  weight: 0.35,
  countryOfOrigin: 'Honduras',
}

// ─── API CLIENT ────────────────────────────────────────────────────────────────

/**
 * Returns live inventory from SanMar's SanMarWebService > getInventoryLevels
 * SOAP operation. Falls back to mock data when credentials are absent.
 *
 * Real SOAP body example:
 *   <getInventoryLevels>
 *     <arg0>
 *       <style>G500</style>
 *       <color>Black</color>
 *     </arg0>
 *   </getInventoryLevels>
 */
export async function getProductInventory(
  styleNumber: string,
  color: string
): Promise<Record<string, number>> {
  if (!credentialsPresent()) {
    console.warn(
      `[sanmar] Credentials not configured — returning mock inventory for ${styleNumber}/${color}`
    )
    return buildMockInventory()
  }

  // Real implementation would use a SOAP client such as `soap` (npm) or raw XML fetch:
  // const soapBody = `...getInventoryLevels XML...`
  // const response = await fetch(INVENTORY_WSDL_URL, { method: 'POST', body: soapBody, headers: {...} })
  // return parseInventoryResponse(await response.text())

  throw new Error(
    '[sanmar] getProductInventory: Real SOAP integration not yet implemented. ' +
    'Install the `soap` npm package and parse getInventoryLevels response.'
  )
}

/**
 * Fetches product details from SanMar's SanMarProductService > getProductInfoByStyle.
 *
 * Real SOAP operation: getProductInfoByStyle
 *   Input: <style>G500</style>
 */
export async function getProductDetails(
  styleNumber: string
): Promise<SanmarProduct | null> {
  if (!credentialsPresent()) {
    console.warn(
      `[sanmar] Credentials not configured — returning mock product for style ${styleNumber}`
    )
    return { ...MOCK_PRODUCT, styleNumber }
  }

  // Real implementation:
  // const client = await soap.createClientAsync(PRODUCT_WSDL_URL)
  // const result = await client.getProductInfoByStyleAsync({ style: styleNumber, ...credentials })
  // return mapSanmarProduct(result)

  throw new Error(
    '[sanmar] getProductDetails: Real SOAP integration not yet implemented.'
  )
}

/**
 * Places a purchase order via SanMar's SanMarPurchaseOrderService > submitPORequest.
 *
 * Real SOAP operation: submitPORequest
 * Returns SanMar's internal order ID on success.
 */
export async function placeOrder(
  orderData: SanmarOrderData
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (!credentialsPresent()) {
    console.warn('[sanmar] Credentials not configured — simulating order placement')
    console.log('[sanmar] MOCK ORDER:', JSON.stringify(orderData, null, 2))
    return {
      success: true,
      orderId: `MOCK-SM-${Date.now()}`,
    }
  }

  // Real implementation:
  // const client = await soap.createClientAsync(PO_WSDL_URL)
  // try {
  //   const result = await client.submitPORequestAsync(mapOrderToSoap(orderData))
  //   return { success: true, orderId: result.poNumber }
  // } catch (err: any) {
  //   return { success: false, error: err.message }
  // }

  throw new Error(
    '[sanmar] placeOrder: Real SOAP integration not yet implemented.'
  )
}
