/**
 * POST /api/admin/sanmar-sync
 *
 * Triggers a SanMar SFTP sync inline and returns counts of products
 * created/updated/failed.
 *
 * Protected by ADMIN_SECRET header:
 *   Authorization: Bearer <ADMIN_SECRET>
 *
 * Required env vars:
 *   ADMIN_SECRET          – shared secret for route protection
 *   SANMAR_SFTP_HOST      – e.g. ftp.sanmar.com
 *   SANMAR_SFTP_PORT      – e.g. 2200
 *   SANMAR_SFTP_USER      – SanMar customer number
 *   SANMAR_SFTP_PASSWORD  – SFTP password
 *   DATABASE_URL          – Prisma DB URL
 */

import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import prisma from '@/lib/prisma'
import { parse } from 'csv-parse'

// ─── AUTH ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    // If no secret is configured, block all requests — fail safe.
    return false
  }
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  return token === adminSecret
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
  NET_PRICE?: string
  PIECE_PRICE?: string
  DESCRIPTION?: string
  PRODUCT_IMAGE_URL?: string
  COLOR_SWATCH_URL?: string
  FRONT_MODEL_IMAGE_URL?: string
  [key: string]: string | undefined
}

interface InventoryRow {
  STYLE?: string
  COLOR_NAME?: string
  SIZE?: string
  QTY?: string
  INVENTORY_KEY?: string
  [key: string]: string | undefined
}

interface PricingRow {
  STYLE?: string
  SIZE?: string
  NET_PRICE?: string
  PIECE_PRICE?: string
  [key: string]: string | undefined
}

interface AggregatedProduct {
  styleNumber: string
  name: string
  brand: string
  category: string
  description: string
  priceBase: number
  colors: Array<{
    name: string
    hex: string
    code: string
    swatchUrl: string
    images: Record<string, string>
  }>
  sizes: string[]
  inventory: Record<string, number>
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function syncLog(msg: string) {
  console.log(`[sanmar-sync-api] ${new Date().toISOString()} ${msg}`)
}

function syncWarn(msg: string) {
  console.warn(`[sanmar-sync-api][WARN] ${new Date().toISOString()} ${msg}`)
}

async function parseCsvFile<T extends Record<string, string | undefined>>(
  filePath: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = []
    const raw = fs.readFileSync(filePath, 'utf8')
    const firstLine = raw.split('\n')[0] || ''
    const delimiter =
      (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t' : ','

    const parser = parse(raw, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })

    parser.on('data', (row: T) => rows.push(row))
    parser.on('error', (err) =>
      reject(new Error(`CSV parse error in ${filePath}: ${err.message}`))
    )
    parser.on('end', () => resolve(rows))
  })
}

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

function mapCategory(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('hoodie') || s.includes('hooded')) return 'hoodie'
  if (s.includes('sweatshirt') || s.includes('fleece')) return 'sweatshirt'
  if (s.includes('polo')) return 'polo'
  if (s.includes('tank') || s.includes('muscle')) return 'tank'
  if (s.includes('long sleeve') || s.includes('ls ') || s.includes('long-sleeve'))
    return 'longsleeve'
  if (s.includes('hat') || s.includes('cap') || s.includes('beanie')) return 'hat'
  if (s.includes('bag') || s.includes('tote') || s.includes('backpack')) return 'bag'
  return 'tshirt'
}

function deriveSku(style: string): string {
  return `SANMAR-${style.trim().toUpperCase()}`
}

function inventoryKey(color: string, size: string): string {
  return `${color}-${size}`
}

function classifyFiles(files: string[]): {
  productFiles: string[]
  inventoryFiles: string[]
  pricingFiles: string[]
} {
  const productFiles: string[] = []
  const inventoryFiles: string[] = []
  const pricingFiles: string[] = []

  for (const f of files) {
    const name = path.basename(f).toUpperCase()
    if (name.includes('INVEN')) inventoryFiles.push(f)
    else if (name.includes('PRIC')) pricingFiles.push(f)
    else if (
      name.includes('PRODUCT') ||
      name.includes('LINELIST') ||
      name.includes('CATALOG') ||
      name.includes('STYLE')
    )
      productFiles.push(f)
    // Files that don't match any classifier are treated as product files
    else productFiles.push(f)
  }

  return { productFiles, inventoryFiles, pricingFiles }
}

