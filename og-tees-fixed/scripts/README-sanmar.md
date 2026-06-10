# SanMar SFTP Sync

This document covers how to sync SanMar product, inventory, and pricing data into the OG Tees database.

## Environment Variables

Add these to `.env.local` (or your production environment):

| Variable | Description | Example |
|---|---|---|
| `SANMAR_SFTP_HOST` | SanMar SFTP hostname | `ftp.sanmar.com` |
| `SANMAR_SFTP_PORT` | SFTP port | `2200` |
| `SANMAR_SFTP_USER` | SanMar customer number | `209677` |
| `SANMAR_SFTP_PASSWORD` | SFTP password | *(from SanMar account)* |
| `DATABASE_URL` | Prisma database URL | `file:./dev.db` |
| `ADMIN_SECRET` | Shared secret for the API route | *(any strong secret)* |

## Running the Sync Script

```bash
# Load env vars from .env.local and run the standalone script
npx dotenv -e .env.local -- npx ts-node --project tsconfig.json scripts/sanmar-sync.ts
```

Or export variables manually first:

```bash
export SANMAR_SFTP_HOST=ftp.sanmar.com
export SANMAR_SFTP_PORT=2200
export SANMAR_SFTP_USER=209677
export SANMAR_SFTP_PASSWORD=yourpassword
export DATABASE_URL=file:./dev.db

npx ts-node scripts/sanmar-sync.ts
```

The script logs all progress to stdout. A typical run:

```
[sanmar-sync] 2026-05-22T00:00:00.000Z === SanMar SFTP Sync starting ===
[sanmar-sync] 2026-05-22T00:00:00.000Z Connecting to SFTP ftp.sanmar.com:2200 as 209677
[sanmar-sync] 2026-05-22T00:00:01.000Z SFTP connected — listing root directory
[sanmar-sync] 2026-05-22T00:00:01.000Z Remote files found (3): ...
[sanmar-sync] 2026-05-22T00:00:05.000Z Downloaded 3 file(s)
[sanmar-sync] 2026-05-22T00:00:10.000Z Aggregated 850 unique styles
[sanmar-sync] 2026-05-22T00:00:30.000Z === Sync complete in 30.2s ===
[sanmar-sync] 2026-05-22T00:00:30.000Z   Created: 800
[sanmar-sync] 2026-05-22T00:00:30.000Z   Updated: 50
[sanmar-sync] 2026-05-22T00:00:30.000Z   Failed:  0
```

## Triggering via API

Send a `POST` request to `/api/admin/sanmar-sync` with the `ADMIN_SECRET` as a Bearer token:

```bash
curl -X POST https://your-domain.com/api/admin/sanmar-sync \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

Successful response:

```json
{
  "message": "Sync complete",
  "elapsed": "28.4s",
  "stylesFound": 850,
  "created": 800,
  "updated": 50,
  "failed": 0
}
```

The route runs the full download-parse-upsert cycle inline and returns when done. For very large catalogs, consider running the standalone script on a schedule instead (cron, GitHub Actions, etc.).

## What Files SanMar Provides

SanMar's SFTP server typically contains a subset of these files (naming may vary by account):

| File | Contents |
|---|---|
| `sanmar_PRODUCT_LINELIST.txt` | Full style catalog — one row per style/color/size combination. Contains STYLE, PRODUCT_TITLE, BRAND_NAME, CATEGORY_NAME, COLOR_NAME, COLOR_CODE, SIZE, NET_PRICE, DESCRIPTION, image URLs, etc. |
| `sanmar_INVENTORY.txt` | Current warehouse quantities — one row per style/color/size. Contains STYLE, COLOR_NAME, SIZE, QTY, INVENTORY_KEY. |
| `sanmar_PRICING.txt` | Net/piece pricing by style and size. Contains STYLE, SIZE, NET_PRICE, PIECE_PRICE. |

The sync handles both `.txt` and `.csv` extensions, tab-separated and comma-separated formats, and alternative column naming conventions (e.g. `STYLE_NUMBER` instead of `STYLE`). Unknown `.csv` or `.txt` files found in the root are also downloaded and attempted.

## How the Upsert Works

- Products are keyed by `distributorSku` = `SANMAR-{STYLE}` (one record per style, not per color/size).
- Colors and sizes from each row are aggregated into JSON arrays on the style record.
- Inventory is stored as a JSON object keyed `"ColorName-SIZE"` → quantity.
- **Existing products not in the SanMar feed are preserved** — the sync only creates or updates; it never deletes.
- If the pricing file supplies a lower net price than the product linelist, that price wins.

## Automating with a Cron Job

Example GitHub Actions workflow (`.github/workflows/sanmar-sync.yml`) to run nightly:

```yaml
name: SanMar Nightly Sync
on:
  schedule:
    - cron: '0 4 * * *'   # 4 AM UTC every day
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx ts-node scripts/sanmar-sync.ts
        env:
          SANMAR_SFTP_HOST: ${{ secrets.SANMAR_SFTP_HOST }}
          SANMAR_SFTP_PORT: ${{ secrets.SANMAR_SFTP_PORT }}
          SANMAR_SFTP_USER: ${{ secrets.SANMAR_SFTP_USER }}
          SANMAR_SFTP_PASSWORD: ${{ secrets.SANMAR_SFTP_PASSWORD }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```
