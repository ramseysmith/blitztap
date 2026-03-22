// Shop catalog for BlitzTap - Update 1

export type ShopCategory = 'shapes' | 'backgrounds' | 'effects';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  rarity: Rarity;
  previewColor?: string;
}

export interface PlayerInventory {
  ownedItems: string[];
  equippedShape: string;      // item ID or 'default'
  equippedBackground: string; // item ID or 'default'
  equippedEffect: string;     // item ID or 'default'
}

export const DEFAULT_INVENTORY: PlayerInventory = {
  ownedItems: [],
  equippedShape: 'default',
  equippedBackground: 'default',
  equippedEffect: 'default',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#A0A0A0',
  rare: '#4488FF',
  epic: '#AA44FF',
  legendary: '#FFD700',
};

// ─── Shape Skins ───────────────────────────────────────────────────────────────
export const SHAPE_SKINS: ShopItem[] = [
  {
    id: 'shape_neon',
    name: 'Neon Glow',
    category: 'shapes',
    price: 150,
    description: 'Shapes with bright neon outlines and dark fills',
    rarity: 'common',
  },
  {
    id: 'shape_pixel',
    name: 'Pixel Art',
    category: 'shapes',
    price: 200,
    description: '8-bit pixelated versions of each shape',
    rarity: 'common',
  },
  {
    id: 'shape_glass',
    name: 'Glass',
    category: 'shapes',
    price: 300,
    description: 'Semi-transparent shapes with refraction highlights',
    rarity: 'rare',
  },
  {
    id: 'shape_metallic',
    name: 'Chrome',
    category: 'shapes',
    price: 300,
    description: 'Shiny metallic finish with reflections',
    rarity: 'rare',
  },
  {
    id: 'shape_gradient',
    name: 'Gradient',
    category: 'shapes',
    price: 400,
    description: 'Smooth multi-color gradient fills',
    rarity: 'rare',
  },
  {
    id: 'shape_cosmic',
    name: 'Cosmic',
    category: 'shapes',
    price: 600,
    description: 'Galaxy/nebula texture inside each shape',
    rarity: 'epic',
  },
  {
    id: 'shape_fire',
    name: 'Inferno',
    category: 'shapes',
    price: 800,
    description: 'Animated flickering fire texture on shapes',
    rarity: 'epic',
  },
  {
    id: 'shape_diamond',
    name: 'Crystal',
    category: 'shapes',
    price: 1200,
    description: 'Sparkling crystalline facets with shimmer',
    rarity: 'legendary',
  },
];

// ─── Backgrounds ───────────────────────────────────────────────────────────────
export const BACKGROUNDS: ShopItem[] = [
  {
    id: 'bg_midnight',
    name: 'Midnight Blue',
    category: 'backgrounds',
    price: 100,
    description: 'Deep navy gradient',
    rarity: 'common',
    previewColor: '#0D0D2E',
  },
  {
    id: 'bg_forest',
    name: 'Dark Forest',
    category: 'backgrounds',
    price: 200,
    description: 'Dark green with subtle leaf pattern',
    rarity: 'common',
    previewColor: '#0A1A0A',
  },
  {
    id: 'bg_sunset',
    name: 'Sunset',
    category: 'backgrounds',
    price: 300,
    description: 'Warm dark orange to purple gradient',
    rarity: 'rare',
    previewColor: '#2A1020',
  },
  {
    id: 'bg_ocean',
    name: 'Deep Ocean',
    category: 'backgrounds',
    price: 300,
    description: 'Dark teal with faint wave lines',
    rarity: 'rare',
    previewColor: '#071A1F',
  },
  {
    id: 'bg_space',
    name: 'Nebula',
    category: 'backgrounds',
    price: 500,
    description: 'Dark space with distant star particles',
    rarity: 'epic',
    previewColor: '#0A0A1A',
  },
  {
    id: 'bg_aurora',
    name: 'Northern Lights',
    category: 'backgrounds',
    price: 800,
    description: 'Slowly shifting green/purple gradient',
    rarity: 'legendary',
    previewColor: '#051510',
  },
];

// ─── Tap Effects ───────────────────────────────────────────────────────────────
export const TAP_EFFECTS: ShopItem[] = [
  {
    id: 'fx_sparkle',
    name: 'Sparkle',
    category: 'effects',
    price: 150,
    description: 'Small star-shaped particles burst outward',
    rarity: 'common',
  },
  {
    id: 'fx_confetti',
    name: 'Confetti',
    category: 'effects',
    price: 200,
    description: 'Tiny colored rectangles scatter on correct tap',
    rarity: 'common',
  },
  {
    id: 'fx_electric',
    name: 'Electric',
    category: 'effects',
    price: 400,
    description: 'Lightning crackle effect radiating from tap point',
    rarity: 'rare',
  },
  {
    id: 'fx_smoke',
    name: 'Smoke Ring',
    category: 'effects',
    price: 400,
    description: 'Expanding smoke ring that dissipates',
    rarity: 'rare',
  },
  {
    id: 'fx_shockwave',
    name: 'Shockwave',
    category: 'effects',
    price: 700,
    description: 'Circular distortion wave expanding outward',
    rarity: 'epic',
  },
  {
    id: 'fx_fireworks',
    name: 'Fireworks',
    category: 'effects',
    price: 1000,
    description: 'Mini firework burst with trailing sparks',
    rarity: 'legendary',
  },
];

export const ALL_ITEMS: ShopItem[] = [
  ...SHAPE_SKINS,
  ...BACKGROUNDS,
  ...TAP_EFFECTS,
];

export function getItemById(id: string): ShopItem | undefined {
  return ALL_ITEMS.find(item => item.id === id);
}

export function getItemsByCategory(category: ShopCategory): ShopItem[] {
  return ALL_ITEMS.filter(item => item.category === category);
}