// ─── SFTP DOWNLOAD ────────────────────────────────────────────────────────────

const KNOWN_FILES = [
  'sanmar_PRODUCT_LINELIST.txt',
  'product_data.csv',
  'sanmar_product.csv',
  'product_linelist.txt',
  'sanmar_INVENTORY.txt',
  'inventory.csv',
  'sanmar_inventory.csv',
  'sanmar_PRICING.txt',
  'pricing.csv',
  'sanmar_pricing.csv',
]

async function downloadFiles(tempDir: string): Promise<string[]> {
  // Dynamic import — ssh2-sftp-client is a devDependency and should only run
  // in non-edge (Node.js) runtime, which route handlers use by default.
  const SftpClient = (await import('ssh2-sftp-client')).default

  const sftp = new SftpClient()
  const downloaded: string[] = []

  const host = process.env.SANMAR_SFTP_HOST || 'ftp.sanmar.com'
  const port = parseInt(process.env.SANMAR_SFTP_PORT || '2200', 10)
  const username = process.env.SANMAR_SFTP_USER || ''
  const password = process.env.SANMAR_SFTP_PASSWORD || ''

  syncLog(`Connecting to SFTP ${host}:${port} as ${username}`)
  await sftp.connect({
    host,
    port,
    username,
    password,
    readyTimeout: 30_000,
    retries: 2,
    retry_factor: 2,
    retry_minTimeout: 2_000,
  })

  syncLog('SFTP connected — listing root directory')
  let listing: Array<{ name: string; type: string; size?: number }> = []
  try {
    listing = await sftp.list('/')
  } catch (err) {
    syncWarn(`Could not list root; trying cwd. Error: ${(err as Error).message}`)
    listing = await sftp.list('.')
  }

  syncLog(`Remote files found (${listing.length}):`)
  for (const f of listing) {
    syncLog(`  ${f.type === 'd' ? '[DIR]' : '     '} ${f.name} (${f.size ?? '?'} bytes)`)
  }

  const remoteNames = new Set<string>([
    ...KNOWN_FILES,
    ...listing
      .filter((f) => f.type !== 'd' && /\.(csv|txt)$/i.test(f.name))
      .map((f) => f.name),
  ])

  for (const name of remoteNames) {
    const remotePath = `/${name}`
    const localPath = path.join(tempDir, name)
    const exists = listing.some((f) => f.name === name)
    if (!exists) continue

    try {
      syncLog(`  Downloading ${name}…`)
      await sftp.fastGet(remotePath, localPath)
      const size = fs.statSync(localPath).size
      syncLog(`  Downloaded ${name} (${size} bytes)`)
      downloaded.push(localPath)
    } catch (err) {
      syncWarn(`  Failed to download ${name}: ${(err as Error).message}`)
    }
  }

  await sftp.end()
  syncLog('SFTP connection closed')
  return downloaded
}

// ─── PARSE & AGGREGATE ────────────────────────────────────────────────────────

async function buildProductMap(
  productFiles: string[],
  inventoryFiles: string[],
  pricingFiles: string[]
): Promise<Map<string, AggregatedProduct>> {
  const products = new Map<string, AggregatedProduct>()

  for (const file of productFiles) {
    syncLog(`Parsing product file: ${path.basename(file)}`)
    let rows: ProductRow[]
    try {
      rows = await parseCsvFile<ProductRow>(file)
    } catch (err) {
      syncWarn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    syncLog(`  ${rows.length} rows`)
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

      if (size && !product.sizes.includes(size)) {
        product.sizes.push(size)
      }

      if (!product.priceBase) {
        const price = parseFloat(col(row, 'NET_PRICE', 'PIECE_PRICE', 'PRICE') || '0')
        if (price > 0) product.priceBase = price
      }
    }
  }

  for (const file of inventoryFiles) {
    syncLog(`Parsing inventory file: ${path.basename(file)}`)
    let rows: InventoryRow[]
    try {
      rows = await parseCsvFile<InventoryRow>(file)
    } catch (err) {
      syncWarn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    syncLog(`  ${rows.length} rows`)
    for (const row of rows) {
      const style = col(row, 'STYLE', 'STYLE_NUMBER', 'SKU')
      if (!style) continue

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

      const invKey = col(row, 'INVENTORY_KEY')
      if (invKey && qty >= 0) {
        product.inventory[invKey] = qty
      }
    }
  }

  for (const file of pricingFiles) {
    syncLog(`Parsing pricing file: ${path.basename(file)}`)
    let rows: PricingRow[]
    try {
      rows = await parseCsvFile<PricingRow>(file)
    } catch (err) {
      syncWarn(`  Parse failed: ${(err as Error).message}`)
      continue
    }

    syncLog(`  ${rows.length} rows`)
    for (const row of rows) {
      const style = col(row, 'STYLE', 'STYLE_NUMBER', 'SKU')
      if (!style || !products.has(style)) continue

      const product = products.get(style)!
      const price = parseFloat(col(row, 'NET_PRICE', 'PIECE_PRICE', 'PRICE') || '0')
      if (price > 0 && (product.priceBase === 0 || price < product.priceBase)) {
        product.priceBase = price
      }
    }
  }

  return products
}

// ─── PRISMA UPSERT ────────────────────────────────────────────────────────────

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'ONE SIZE', 'OSFA']

