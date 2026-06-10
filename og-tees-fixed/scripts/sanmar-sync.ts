/**
 * SanMar SFTP Sync Script
 *
 * Downloads product, inventory, and pricing files from SanMar's SFTP server
 * and upserts them into the Prisma database.
 *
 * Usage:
 *   npx ts-node scripts/sanmar-sync.ts
 *
 * Required env vars (see .env.local):
 *   SANMAR_SFTP_HOST     – e.g. ftp.sanmar.com
 *   SANMAR_SFTP_PORT     – e.g. 2200
 *   SANMAR_SFTP_USER     – customer number
 *   SANMAR_SFTP_PASSWORD – SFTP password
 *   DATABASE_URL         – Prisma DB URL (e.g. file:./dev.db)
 */

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import SftpClient from 'ssh2-sftp-client'
import { parse } from 'csv-parse'
import { PrismaClient } from '@prisma/client'

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SFTP_HOST = process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com'
const SFTP_PORT = parseInt(process.env.SANMAR_SFTP_PORT || '2200', 10)
const SFTP_USER = process.env.SANMAR_SFTP_USER || ''
const SFTP_PASSWORD = process.env.SANMAR_SFTP_PASSWORD || ''

// SanMar FTP filenames — built defensively to handle either naming convention.
// The server may use any subset of these; missing files are skipped gracefully.
const KNOWN_FILES = [
  // Product catalog (style/color/size descriptors)
  'sanmar_PRODUCT_LINELIST.txt',
  'product_data.csv',
  'sanmar_product.csv',
  'product_linelist.txt',
  // Inventory
  'sanmar_INVENTORY.txt',
  'inventory.csv',
  'sanmar_inventory.csv',
  // Pricing
  'sanmar_PRICING.txt',
  'pricing.csv',
  'sanmar_pricing.csv',
]

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Raw row as it arrives from the product linelist CSV */
interface ProductRow {
  STYLE?: string
  PRODUCT_TITLE?: string
  BRAND_NAME?: string
  CATEGORY_NAME?: string
  COLOR_NAME?: string
  COLOR_CODE?: string
  COLOR_HEX?: string
  SIZE?: string
  INVENTORY_KEY?: string
  GTIN?: string
  CASE_SIZE?: string
  NET_PRICE?: string
  PIECE_PRICE?: string
  RETAIL_PRICE?: string
  DESCRIPTION?: string
  PRODUCT_IMAGE_URL?: string
  COLOR_SWATCH_URL?: string
  FRONT_MODEL_IMAGE_URL?: string
  // Handle alternate column-name conventions
  [key: string]: string | undefined
}

/** Raw row from the inventory file */
interface InventoryRow {
  STYLE?: string
  COLOR_NAME?: string
  COLOR_CODE?: string
  SIZE?: string
  QTY?: string
  INVENTORY_KEY?: string
  [key: string]: string | undefined
}

/** Raw row from the pricing file */
interface PricingRow {
  STYLE?: string
  SIZE?: string
  NET_PRICE?: string
  PIECE_PRICE?: string
  RETAIL_PRICE?: string
  [key: string]: string | undefined
}

