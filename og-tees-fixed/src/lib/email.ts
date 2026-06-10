import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'orders@og-tees.com'
const FROM_NAME = 'OG Tees'
const ADMIN_EMAIL = 'kyle@og-tees.com'

// ─── HTML HELPERS ──────────────────────────────────────────────────────────

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1A1A1A;padding:28px 40px;text-align:center;">
              <span style="font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:2px;">OG TEES</span>
              <br/>
              <span style="font-size:12px;color:#AAAAAA;letter-spacing:3px;text-transform:uppercase;">Screen Printing Studio</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F9F9F9;padding:24px 40px;border-top:1px solid #EEEEEE;text-align:center;">
              <p style="margin:0;font-size:13px;color:#888888;">Questions? Reply to this email or contact us at <a href="mailto:kyle@og-tees.com" style="color:#E86E2C;">kyle@og-tees.com</a></p>
              <p style="margin:8px 0 0;font-size:12px;color:#AAAAAA;">&copy; ${new Date().getFullYear()} OG Tees. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatAddress(addr: {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
}): string {
  const lines = [addr.name, addr.line1]
  if (addr.line2) lines.push(addr.line2)
  lines.push(`${addr.city}, ${addr.state} ${addr.zip}`)
  lines.push(addr.country)
  return lines.join('<br/>')
}