async function upsertProducts(
  products: Map<string, AggregatedProduct>
): Promise<{ created: number; updated: number; failed: number }> {
  let created = 0
  let updated = 0
  let failed = 0

  for (const [style, product] of products) {
    const sku = deriveSku(style)
    try {
      const existing = await prisma.product.findUnique({ where: { distributorSku: sku } })

      const sortedSizes = [...new Set(product.sizes)].sort((a, b) => {
        const ai = SIZE_ORDER.indexOf(a.toUpperCase())
        const bi = SIZE_ORDER.indexOf(b.toUpperCase())
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
      } else {
        await prisma.product.create({ data })
        created++
      }
    } catch (err) {
      syncWarn(`Failed to upsert ${style}: ${(err as Error).message}`)
      failed++
    }
  }

  return { created, updated, failed }
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  syncLog('=== SanMar sync triggered via API ===')

  if (!process.env.SANMAR_SFTP_USER || !process.env.SANMAR_SFTP_PASSWORD) {
    return NextResponse.json(
      { error: 'SANMAR_SFTP_USER and SANMAR_SFTP_PASSWORD env vars are required' },
      { status: 500 }
    )
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanmar-sync-'))
  syncLog(`Temp directory: ${tempDir}`)

  try {
    // ── Download ────────────────────────────────────────────────────────────
    let downloadedFiles: string[]
    try {
      downloadedFiles = await downloadFiles(tempDir)
    } catch (err) {
      syncWarn(`SFTP download failed: ${(err as Error).message}`)
      // Fall back to any files that partially downloaded
      downloadedFiles = fs
        .readdirSync(tempDir)
        .map((f) => path.join(tempDir, f))
        .filter((f) => fs.statSync(f).size > 0)
    }

    if (downloadedFiles.length === 0) {
      return NextResponse.json(
        { message: 'No files downloaded from SanMar — nothing to sync', created: 0, updated: 0, failed: 0 },
        { status: 200 }
      )
    }

    syncLog(`Downloaded ${downloadedFiles.length} file(s)`)

    // ── Classify ────────────────────────────────────────────────────────────
    const { productFiles, inventoryFiles, pricingFiles } = classifyFiles(downloadedFiles)

    // ── Parse & aggregate ───────────────────────────────────────────────────
    const productMap = await buildProductMap(productFiles, inventoryFiles, pricingFiles)
    syncLog(`Aggregated ${productMap.size} unique styles`)

    if (productMap.size === 0) {
      return NextResponse.json(
        { message: 'No products parsed — check file format', created: 0, updated: 0, failed: 0 },
        { status: 200 }
      )
    }

    // ── Upsert ──────────────────────────────────────────────────────────────
    const counts = await upsertProducts(productMap)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    syncLog(`=== API sync complete in ${elapsed}s — created: ${counts.created}, updated: ${counts.updated}, failed: ${counts.failed} ===`)

    return NextResponse.json({
      message: 'Sync complete',
      elapsed: `${elapsed}s`,
      stylesFound: productMap.size,
      ...counts,
    })
  } catch (err) {
    const message = (err as Error).message
    syncWarn(`Sync failed with error: ${message}`)
    return NextResponse.json({ error: 'Sync failed', detail: message }, { status: 500 })
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      syncWarn(`Could not clean temp directory: ${tempDir}`)
    }
  }
}
