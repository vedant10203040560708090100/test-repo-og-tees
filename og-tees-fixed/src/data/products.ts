import { Product, ProductColor } from '@/types';

// Deterministic inventory seeded by position to avoid hydration mismatches.
// Uses a simple linear congruential generator so values are stable across renders.
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildInventory(
  colors: ProductColor[],
  sizes: string[],
  baseSeed: number
): Record<string, number> {
  const inventory: Record<string, number> = {};
  let i = 0;
  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color.name}-${size}`;
      inventory[key] = Math.floor(seededRandom(baseSeed + i) * 200);
      i++;
    }
  }
  return inventory;
}

function placeholderImages(hex: string, label: string): ProductColor['images'] {
  // For light colors use a dark text, otherwise white
  const bg = hex.replace('#', '');
  const fg = 'FFFFFF';
  const encodedLabel = encodeURIComponent(label);
  return {
    front: `https://placehold.co/600x700/${bg}/${fg}?text=${encodedLabel}+Front`,
    back: `https://placehold.co/600x700/${bg}/${fg}?text=${encodedLabel}+Back`,
    left: `https://placehold.co/600x700/${bg}/${fg}?text=${encodedLabel}+Left`,
    right: `https://placehold.co/600x700/${bg}/${fg}?text=${encodedLabel}+Right`,
    model: `https://placehold.co/600x800/${bg}/${fg}?text=Model+${encodedLabel}`,
  };
}

const apparelSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const hatSizes = ['One Size'];
const bagSizes = ['One Size'];

// ─── T-SHIRTS ────────────────────────────────────────────────────────────────