function buildItemRows(items: any[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #EEEEEE;">
          <strong style="font-size:14px;color:#1A1A1A;">${item.product?.name ?? item.name}</strong>
          <br/>
          <span style="font-size:13px;color:#666666;">${item.color} / ${item.size} &mdash; Qty: ${item.quantity}</span>
          ${item.designPreviewUrl ? `<br/><span style="font-size:12px;color:#E86E2C;">Custom design included</span>` : ''}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #EEEEEE;text-align:right;vertical-align:top;">
          <span style="font-size:14px;color:#1A1A1A;">${formatCurrency((item.unitPrice + item.printPrice) * item.quantity)}</span>
          <br/>
          <span style="font-size:12px;color:#888888;">${formatCurrency(item.unitPrice + item.printPrice)} ea.</span>
        </td>
      </tr>`
    )
    .join('')
}

// ─── CUSTOMER ORDER CONFIRMATION ─────────────────────────────────────────────

export async function sendOrderConfirmationEmail(order: any): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set — skipping order confirmation email')
    return
  }

  const itemRows = buildItemRows(order.items ?? [])

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1A1A1A;">Order Confirmed!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#555555;">
      Hi ${order.customerName}, thanks for your order! We'll start production soon and keep you updated every step of the way.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F9F9;border-radius:6px;padding:20px;margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1A1A1A;">#${order.orderNumber}</p>
        </td>
        <td align="right">
          <p style="margin:0;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Status</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#E86E2C;text-transform:capitalize;">${order.status?.replace(/_/g, ' ') ?? 'Pending'}</p>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 16px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #EEEEEE;padding-bottom:8px;">Your Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#666666;">Subtotal</td>
        <td style="padding:6px 0;font-size:14px;color:#1A1A1A;text-align:right;">${formatCurrency(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#666666;">Shipping</td>
        <td style="padding:6px 0;font-size:14px;color:#1A1A1A;text-align:right;">${formatCurrency(order.shipping)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#666666;">Tax</td>
        <td style="padding:6px 0;font-size:14px;color:#1A1A1A;text-align:right;">${formatCurrency(order.tax)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0 0;font-size:17px;font-weight:700;color:#1A1A1A;border-top:2px solid #EEEEEE;">Total</td>
        <td style="padding:10px 0 0;font-size:17px;font-weight:700;color:#1A1A1A;text-align:right;border-top:2px solid #EEEEEE;">${formatCurrency(order.total)}</td>
      </tr>
    </table>

    <div style="margin-top:32px;padding:20px;background-color:#F9F9F9;border-radius:6px;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Shipping To</h3>
      <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">${formatAddress(order.shippingAddress)}</p>
    </div>

    <p style="margin:32px 0 0;font-size:14px;color:#888888;text-align:center;">
      Estimated production time: <strong style="color:#1A1A1A;">5–7 business days</strong>
    </p>`

  const msg = {
    to: order.customerEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Order Confirmed — #${order.orderNumber} | OG Tees`,
    html: emailWrapper(`Order #${order.orderNumber} Confirmed`, body),
  }

  try {
    await sgMail.send(msg)
    console.log(`[email] Order confirmation sent to ${order.customerEmail}`)
  } catch (err: any) {
    console.error('[email] Failed to send order confirmation:', err?.response?.body ?? err)
    throw err
  }
}

// ─── ADMIN ORDER EMAIL ────────────────────────────────────────────────────────

export async function sendAdminOrderEmail(
  order: any,
  printReadyUrls: string[]
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set — skipping admin order email')
    return
  }

  const itemDetails = (order.items ?? [])
    .map(
      (item: any, index: number) => `
      <tr style="background-color:${index % 2 === 0 ? '#FFFFFF' : '#F9F9F9'};">
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;">
          <strong>${item.product?.name ?? item.name}</strong><br/>
          <span style="color:#888888;">SKU: ${item.product?.distributorSku ?? 'N/A'} | Style: ${item.product?.styleNumber ?? 'N/A'}</span><br/>
          <span style="color:#888888;">Distributor: ${item.product?.distributor ?? 'N/A'}</span>
        </td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;white-space:nowrap;">${item.color}</td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;">${item.size}</td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;text-align:right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;text-align:right;">${formatCurrency(item.printPrice)}</td>
        <td style="padding:12px 16px;font-size:13px;border-bottom:1px solid #EEEEEE;text-align:right;font-weight:600;">${formatCurrency((item.unitPrice + item.printPrice) * item.quantity)}</td>
      </tr>`
    )
    .join('')

  const designImages = printReadyUrls.length > 0
    ? `
      <h3 style="margin:28px 0 16px;font-size:16px;color:#1A1A1A;">Print-Ready Design Files</h3>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${printReadyUrls
          .map(
            (url, i) => `
          <div style="text-align:center;">
            <img src="${url}" alt="Design ${i + 1}" width="200" style="border:1px solid #EEEEEE;border-radius:4px;display:block;"/>
            <p style="margin:6px 0 0;font-size:12px;color:#888888;">Design ${i + 1}</p>
          </div>`
          )
          .join('')}
      </div>`
    : '<p style="color:#888888;font-size:13px;">No design files attached to this order.</p>'

  const body = `
    <div style="background-color:#CC2222;color:#FFFFFF;padding:14px 20px;border-radius:6px;margin-bottom:28px;">
      <strong style="font-size:16px;">NEW ORDER — READY TO PRINT</strong>
      <span style="float:right;font-size:16px;">Order #${order.orderNumber}</span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td width="50%" style="vertical-align:top;padding-right:20px;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Customer Info</h3>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="font-size:13px;color:#888888;padding:3px 12px 3px 0;white-space:nowrap;">Name</td><td style="font-size:13px;color:#1A1A1A;font-weight:600;">${order.customerName}</td></tr>
            <tr><td style="font-size:13px;color:#888888;padding:3px 12px 3px 0;white-space:nowrap;">Email</td><td style="font-size:13px;color:#1A1A1A;"><a href="mailto:${order.customerEmail}" style="color:#E86E2C;">${order.customerEmail}</a></td></tr>
            ${order.customerPhone ? `<tr><td style="font-size:13px;color:#888888;padding:3px 12px 3px 0;white-space:nowrap;">Phone</td><td style="font-size:13px;color:#1A1A1A;">${order.customerPhone}</td></tr>` : ''}
            <tr><td style="font-size:13px;color:#888888;padding:3px 12px 3px 0;white-space:nowrap;">Stripe ID</td><td style="font-size:12px;color:#888888;font-family:monospace;">${order.stripePaymentId ?? 'N/A'}</td></tr>
            <tr><td style="font-size:13px;color:#888888;padding:3px 12px 3px 0;white-space:nowrap;">Order Date</td><td style="font-size:13px;color:#1A1A1A;">${new Date(order.createdAt).toLocaleString()}</td></tr>
          </table>
        </td>
        <td width="50%" style="vertical-align:top;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Ship To</h3>
          <p style="margin:0;font-size:13px;color:#555555;line-height:1.7;">${formatAddress(order.shippingAddress)}</p>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 16px;font-size:15px;color:#1A1A1A;">Order Line Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEEEEE;border-radius:6px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background-color:#1A1A1A;color:#FFFFFF;">
          <th style="padding:10px 16px;font-size:12px;text-align:left;font-weight:600;">Product</th>
          <th style="padding:10px 16px;font-size:12px;text-align:left;font-weight:600;">Color</th>
          <th style="padding:10px 16px;font-size:12px;text-align:left;font-weight:600;">Size</th>
          <th style="padding:10px 16px;font-size:12px;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:10px 16px;font-size:12px;text-align:right;font-weight:600;">Unit</th>
          <th style="padding:10px 16px;font-size:12px;text-align:right;font-weight:600;">Print</th>
          <th style="padding:10px 16px;font-size:12px;text-align:right;font-weight:600;">Line Total</th>
        </tr>
      </thead>
      <tbody>${itemDetails}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:320px;margin-left:auto;">
      <tr><td style="padding:5px 0;font-size:13px;color:#666666;">Subtotal</td><td style="padding:5px 0;font-size:13px;text-align:right;">${formatCurrency(order.subtotal)}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#666666;">Shipping</td><td style="padding:5px 0;font-size:13px;text-align:right;">${formatCurrency(order.shipping)}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#666666;">Tax</td><td style="padding:5px 0;font-size:13px;text-align:right;">${formatCurrency(order.tax)}</td></tr>
      <tr>
        <td style="padding:10px 0 0;font-size:16px;font-weight:700;border-top:2px solid #1A1A1A;">TOTAL COLLECTED</td>
        <td style="padding:10px 0 0;font-size:16px;font-weight:700;text-align:right;border-top:2px solid #1A1A1A;color:#CC2222;">${formatCurrency(order.total)}</td>
      </tr>
    </table>

    ${designImages}`

  const msg = {
    to: ADMIN_EMAIL,
    from: { email: FROM_EMAIL, name: `${FROM_NAME} Orders` },
    subject: `[READY TO PRINT] Order #${order.orderNumber} — ${order.customerName} — ${formatCurrency(order.total)}`,
    html: emailWrapper(`Admin: Order #${order.orderNumber}`, body),
  }

  try {
    await sgMail.send(msg)
    console.log(`[email] Admin order email sent for order #${order.orderNumber}`)
  } catch (err: any) {
    console.error('[email] Failed to send admin order email:', err?.response?.body ?? err)
    throw err
  }
}

// ─── DISTRIBUTOR ORDER (STUB) ─────────────────────────────────────────────────

/**
 * Stub for placing orders with distributors (SanMar / SSActivewear).
 * When real distributor API integrations are built, this function will
 * dispatch to the appropriate client based on product.distributor.
 */
export async function sendDistributorOrderEmail(order: any): Promise<void> {
  // Group items by distributor
  const byDistributor: Record<string, any[]> = {}
  for (const item of order.items ?? []) {
    const dist: string = item.product?.distributor ?? 'unknown'
    if (!byDistributor[dist]) byDistributor[dist] = []
    byDistributor[dist].push(item)
  }

  for (const [distributor, items] of Object.entries(byDistributor)) {
    console.log(`[distributor] ORDER STUB — would place order with ${distributor}:`, {
      orderNumber: order.orderNumber,
      shippingAddress: order.shippingAddress,
      items: items.map((i) => ({
        sku: i.product?.distributorSku,
        styleNumber: i.product?.styleNumber,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
      })),
    })
    // TODO: Replace with real API call:
    // if (distributor === 'sanmar') await sanmarClient.placeOrder(...)
    // if (distributor === 'ssactivewear') await ssactivewearClient.placeOrder(...)
  }
}