/** Aggregated product data assembled from all three feed files */
interface AggregatedProduct {
  styleNumber: string
  name: string
  brand: string
  category: string
  description: string
  priceBase: number
  colors: Array<{ name: string; hex: string; code: string; swatchUrl: string; images: Record<string, string> }>
  sizes: string[]
  inventory: Record<string, number>
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[sanmar-sync] ${new Date().toISOString()} ${msg}`)
}

function warn(msg: string) {
  console.warn(`[sanmar-sync][WARN] ${new Date().toISOString()} ${msg}`)
}

/** Parse a CSV/TSV file from disk, auto-detecting delimiter. Returns array of row objects. */
async function parseCsvFile<T extends Record<string, string | undefined>>(
  filePath: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = []
    const raw = fs.readFileSync(filePath, 'utf8')

    // Auto-detect delimiter: if the first line has more tabs than commas, it's TSV
    const firstLine = raw.split('\n')[0] || ''
    const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t' : ','

    const parser = parse(raw, {
      delimiter,
      columns: true,        // Use first row as header keys
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })

    parser.on('data', (row: T) => rows.push(row))
    parser.on('error', (err) => reject(new Error(`CSV parse error in ${filePath}: ${err.message}`)))
    parser.on('end', () => resolve(rows))
  })
}

/** Normalise a column key — SanMar sometimes ships mixed-case or space-padded headers */
function col(row: Record<string, string | undefined>, ...candidates: string[]): string {
  for (const key of candidates) {
    const found = Object.keys(row).find(
      (k) => k.trim().toUpperCase() === key.toUpperCase()
    )
    if (found !== undefined && row[found] !== undefined && row[found] !== '') {
      return row[found]!.trim()
    }
  }
  return ''
}

/** Map SanMar CATEGORY_NAME to the Product model's category enum */
function mapCategory(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('hoodie') || s.includes('hooded')) return 'hoodie'
  if (s.includes('sweatshirt') || s.includes('fleece')) return 'sweatshirt'
  if (s.includes('polo')) return 'polo'
  if (s.includes('tank') || s.includes('muscle')) return 'tank'
  if (s.includes('long sleeve') || s.includes('ls ') || s.includes('long-sleeve')) return 'longsleeve'
  if (s.includes('hat') || s.includes('cap') || s.includes('beanie')) return 'hat'
  if (s.includes('bag') || s.includes('tote') || s.includes('backpack')) return 'bag'
  return 'tshirt'  // sensible default for apparel
}

/** Derive a SKU that is unique per style (not per color/size row) */
function deriveSku(style: string): string {
  return `SANMAR-${style.trim().toUpperCase()}`
}

/** Build an inventory key in the same format used by the app: "ColorName-SIZE" */
function inventoryKey(color: string, size: string): string {
  return `${color}-${size}`
}

// ─── SFTP DOWNLOAD ────────────────────────────────────────────────────────────

async function downloadFiles(tempDir: string): Promise<string[]> {
  const sftp = new SftpClient()
  const downloaded: string[] = []

  log(`Connecting to SFTP ${SFTP_HOST}:${SFTP_PORT} as ${SFTP_USER}`)
  await sftp.connect({
    host: SFTP_HOST,
    port: SFTP_PORT,
    username: SFTP_USER,
    password: SFTP_PASSWORD,
    // Be generous with timeouts — large files can take a while
    readyTimeout: 30_000,
    retries: 2,
    retry_factor: 2,
    retry_minTimeout: 2_000,
  })

  log('SFTP connected — listing root directory')
  let listing: Array<{ name: string; type: string; size?: number }> = []
  try {
    listing = await sftp.list('/')
  } catch (err) {
    warn(`Could not list root; trying cwd. Error: ${(err as Error).message}`)
    listing = await sftp.list('.')
  }

  log(`Remote files found (${listing.length}):`)
  for (const f of listing) {
    log(`  ${f.type === 'd' ? '[DIR]' : '     '} ${f.name} (${f.size ?? '?'} bytes)`)
  }

  // Collect candidate remote filenames: known files + any .txt/.csv in root
  const remoteNames = new Set<string>([
    ...KNOWN_FILES,
    ...listing
      .filter((f) => f.type !== 'd' && /\.(csv|txt)$/i.test(f.name))
      .map((f) => f.name),
  ])

  for (const name of remoteNames) {
    const remotePath = `/${name}`
    const localPath = path.join(tempDir, name)

    // Only try to download files we can see in the listing
    const exists = listing.some((f) => f.name === name)
    if (!exists) {
      log(`  Skipping ${name} — not found on server`)
      continue
    }

    try {
      log(`  Downloading ${name}…`)
      await sftp.fastGet(remotePath, localPath)
      const size = fs.statSync(localPath).size
      log(`  Downloaded ${name} (${size} bytes)`)
      downloaded.push(localPath)
    } catch (err) {
      warn(`  Failed to download ${name}: ${(err as Error).message}`)
    }
  }

  await sftp.end()
  log('SFTP connection closed')
  return downloaded
}

// ─── PARSE & AGGREGATE ────────────────────────────────────────────────────────

async function buildProductMap(
  productFiles: string[],
  inventoryFiles: string[],
  pricingFiles: string[]
): Promise<Map<string, AggregatedProduct>> {
  const products = new Map<string, AggregatedProduct>()

  // ── 1. Product linelist ──────────────────────────────────────────────────
  for (const file of productFiles) {
    log(`Parsing product file: ${path.basename(file)}`)
    let rows: ProductRow[]
    try {
      rows = await parseCsvFile<ProductRow>(file)
    } catch (err) {
      warn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    log(`  ${rows.length} rows`)
    for (const row of rows) {
      const style = col(row, 'STYLE', 'STYLE_NUMBER', 'STYLE_NO', 'SKU')
      if (!style) continue

      const colorName = col(row, 'COLOR_NAME', 'COLOR')
      const colorCode = col(row, 'COLOR_CODE', 'COLOR_CD')
      const size = col(row, 'SIZE', 'SIZE_NAME')
      const imageUrl = col(row, 'PRODUCT_IMAGE_URL', 'IMAGE_URL', 'FRONT_IMAGE')
      const swatchUrl = col(row, 'COLOR_SWATCH_URL', 'SWATCH_URL', 'COLOR_IMAGE_URL')
      const modelImageUrl = col(row, 'FRONT_MODEL_IMAGE_URL', 'MODEL_IMAGE_URL')

      if (!products.has(style)) {
        products.set(style, {
          styleNumber: style,
          name: col(row, 'PRODUCT_TITLE', 'PRODUCT_NAME', 'NAME', 'TITLE'),
          brand: col(row, 'BRAND_NAME', 'BRAND'),
          category: mapCategory(col(row, 'CATEGORY_NAME', 'CATEGORY')),
          description: col(row, 'DESCRIPTION', 'PRODUCT_DESCRIPTION'),
          priceBase: parseFloat(col(row, 'NET_PRICE', 'PIECE_PRICE', 'PRICE') || '0') || 0,
          colors: [],
          sizes: [],
          inventory: {},
        })
      }

      const product = products.get(style)!

      // Merge color entry (deduplicate by name)
      if (colorName && !product.colors.find((c) => c.name === colorName)) {
        product.colors.push({
          name: colorName,
          hex: col(row, 'COLOR_HEX', 'HEX_CODE') || '#888888',
          code: colorCode,
          swatchUrl: swatchUrl,
          images: {
            front: imageUrl || modelImageUrl || '',
            back: '',
          },
        })
      }

      // Merge size (deduplicate)
      if (size && !product.sizes.includes(size)) {
        product.sizes.push(size)
      }

      // Capture price if not yet set
      if (!product.priceBase) {
        const price = parseFloat(col(row, 'NET_PRICE', 'PIECE_PRICE', 'PRICE') || '0')
        if (price > 0) product.priceBase = price
      }
    }
  }

  // ── 2. Inventory ─────────────────────────────────────────────────────────
  for (const file of inventoryFiles) {
    log(`Parsing inventory file: ${path.basename(file)}`)
    let rows: InventoryRow[]
    try {
      rows = await parseCsvFile<InventoryRow>(file)
    } catch (err) {
      warn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    log(`  ${rows.length} rows`)
    for (const row of rows) {
      const style = col(row, 'STYLE', 'STYLE_NUMBER', 'SKU')
      if (!style) continue

      // Ensure product stub exists even if no product linelist was present
      if (!products.has(style)) {
        products.set(style, {
          styleNumber: style,
          name: style,
          brand: 'SanMar',
          category: 'tshirt',
          description: '',
          priceBase: 0,
          colors: [],
          sizes: [],
          inventory: {},
        })
      }

      const product = products.get(style)!
      const colorName = col(row, 'COLOR_NAME', 'COLOR')
      const size = col(row, 'SIZE', 'SIZE_NAME')
      const qty = parseInt(col(row, 'QTY', 'QUANTITY', 'AVAILABLE_QTY') || '0', 10) || 0

      if (colorName && size) {
        product.inventory[inventoryKey(colorName, size)] = qty
      }

      // Also use INVENTORY_KEY format if present: typically "STYLE-COLORCODE-SIZE"
      const invKey = col(row, 'INVENTORY_KEY')
      if (invKey && colorName && size) {
        // Store under both key formats for compatibility
        product.inventory[invKey] = qty
      }
    }
  }

  // ── 3. Pricing ───────────────────────────────────────────────────────────
  for (const file of pricingFiles) {
    log(`Parsing pricing file: ${path.basename(file)}`)
    let rows: PricingRow[]
    try {
      rows = await parseCsvFile<PricingRow>(file)
    } catch (err) {
      warn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    log(`  ${rows.length} rows`)
    for (const row of rows) {
      const style = col(row, 'STYLE', 'STYLE_NUMBER', 'SKU')
      if (!style) continue

      if (!products.has(style)) continue  // skip prices for unknown styles

      const product = products.get(style)!

      // Use the lowest net/piece price as the base price
      const price = parseFloat(col(row, 'NET_PRICE', 'PIECE_PRICE', 'PRICE') || '0')
      if (price > 0 && (product.priceBase === 0 || price < product.priceBase)) {
        product.priceBase = price
      }
    }
  }

  return products
}

// ─── PRISMA UPSERT ────────────────────────────────────────────────────────────

async function upsertProducts(
  products: Map<string, AggregatedProduct>,
  prisma: PrismaClient
): Promise<{ created: number; updated: number; failed: number }> {
  let created = 0
  let updated = 0
  let failed = 0

  for (const [style, product] of products) {
    const sku = deriveSku(style)
    try {
      const existing = await prisma.product.findUnique({ where: { distributorSku: sku } })

      // Sort sizes in a sensible order (S, M, L, XL, 2XL, …)
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'ONE SIZE', 'OSFA']
      const sortedSizes = [...new Set(product.sizes)].sort((a, b) => {
        const ai = sizeOrder.indexOf(a.toUpperCase())
        const bi = sizeOrder.indexOf(b.toUpperCase())
        if (ai === -1 && bi === -1) return a.localeCompare(b)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })

      const data = {
        distributorSku: sku,
        distributor: 'sanmar',
        brand: product.brand || 'SanMar',
        name: product.name || style,
        styleNumber: style,
        description: product.description || '',
        colors: JSON.stringify(product.colors),
        sizes: JSON.stringify(sortedSizes),
        priceBase: product.priceBase,
        images: JSON.stringify(
          product.colors.length > 0 ? product.colors[0].images : { front: '', back: '' }
        ),
        category: product.category,
        inventory: JSON.stringify(product.inventory),
      }

      if (existing) {
        await prisma.product.update({ where: { distributorSku: sku }, data })
        updated++
        if (updated % 50 === 0) log(`  Updated ${updated} products so far…`)
      } else {
        await prisma.product.create({ data })
        created++
        if (created % 50 === 0) log(`  Created ${created} products so far…`)
      }
    } catch (err) {
      warn(`  Failed to upsert ${style}: ${(err as Error).message}`)
      failed++
    }
  }

  return { created, updated, failed }
}

// ─── CLASSIFY FILES ───────────────────────────────────────────────────────────

function classifyFiles(files: string[]): {
  productFiles: string[]
  inventoryFiles: string[]
  pricingFiles: string[]
  otherFiles: string[]
} {
  const productFiles: string[] = []
  const inventoryFiles: string[] = []
  const pricingFiles: string[] = []
  const otherFiles: string[] = []

  for (const f of files) {
    const name = path.basename(f).toUpperCase()
    if (name.includes('INVEN')) inventoryFiles.push(f)
    else if (name.includes('PRIC')) pricingFiles.push(f)
    else if (
      name.includes('PRODUCT') ||
      name.includes('LINELIST') ||
      name.includes('CATALOG') ||
      name.includes('STYLE')
    ) productFiles.push(f)
    else otherFiles.push(f)
  }

  return { productFiles, inventoryFiles, pricingFiles, otherFiles }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()
  log('=== SanMar SFTP Sync starting ===')

  if (!SFTP_USER || !SFTP_PASSWORD) {
    throw new Error(
      'Missing SANMAR_SFTP_USER or SANMAR_SFTP_PASSWORD environment variables. ' +
      'Check your .env.local file.'
    )
  }

  // Create a temp directory to stage downloaded files
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanmar-sync-'))
  log(`Temp directory: ${tempDir}`)

  const prisma = new PrismaClient()

  try {
    // ── Step 1: Download files via SFTP ────────────────────────────────────
    let downloadedFiles: string[]
    try {
      downloadedFiles = await downloadFiles(tempDir)
    } catch (err) {
      warn(`SFTP download failed: ${(err as Error).message}`)
      warn('Continuing with any files that were partially downloaded…')
      downloadedFiles = fs
        .readdirSync(tempDir)
        .map((f) => path.join(tempDir, f))
        .filter((f) => fs.statSync(f).size > 0)
    }

    if (downloadedFiles.length === 0) {
      log('No files downloaded — nothing to sync.')
      return
    }

    log(`Downloaded ${downloadedFiles.length} file(s): ${downloadedFiles.map((f) => path.basename(f)).join(', ')}`)

    // ── Step 2: Classify files by type ─────────────────────────────────────
    const { productFiles, inventoryFiles, pricingFiles, otherFiles } = classifyFiles(downloadedFiles)

    log(`File classification:`)
    log(`  Product:   ${productFiles.map((f) => path.basename(f)).join(', ') || '(none)'}`)
    log(`  Inventory: ${inventoryFiles.map((f) => path.basename(f)).join(', ') || '(none)'}`)
    log(`  Pricing:   ${pricingFiles.map((f) => path.basename(f)).join(', ') || '(none)'}`)
    if (otherFiles.length) log(`  Other:     ${otherFiles.map((f) => path.basename(f)).join(', ')}`)

    // ── Step 3: Parse & aggregate data ─────────────────────────────────────
    const productMap = await buildProductMap(productFiles, inventoryFiles, pricingFiles)
    log(`Aggregated ${productMap.size} unique styles from SanMar feed`)

    if (productMap.size === 0) {
      log('No products parsed — verify file format and column headers.')
      return
    }

    // ── Step 4: Upsert into Prisma ─────────────────────────────────────────
    log('Upserting products into database…')
    const counts = await upsertProducts(productMap, prisma)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    log(`=== Sync complete in ${elapsed}s ===`)
    log(`  Created: ${counts.created}`)
    log(`  Updated: ${counts.updated}`)
    log(`  Failed:  ${counts.failed}`)
  } finally {
    await prisma.$disconnect()
    // Clean up temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
      log(`Cleaned up temp directory: ${tempDir}`)
    } catch {
      warn(`Could not clean temp directory: ${tempDir}`)
    }
  }
}

main().catch((err) => {
  console.error('[sanmar-sync] Fatal error:', err)
  process.exit(1)
})
