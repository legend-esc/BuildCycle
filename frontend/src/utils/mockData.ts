export type BatchCondition = "New" | "Like New" | "Used" | "Reclaimed";

export interface ConditionReport {
  id: number;
  reporter: string;
  timestamp: number;
  grade: number;
  notes: string;
}

export interface Batch {
  id: number;
  seller: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  condition: BatchCondition;
  dimensions: string;
  price: number;
  paymentAsset: string;
  gps: { lat: number; lng: number };
  photos: string[];
  description: string;
  createdAt: number;
  active: boolean;
  conditionReports: ConditionReport[];
}

const COLORS = [
  "#f97316", "#2563eb", "#16a34a", "#9333ea",
  "#dc2626", "#0891b2", "#ca8a04", "#db2777",
];

function fakeCoord(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

export const MOCK_BATCHES: Batch[] = [
  {
    id: 1,
    seller: "GCCON123",
    title: "Oak Hardwood Planks – 200 sqft",
    category: "lumber",
    quantity: 200,
    unit: "sqft",
    condition: "Used",
    dimensions: "3/4x3x96",
    price: 450,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.758, 0.08), lng: fakeCoord(-73.985, 0.08) },
    photos: [
      "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600",
      "https://images.unsplash.com/photo-1621506289930-a9cdef4f49a2?w=600",
    ],
    description: "Solid oak flooring planks removed from a brownstone renovation. Good condition, mostly straight grain.",
    createdAt: Date.now() - 86400000 * 3,
    active: true,
    conditionReports: [
      { id: 1, reporter: "BuyerA", timestamp: Date.now() - 3600000, grade: 4, notes: "Mostly good, a few have minor scratches." },
    ],
  },
  {
    id: 2,
    seller: "GCCON123",
    title: "Porcelain Tile – 50 boxes",
    category: "tile",
    quantity: 50,
    unit: "boxes",
    condition: "New",
    dimensions: "12x24",
    price: 1200,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.758, 0.08), lng: fakeCoord(-73.985, 0.08) },
    photos: [
      "https://images.unsplash.com/photo-1618220179428-22790b461b0f?w=600",
    ],
    description: "Unopened boxes of matte porcelain tile, charcoal color. 12x24 inch format, 10 pieces per box.",
    createdAt: Date.now() - 86400000 * 7,
    active: true,
    conditionReports: [],
  },
  {
    id: 3,
    seller: "BWAYMGT",
    title: "LED Flat Panels – 24 pack",
    category: "electrical",
    quantity: 24,
    unit: "pieces",
    condition: "New",
    dimensions: "2x2ft",
    price: 720,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.748, 0.05), lng: fakeCoord(-73.995, 0.05) },
    photos: [
      "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600",
    ],
    description: "Commercial grade 2x2 LED flat panel lights, 40W, 4000K, dimmable. Brand new in boxes.",
    createdAt: Date.now() - 86400000 * 2,
    active: true,
    conditionReports: [],
  },
  {
    id: 4,
    seller: "BRKLYNDEV",
    title: "PVC Schedule 40 Pipe – 50 lengths",
    category: "plumbing",
    quantity: 50,
    unit: "lengths",
    condition: "Like New",
    dimensions: "3/4x120",
    price: 320,
    paymentAsset: "EURC",
    gps: { lat: fakeCoord(40.678, 0.06), lng: fakeCoord(-73.945, 0.06) },
    photos: [
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600",
    ],
    description: "PVC schedule 40 pipe, 3/4 inch diameter, 10ft lengths. Used once for a temporary irrigation system.",
    createdAt: Date.now() - 86400000 * 5,
    active: true,
    conditionReports: [
      { id: 2, reporter: "InspectorX", timestamp: Date.now() - 7200000, grade: 5, notes: "Like new condition, no visible wear." },
    ],
  },
  {
    id: 5,
    seller: "UPTOWNRENO",
    title: "Brass Cabinet Handles – 120 pack",
    category: "hardware",
    quantity: 120,
    unit: "pieces",
    condition: "New",
    dimensions: "5 inch",
    price: 180,
    paymentAsset: "XLM",
    gps: { lat: fakeCoord(40.798, 0.04), lng: fakeCoord(-73.965, 0.04) },
    photos: [
      "https://images.unsplash.com/photo-1595410183101-d3f42b4fe072?w=600",
    ],
    description: "Modern brass cabinet pulls, 5-inch center-to-center. Retail packaging, unopened boxes.",
    createdAt: Date.now() - 86400000 * 1,
    active: true,
    conditionReports: [],
  },
  {
    id: 6,
    seller: "GCCON123",
    title: "Reclaimed Barn Wood – 300 bdft",
    category: "lumber",
    quantity: 300,
    unit: "board feet",
    condition: "Reclaimed",
    dimensions: "Mixed",
    price: 900,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.738, 0.07), lng: fakeCoord(-74.005, 0.07) },
    photos: [
      "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600",
    ],
    description: "Mixed-width reclaimed barn wood from 1920s Pennsylvania barn. Nail holes, weathering, character.",
    createdAt: Date.now() - 86400000 * 10,
    active: true,
    conditionReports: [
      { id: 3, reporter: "WoodworkerJ", timestamp: Date.now() - 86400000 * 2, grade: 4, notes: "Beautiful grain, some pieces need planing." },
    ],
  },
  {
    id: 7,
    seller: "BRKLYNDEV",
    title: "Copper Wire THHN – 500ft spool",
    category: "electrical",
    quantity: 1,
    unit: "spool",
    condition: "New",
    dimensions: "12 AWG",
    price: 250,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.688, 0.05), lng: fakeCoord(-73.975, 0.05) },
    photos: [
      "https://images.unsplash.com/photo-1616627547584-bf9f00a0b11e?w=600",
    ],
    description: "Full 500ft spool of 12 AWG THHN copper wire. Never used, still in factory wrap.",
    createdAt: Date.now() - 86400000 * 4,
    active: true,
    conditionReports: [],
  },
  {
    id: 8,
    seller: "BWAYMGT",
    title: "Bathroom Vanity – 36 inch",
    category: "fixtures",
    quantity: 2,
    unit: "pieces",
    condition: "Like New",
    dimensions: "36x22x34",
    price: 350,
    paymentAsset: "EURC",
    gps: { lat: fakeCoord(40.768, 0.04), lng: fakeCoord(-73.955, 0.04) },
    photos: [
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600",
    ],
    description: "White shaker-style bathroom vanity with quartz top. Used 6 months, like new condition.",
    createdAt: Date.now() - 86400000 * 6,
    active: true,
    conditionReports: [],
  },
  {
    id: 9,
    seller: "UPTOWNRENO",
    title: "Cement Board – 50 sheets",
    category: "building-materials",
    quantity: 50,
    unit: "sheets",
    condition: "New",
    dimensions: "3x5ft",
    price: 680,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.778, 0.06), lng: fakeCoord(-73.915, 0.06) },
    photos: [
      "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600",
    ],
    description: "Durock cement board, 3x5ft sheets. 50 sheets, never opened. Perfect for tiling projects.",
    createdAt: Date.now() - 86400000 * 8,
    active: true,
    conditionReports: [],
  },
  {
    id: 10,
    seller: "GCCON123",
    title: "Insulation Rolls R-19 – 20 rolls",
    category: "building-materials",
    quantity: 20,
    unit: "rolls",
    condition: "New",
    dimensions: "15x32ft",
    price: 440,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.708, 0.05), lng: fakeCoord(-73.925, 0.05) },
    photos: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600",
    ],
    description: "Fiberglass insulation R-19, 15-inch width, 32ft length. 20 rolls, still wrapped.",
    createdAt: Date.now() - 86400000 * 12,
    active: true,
    conditionReports: [],
  },
  {
    id: 11,
    seller: "BRKLYNDEV",
    title: "Commercial Sink – 3-basin",
    category: "fixtures",
    quantity: 1,
    unit: "piece",
    condition: "Used",
    dimensions: "72x25x44",
    price: 550,
    paymentAsset: "USDC",
    gps: { lat: fakeCoord(40.718, 0.05), lng: fakeCoord(-73.935, 0.05) },
    photos: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600",
    ],
    description: "3-basin commercial stainless steel sink with drainboards. 72-inch wide. Minor dents.",
    createdAt: Date.now() - 86400000 * 15,
    active: true,
    conditionReports: [
      { id: 4, reporter: "KitchenPro", timestamp: Date.now() - 86400000 * 3, grade: 3, notes: "Functional, some surface scratches." },
    ],
  },
  {
    id: 12,
    seller: "BWAYMGT",
    title: "Interior Doors – Solid Core – 10 pack",
    category: "hardware",
    quantity: 10,
    unit: "pieces",
    condition: "New",
    dimensions: "30x80",
    price: 1100,
    paymentAsset: "EURC",
    gps: { lat: fakeCoord(40.788, 0.03), lng: fakeCoord(-73.945, 0.03) },
    photos: [
      "https://images.unsplash.com/photo-1585684123535-41a80db7abb4?w=600",
    ],
    description: "Solid core interior doors, 30x80 inches, primed white. 10 doors, still in packaging.",
    createdAt: Date.now() - 86400000 * 3,
    active: true,
    conditionReports: [],
  },
];

export const CATEGORIES = [
  "all",
  "lumber",
  "tile",
  "electrical",
  "plumbing",
  "hardware",
  "fixtures",
  "building-materials",
] as const;

export const CONDITION_OPTIONS: BatchCondition[] = [
  "New",
  "Like New",
  "Used",
  "Reclaimed",
];

export function getBatchById(id: number): Batch | undefined {
  return MOCK_BATCHES.find((b) => b.id === id);
}

export function getBatchColor(index: number): string {
  return COLORS[index % COLORS.length];
}