const portCompanyColors: ProductColor[] = [
  { name: 'White',        hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',        hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',         hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Red',          hex: '#C41230', images: placeholderImages('C41230', 'Red') },
  { name: 'Royal',        hex: '#1F4FA8', images: placeholderImages('1F4FA8', 'Royal') },
  { name: 'Forest Green', hex: '#2D5E40', images: placeholderImages('2D5E40', 'Forest') },
  { name: 'Charcoal',     hex: '#4A4A4A', images: placeholderImages('4A4A4A', 'Charcoal') },
];

const portCompanyTee: Product = {
  id: 'pc61-essential-tee',
  distributorSku: 'PC61',
  distributor: 'ssactivewear',
  brand: 'Port & Company',
  name: 'Essential T-Shirt',
  styleNumber: 'PC61',
  description:
    'Our best-selling tee. Made from 100% cotton (Ash is 99/1 cotton/poly; Sport Grey is 90/10 cotton/poly), this classic-fit shirt is comfortable, durable, and perfect for screen printing.',
  colors: portCompanyColors,
  sizes: apparelSizes,
  priceBase: 3.49,
  category: 'tshirt',
  inventory: buildInventory(portCompanyColors, apparelSizes, 1000),
  tags: ['cotton', 'classic-fit', 'basic', 'unisex', 'screen-print-friendly'],
};

const gildanColors: ProductColor[] = [
  { name: 'White',        hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',        hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',         hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Red',          hex: '#C41230', images: placeholderImages('C41230', 'Red') },
  { name: 'Sport Grey',   hex: '#8A8A8A', images: placeholderImages('8A8A8A', 'SportGrey') },
  { name: 'Safety Green', hex: '#78BE20', images: placeholderImages('78BE20', 'SafeGreen') },
  { name: 'Purple',       hex: '#4B286D', images: placeholderImages('4B286D', 'Purple') },
  { name: 'Orange',       hex: '#E05C00', images: placeholderImages('E05C00', 'Orange') },
];

const gildanHeavyCottonTee: Product = {
  id: 'g500-heavy-cotton-tee',
  distributorSku: 'G500',
  distributor: 'sanmar',
  brand: 'Gildan',
  name: 'Heavy Cotton T-Shirt',
  styleNumber: 'G500',
  description:
    'Gildan G500 Heavy Cotton Tee. 5.3 oz., 100% preshrunk cotton. Double-needle stitching throughout. Seamless double-needle 7/8" collar. Taped shoulder-to-shoulder. Ribbed cuffs.',
  colors: gildanColors,
  sizes: apparelSizes,
  priceBase: 3.25,
  category: 'tshirt',
  inventory: buildInventory(gildanColors, apparelSizes, 2000),
  tags: ['cotton', 'heavy-cotton', 'classic-fit', 'unisex', 'value'],
};

const bellaCanvasColors: ProductColor[] = [
  { name: 'White',               hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',               hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Dark Grey Heather',   hex: '#4A4A4A', images: placeholderImages('4A4A4A', 'DkGrey') },
  { name: 'Navy',                hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Heather Mauve',       hex: '#C9A0A0', images: placeholderImages('C9A0A0', 'Mauve') },
  { name: 'Soft Cream',          hex: '#F5F0E8', images: placeholderImages('F5F0E8', 'Cream') },
  { name: 'True Royal',          hex: '#1F4FA8', images: placeholderImages('1F4FA8', 'Royal') },
  { name: 'Heather Forest',      hex: '#3D6E50', images: placeholderImages('3D6E50', 'Forest') },
];

const bellaCanvasUnisexTee: Product = {
  id: 'bc3001-unisex-jersey-tee',
  distributorSku: 'BC3001',
  distributor: 'sanmar',
  brand: 'Bella+Canvas',
  name: 'Unisex Jersey Short Sleeve Tee',
  styleNumber: '3001',
  description:
    'Our best-selling premium unisex tee. Airlume combed and ring-spun cotton, 4.2 oz/yd². Retail fit with side seams. Tear away label. 30 singles for superior printability and a soft hand feel.',
  colors: bellaCanvasColors,
  sizes: apparelSizes,
  priceBase: 5.25,
  category: 'tshirt',
  inventory: buildInventory(bellaCanvasColors, apparelSizes, 3000),
  tags: ['premium', 'ring-spun', 'retail-fit', 'unisex', 'soft', 'bella+canvas'],
};

const nextLevelColors: ProductColor[] = [
  { name: 'White',          hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',          hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Vintage Black',  hex: '#2C2C2C', images: placeholderImages('2C2C2C', 'VintBlack') },
  { name: 'Midnight Navy',  hex: '#0D1B3E', images: placeholderImages('0D1B3E', 'MidNight') },
  { name: 'Kelly Green',    hex: '#1A7A3C', images: placeholderImages('1A7A3C', 'Kelly') },
  { name: 'Scarlet',        hex: '#B22222', images: placeholderImages('B22222', 'Scarlet') },
  { name: 'Gold',           hex: '#C8A415', images: placeholderImages('C8A415', 'Gold') },
];

const nextLevelCVCTee: Product = {
  id: 'nl6210-cvc-crew-tee',
  distributorSku: 'NL6210',
  distributor: 'ssactivewear',
  brand: 'Next Level',
  name: 'Unisex CVC Crew Tee',
  styleNumber: '6210',
  description:
    'Next Level 6210. 60/40 combed ring-spun cotton/polyester, 4.3 oz. CVC blend for a naturally soft feel with moisture wicking performance. Retail fit, tear-away label, side-seamed.',
  colors: nextLevelColors,
  sizes: apparelSizes,
  priceBase: 5.75,
  category: 'tshirt',
  inventory: buildInventory(nextLevelColors, apparelSizes, 4000),
  tags: ['cvc', 'ring-spun', 'moisture-wicking', 'retail-fit', 'next-level'],
};

// ─── HOODIES ─────────────────────────────────────────────────────────────────

const gildanHoodieColors: ProductColor[] = [
  { name: 'White',          hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',          hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',           hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Sport Grey',     hex: '#8A8A8A', images: placeholderImages('8A8A8A', 'SportGrey') },
  { name: 'Dark Heather',   hex: '#3D3D3D', images: placeholderImages('3D3D3D', 'DkHeather') },
  { name: 'Carolina Blue',  hex: '#5B9BD5', images: placeholderImages('5B9BD5', 'CarBlue') },
];

const gildanHeavyBlendHoodie: Product = {
  id: 'g185-heavy-blend-hoodie',
  distributorSku: 'G185',
  distributor: 'sanmar',
  brand: 'Gildan',
  name: 'Heavy Blend Hooded Sweatshirt',
  styleNumber: 'G185',
  description:
    'Gildan G185 Heavy Blend Hoodie. 8 oz., 50/50 cotton/polyester. Air jet yarn for a softer feel and reduced pilling. Double-lined hood with matching drawstring. Front pouch pocket. Double-needle stitching throughout.',
  colors: gildanHoodieColors,
  sizes: apparelSizes,
  priceBase: 12.99,
  category: 'hoodie',
  inventory: buildInventory(gildanHoodieColors, apparelSizes, 5000),
  tags: ['hoodie', 'pullover', 'fleece', 'heavy-blend', 'value', 'unisex'],
};

const sspHoodieColors: ProductColor[] = [
  { name: 'Black',         hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Arctic White',  hex: '#F0F0F0', images: placeholderImages('F0F0F0', 'ArcticWht') },
  { name: 'Gunmetal',      hex: '#4A4A4A', images: placeholderImages('4A4A4A', 'Gunmetal') },
  { name: 'Navy',          hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Maroon',        hex: '#7B1B2E', images: placeholderImages('7B1B2E', 'Maroon') },
  { name: 'Forest Green',  hex: '#2D5E40', images: placeholderImages('2D5E40', 'Forest') },
  { name: 'Royal',         hex: '#1F4FA8', images: placeholderImages('1F4FA8', 'Royal') },
];

const sspPulloverHoodie: Product = {
  id: 'ss4500-midweight-hoodie',
  distributorSku: 'SS4500',
  distributor: 'ssactivewear',
  brand: 'Independent Trading Co.',
  name: 'Midweight Hooded Sweatshirt',
  styleNumber: 'SS4500',
  description:
    'Independent Trading Company SS4500. 8.5 oz., 80/20 ring-spun cotton/polyester. Three-end fleece for superior softness. Matching flat drawcord. Ribbed cuffs and waistband. Front pouch pocket. Made proudly in Honduras.',
  colors: sspHoodieColors,
  sizes: apparelSizes,
  priceBase: 16.50,
  category: 'hoodie',
  inventory: buildInventory(sspHoodieColors, apparelSizes, 6000),
  tags: ['hoodie', 'premium', 'fleece', 'ring-spun', 'independent-trading'],
};

// ─── LONG SLEEVE ─────────────────────────────────────────────────────────────

const gildanLSColors: ProductColor[] = [
  { name: 'White',       hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',       hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',        hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Sport Grey',  hex: '#8A8A8A', images: placeholderImages('8A8A8A', 'SportGrey') },
  { name: 'Red',         hex: '#C41230', images: placeholderImages('C41230', 'Red') },
];

const gildanLSTee: Product = {
  id: 'g540-heavy-cotton-ls-tee',
  distributorSku: 'G540',
  distributor: 'sanmar',
  brand: 'Gildan',
  name: 'Heavy Cotton Long Sleeve T-Shirt',
  styleNumber: 'G540',
  description:
    'Gildan G540 Heavy Cotton Long Sleeve Tee. 5.3 oz., 100% preshrunk cotton. Seamless double-needle 7/8" collar. Double-needle sleeve and bottom hems. Taped shoulder-to-shoulder.',
  colors: gildanLSColors,
  sizes: apparelSizes,
  priceBase: 4.75,
  category: 'longsleeve',
  inventory: buildInventory(gildanLSColors, apparelSizes, 7000),
  tags: ['long-sleeve', 'cotton', 'classic-fit', 'unisex'],
};

const bellaLSColors: ProductColor[] = [
  { name: 'White',              hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',              hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Dark Grey Heather',  hex: '#4A4A4A', images: placeholderImages('4A4A4A', 'DkGrey') },
  { name: 'Navy',               hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Vintage White',      hex: '#F5F1E8', images: placeholderImages('F5F1E8', 'VintWht') },
];

const bellaLSTee: Product = {
  id: 'bc3501-unisex-ls-tee',
  distributorSku: 'BC3501',
  distributor: 'ssactivewear',
  brand: 'Bella+Canvas',
  name: 'Unisex Jersey Long Sleeve Tee',
  styleNumber: '3501',
  description:
    'Bella+Canvas 3501. Airlume combed and ring-spun cotton, 4.2 oz. Long sleeve retail fit with side seams. Tear-away label. Superior print surface for screen printing and direct-to-garment.',
  colors: bellaLSColors,
  sizes: apparelSizes,
  priceBase: 7.25,
  category: 'longsleeve',
  inventory: buildInventory(bellaLSColors, apparelSizes, 8000),
  tags: ['long-sleeve', 'premium', 'ring-spun', 'retail-fit', 'bella+canvas'],
};

// ─── POLO ─────────────────────────────────────────────────────────────────────

const portAuthorityPoloColors: ProductColor[] = [
  { name: 'White',       hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',       hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',        hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Dark Red',    hex: '#8B0000', images: placeholderImages('8B0000', 'DarkRed') },
  { name: 'True Royal',  hex: '#1F4FA8', images: placeholderImages('1F4FA8', 'Royal') },
  { name: 'Steel Grey',  hex: '#7A7A7A', images: placeholderImages('7A7A7A', 'SteelGrey') },
];

const portAuthorityPolo: Product = {
  id: 'k500-silk-touch-polo',
  distributorSku: 'K500',
  distributor: 'sanmar',
  brand: 'Port Authority',
  name: 'Silk Touch Polo',
  styleNumber: 'K500',
  description:
    'Port Authority K500 Silk Touch Polo. 5 oz., 65/35 poly/cotton. Flat knit collar and cuffs. Two-button placket. Side vents. Heat transfer label. Classic polo fit for corporate and casual wear.',
  colors: portAuthorityPoloColors,
  sizes: apparelSizes,
  priceBase: 10.50,
  category: 'polo',
  inventory: buildInventory(portAuthorityPoloColors, apparelSizes, 9000),
  tags: ['polo', 'corporate', 'embroidery-friendly', 'silk-touch', 'professional'],
};

// ─── TANK TOP ─────────────────────────────────────────────────────────────────

const alstyleTankColors: ProductColor[] = [
  { name: 'White',       hex: '#EEEEEE', images: placeholderImages('EEEEEE', 'White') },
  { name: 'Black',       hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',        hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Red',         hex: '#C41230', images: placeholderImages('C41230', 'Red') },
  { name: 'Gold',        hex: '#C8A415', images: placeholderImages('C8A415', 'Gold') },
  { name: 'Kelly Green', hex: '#1A7A3C', images: placeholderImages('1A7A3C', 'Kelly') },
];

const alstyleTankTop: Product = {
  id: 'al1307-muscle-tank',
  distributorSku: 'AL1307',
  distributor: 'ssactivewear',
  brand: 'Alstyle',
  name: 'Classic Muscle Tank Top',
  styleNumber: '1307',
  description:
    'Alstyle 1307 Tank Top. 6 oz., 100% preshrunk cotton. Generous armhole opening. Hemmed bottom. Classic muscle fit. Great for gyms, events, and casual wear. Ideal for screen printing.',
  colors: alstyleTankColors,
  sizes: apparelSizes,
  priceBase: 3.99,
  category: 'tank',
  inventory: buildInventory(alstyleTankColors, apparelSizes, 10000),
  tags: ['tank', 'muscle', 'cotton', 'gym', 'summer'],
};

// ─── HAT ─────────────────────────────────────────────────────────────────────

const portAuthorityCapColors: ProductColor[] = [
  { name: 'Black',  hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',   hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Royal',  hex: '#1F4FA8', images: placeholderImages('1F4FA8', 'Royal') },
  { name: 'Red',    hex: '#C41230', images: placeholderImages('C41230', 'Red') },
  { name: 'Khaki',  hex: '#C3A882', images: placeholderImages('C3A882', 'Khaki') },
  { name: 'Camo',   hex: '#5C5D41', images: placeholderImages('5C5D41', 'Camo') },
];

const portAuthorityStructuredCap: Product = {
  id: 'c900-structured-cap',
  distributorSku: 'C900',
  distributor: 'sanmar',
  brand: 'Port Authority',
  name: 'Structured Cap',
  styleNumber: 'C900',
  description:
    'Port Authority C900 Structured Cap. 100% cotton twill. 6-panel structured front. Pre-curved visor. Adjustable hook-and-loop closure. Sweatband. One size fits most. Perfect for embroidery and screen printing.',
  colors: portAuthorityCapColors,
  sizes: hatSizes,
  priceBase: 7.25,
  category: 'hat',
  inventory: buildInventory(portAuthorityCapColors, hatSizes, 11000),
  tags: ['hat', 'cap', 'structured', 'adjustable', 'embroidery-friendly'],
};

// ─── TOTE BAG ─────────────────────────────────────────────────────────────────

const toteBagColors: ProductColor[] = [
  { name: 'Natural', hex: '#E8DCC8', images: placeholderImages('E8DCC8', 'Natural') },
  { name: 'Black',   hex: '#1A1A1A', images: placeholderImages('1A1A1A', 'Black') },
  { name: 'Navy',    hex: '#1B2B5E', images: placeholderImages('1B2B5E', 'Navy') },
  { name: 'Red',     hex: '#C41230', images: placeholderImages('C41230', 'Red') },
];

const canvasToteBag: Product = {
  id: 'bg10-canvas-tote',
  distributorSku: 'BG10',
  distributor: 'ssactivewear',
  brand: 'Port Authority',
  name: 'Laminated Tote',
  styleNumber: 'BG10',
  description:
    'Port Authority BG10 Laminated Tote. 600 denier polyester with lamination coating. Open main compartment. Dual 22" self-fabric handles. Dimensions: 15"h x 14.5"w x 3"d. Reusable and eco-friendly.',
  colors: toteBagColors,
  sizes: bagSizes,
  priceBase: 5.99,
  category: 'bag',
  inventory: buildInventory(toteBagColors, bagSizes, 12000),
  tags: ['tote', 'bag', 'reusable', 'eco', 'laminated'],
};

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export const mockProducts: Product[] = [
  portCompanyTee,
  gildanHeavyCottonTee,
  bellaCanvasUnisexTee,
  nextLevelCVCTee,
  gildanHeavyBlendHoodie,
  sspPulloverHoodie,
  gildanLSTee,
  bellaLSTee,
  portAuthorityPolo,
  alstyleTankTop,
  portAuthorityStructuredCap,
  canvasToteBag,
];

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter((p) => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return mockProducts;
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.styleNumber.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.colors.some((c) => c.name.toLowerCase().includes(q))
  );
}
