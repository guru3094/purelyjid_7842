/**
 * Databaseless fallback data — used when Supabase is unavailable.
 * This is BACKUP only. Primary data always comes from Supabase.
 */

export interface FallbackCustomProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  images: { url: string; alt: string }[];
  catalogue_url: string | null;
  display_order: number;
}

export interface FallbackWorkshopCatalogue {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url: string | null;
  download_count: number;
  created_at: string;
}

export const FALLBACK_CUSTOM_PRODUCTS: FallbackCustomProduct[] = [
  {
    id: 'fallback-cp-1',
    name: 'Custom Handwoven Tote',
    description: 'Personalised handwoven totes crafted from natural linen and cotton. Perfect for weddings, corporate gifting, and special occasions. Choose your colours, size, and add custom embroidery.',
    category: 'Bags & Totes',
    price_range: '₹800 – ₹2,500',
    images: [
      { url: '/assets/images/no_image.png', alt: 'Custom handwoven tote bag in natural linen with embroidered initials' },
    ],
    catalogue_url: null,
    display_order: 1,
  },
  {
    id: 'fallback-cp-2',
    name: 'Bespoke Ceramic Set',
    description: 'Hand-thrown ceramic sets made to order. Mugs, bowls, plates, and pour-over sets in custom glazes and finishes. Each piece is unique and signed by the artisan.',
    category: 'Ceramics',
    price_range: '₹1,200 – ₹6,000',
    images: [
      { url: '/assets/images/no_image.png', alt: 'Bespoke hand-thrown ceramic mug set in matte earthy glaze' },
    ],
    catalogue_url: null,
    display_order: 2,
  },
  {
    id: 'fallback-cp-3',
    name: 'Custom Beeswax Candles',
    description: 'Pure beeswax candles in custom shapes, sizes, and scents. Ideal for gifting, events, and home décor. Personalised labels and packaging available.',
    category: 'Candles',
    price_range: '₹400 – ₹1,800',
    images: [
      { url: '/assets/images/no_image.png', alt: 'Custom beeswax pillar candles in honey and ivory tones with botanical embeds' },
    ],
    catalogue_url: null,
    display_order: 3,
  },
  {
    id: 'fallback-cp-4',
    name: 'Personalised Gift Hampers',
    description: 'Curated gift hampers combining our handcrafted products. Customise the contents, packaging, and add a personal message card. Perfect for all occasions.',
    category: 'Gift Sets',
    price_range: '₹1,500 – ₹8,000',
    images: [
      { url: '/assets/images/no_image.png', alt: 'Personalised gift hamper with handcrafted items in a woven basket with ribbon' },
    ],
    catalogue_url: null,
    display_order: 4,
  },
];

export const FALLBACK_WORKSHOP_CATALOGUES: FallbackWorkshopCatalogue[] = [
  {
    id: 'fallback-ws-1',
    title: 'Handweaving Fundamentals',
    description: 'Learn the art of handweaving from scratch. This beginner-friendly workshop covers loom setup, basic weave structures, and finishing techniques. Take home your first woven piece.',
    file_url: '#',
    file_name: 'handweaving-fundamentals.pdf',
    file_size: 0,
    thumbnail_url: null,
    download_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fallback-ws-2',
    title: 'Ceramic Hand-Building',
    description: 'Explore hand-building techniques including pinch pots, coil building, and slab construction. No wheel required. Suitable for all skill levels.',
    file_url: '#',
    file_name: 'ceramic-hand-building.pdf',
    file_size: 0,
    thumbnail_url: null,
    download_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fallback-ws-3',
    title: 'Natural Candle Making',
    description: 'Discover the craft of beeswax and soy candle making. Learn about wicks, fragrances, moulds, and sustainable sourcing. Create your own signature candles to take home.',
    file_url: '#',
    file_name: 'natural-candle-making.pdf',
    file_size: 0,
    thumbnail_url: null,
    download_count: 0,
    created_at: new Date().toISOString(),
  },
];

/**
 * Check if Supabase is reachable. Returns true if available.
 * Used to decide whether to use live data or fallback.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return false;
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status === 401; // 401 = reachable but needs auth
  } catch {
    return false;
  }
}
