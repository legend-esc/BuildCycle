import { config } from "dotenv";
config();

const DATABASE_URL = process.env.DATABASE_URL || "postgres://buildcycle:buildcycle@localhost:5432/buildcycle";

interface SeedBatch {
  seller_id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  condition: string;
  price: string;
  payment_asset: string;
  gps_lat: number;
  gps_lon: number;
  photos_cid: string;
  ipfs_metadata_uri: string;
  description: string;
}

const SEED_BATCHES: SeedBatch[] = [
  { seller_id: "GCCON123", title: "Oak Hardwood Planks – 200 sqft", category: "lumber", quantity: 200, unit: "sqft", condition: "Used", price: "450", payment_asset: "USDC", gps_lat: 40.758, gps_lon: -73.985, photos_cid: "QmOak1", ipfs_metadata_uri: "ipfs://QmOak1", description: "Solid oak flooring planks removed from a brownstone renovation." },
  { seller_id: "GCCON123", title: "Porcelain Tile – 50 boxes", category: "tile", quantity: 50, unit: "boxes", condition: "New", price: "1200", payment_asset: "USDC", gps_lat: 40.748, gps_lon: -73.995, photos_cid: "QmTile1", ipfs_metadata_uri: "ipfs://QmTile1", description: "Unopened boxes of matte porcelain tile, charcoal color." },
  { seller_id: "BWAYMGT", title: "LED Flat Panels – 24 pack", category: "electrical", quantity: 24, unit: "pieces", condition: "New", price: "720", payment_asset: "USDC", gps_lat: 40.738, gps_lon: -73.975, photos_cid: "QmLed1", ipfs_metadata_uri: "ipfs://QmLed1", description: "Commercial grade 2x2 LED flat panel lights, 40W, 4000K." },
  { seller_id: "BRKLYNDEV", title: "PVC Schedule 40 Pipe – 50 lengths", category: "plumbing", quantity: 50, unit: "lengths", condition: "Like New", price: "320", payment_asset: "EURC", gps_lat: 40.678, gps_lon: -73.945, photos_cid: "QmPvc1", ipfs_metadata_uri: "ipfs://QmPvc1", description: "PVC schedule 40 pipe, 3/4 inch diameter, 10ft lengths." },
  { seller_id: "UPTOWNRENO", title: "Brass Cabinet Handles – 120 pack", category: "hardware", quantity: 120, unit: "pieces", condition: "New", price: "180", payment_asset: "XLM", gps_lat: 40.798, gps_lon: -73.965, photos_cid: "QmBrass1", ipfs_metadata_uri: "ipfs://QmBrass1", description: "Modern brass cabinet pulls, 5-inch center-to-center." },
  { seller_id: "GCCON123", title: "Reclaimed Barn Wood – 300 bdft", category: "lumber", quantity: 300, unit: "board feet", condition: "Reclaimed", price: "900", payment_asset: "USDC", gps_lat: 40.728, gps_lon: -74.005, photos_cid: "QmBarn1", ipfs_metadata_uri: "ipfs://QmBarn1", description: "Mixed-width reclaimed barn wood from 1920s Pennsylvania barn." },
  { seller_id: "BRKLYNDEV", title: "Copper Wire THHN – 500ft spool", category: "electrical", quantity: 1, unit: "spool", condition: "New", price: "250", payment_asset: "USDC", gps_lat: 40.688, gps_lon: -73.975, photos_cid: "QmWire1", ipfs_metadata_uri: "ipfs://QmWire1", description: "Full 500ft spool of 12 AWG THHN copper wire." },
  { seller_id: "BWAYMGT", title: "Bathroom Vanity – 36 inch", category: "fixtures", quantity: 2, unit: "pieces", condition: "Like New", price: "350", payment_asset: "EURC", gps_lat: 40.768, gps_lon: -73.955, photos_cid: "QmVnty1", ipfs_metadata_uri: "ipfs://QmVnty1", description: "White shaker-style bathroom vanity with quartz top." },
  { seller_id: "UPTOWNRENO", title: "Cement Board – 50 sheets", category: "building-materials", quantity: 50, unit: "sheets", condition: "New", price: "680", payment_asset: "USDC", gps_lat: 40.778, gps_lon: -73.915, photos_cid: "QmCem1", ipfs_metadata_uri: "ipfs://QmCem1", description: "Durock cement board, 3x5ft sheets, never opened." },
  { seller_id: "GCCON123", title: "Insulation Rolls R-19 – 20 rolls", category: "building-materials", quantity: 20, unit: "rolls", condition: "New", price: "440", payment_asset: "USDC", gps_lat: 40.708, gps_lon: -73.925, photos_cid: "QmIns1", ipfs_metadata_uri: "ipfs://QmIns1", description: "Fiberglass insulation R-19, 15-inch width, 32ft length." },
  { seller_id: "BRKLYNDEV", title: "Commercial Sink – 3-basin", category: "fixtures", quantity: 1, unit: "piece", condition: "Used", price: "550", payment_asset: "USDC", gps_lat: 40.718, gps_lon: -73.935, photos_cid: "QmSnk1", ipfs_metadata_uri: "ipfs://QmSnk1", description: "3-basin commercial stainless steel sink with drainboards." },
  { seller_id: "BWAYMGT", title: "Interior Doors – Solid Core – 10 pack", category: "hardware", quantity: 10, unit: "pieces", condition: "New", price: "1100", payment_asset: "EURC", gps_lat: 40.788, gps_lon: -73.945, photos_cid: "QmDoor1", ipfs_metadata_uri: "ipfs://QmDoor1", description: "Solid core interior doors, 30x80 inches, primed white." },
  { seller_id: "GCCON123", title: "Steel Rebar #4 – 200 lengths", category: "building-materials", quantity: 200, unit: "lengths", condition: "New", price: "1600", payment_asset: "USDC", gps_lat: 40.762, gps_lon: -73.978, photos_cid: "QmRebar1", ipfs_metadata_uri: "ipfs://QmRebar1", description: "#4 steel rebar, 20ft lengths, ASTM A615 Grade 60." },
  { seller_id: "UPTOWNRENO", title: "PEX Tubing – 500ft roll", category: "plumbing", quantity: 1, unit: "roll", condition: "New", price: "180", payment_asset: "USDC", gps_lat: 40.772, gps_lon: -73.958, photos_cid: "QmPex1", ipfs_metadata_uri: "ipfs://QmPex1", description: "1/2-inch PEX-B tubing, 500ft roll, never used." },
  { seller_id: "BRKLYNDEV", title: "Subfloor Plywood – 40 sheets", category: "lumber", quantity: 40, unit: "sheets", condition: "Used", price: "520", payment_asset: "USDC", gps_lat: 40.665, gps_lon: -73.938, photos_cid: "QmPly1", ipfs_metadata_uri: "ipfs://QmPly1", description: "3/4-inch T&G plywood, 4x8 sheets, from job site overstock." },
  { seller_id: "BWAYMGT", title: "Exit Signs – LED – 30 pack", category: "electrical", quantity: 30, unit: "pieces", condition: "New", price: "360", payment_asset: "EURC", gps_lat: 40.735, gps_lon: -73.968, photos_cid: "QmExit1", ipfs_metadata_uri: "ipfs://QmExit1", description: "LED exit signs with battery backup, universal mounting." },
  { seller_id: "GCCON123", title: "Marble Countertop Slab", category: "fixtures", quantity: 1, unit: "slab", condition: "Like New", price: "800", payment_asset: "USDC", gps_lat: 40.745, gps_lon: -73.990, photos_cid: "QmMrbl1", ipfs_metadata_uri: "ipfs://QmMrbl1", description: "Carrara marble slab, 8x4ft, minor edge chip." },
  { seller_id: "UPTOWNRENO", title: "Galvanized Steel Pipe – 30 lengths", category: "plumbing", quantity: 30, unit: "lengths", condition: "Used", price: "280", payment_asset: "USDC", gps_lat: 40.785, gps_lon: -73.948, photos_cid: "QmGalv1", ipfs_metadata_uri: "ipfs://QmGalv1", description: "3/4-inch galvanized pipe, 10ft lengths, surface rust." },
  { seller_id: "BRKLYNDEV", title: "Vinyl Flooring – 500 sqft", category: "tile", quantity: 500, unit: "sqft", condition: "New", price: "750", payment_asset: "USDC", gps_lat: 40.672, gps_lon: -73.955, photos_cid: "QmVny1", ipfs_metadata_uri: "ipfs://QmVny1", description: "Luxury vinyl plank flooring, click-lock, wood grain." },
  { seller_id: "BWAYMGT", title: " toilet – Dual Flush – 6 units", category: "fixtures", quantity: 6, unit: "pieces", condition: "New", price: "1200", payment_asset: "EURC", gps_lat: 40.755, gps_lon: -73.970, photos_cid: "QmToilet1", ipfs_metadata_uri: "ipfs://QmToilet1", description: "Dual flush toilets, 1.28 GPF, white, elongated bowl." },
];

async function seed() {
  console.log("Seeding database with", SEED_BATCHES.length, "batches...");
  console.log("Database URL:", DATABASE_URL.replace(/\/\/.*@/, "//***@"));
  console.log("");

  for (const batch of SEED_BATCHES) {
    console.log(`  ${batch.title} (${batch.category}) - $${batch.price} ${batch.payment_asset}`);
  }

  console.log("");
  console.log("To insert, run the following SQL against your database:");
  console.log("(Or use the POST /api/batches endpoint for each entry)");
  console.log("");

  // Generate SQL insert statement
  const values = SEED_BATCHES.map(
    (b) => `(
    '${b.seller_id}',
    '${b.title.replace(/'/g, "''")}',
    '${b.category}',
    ${b.quantity},
    '${b.unit}',
    '${b.condition}',
    '${b.price}',
    '${b.payment_asset}',
    ${b.gps_lat},
    ${b.gps_lon},
    '${b.photos_cid}',
    '${b.ipfs_metadata_uri}',
    true,
    '${b.description.replace(/'/g, "''")}',
    ST_MakePoint(${b.gps_lon}, ${b.gps_lat})::geography,
    NOW()
  )`
  ).join(",\n");

  console.log(`INSERT INTO batches (seller_id, title, category, quantity, unit, condition, price, payment_asset, gps_lat, gps_lon, photos_cid, ipfs_metadata_uri, active, description, location, created_at) VALUES\n${values};`);
}

seed().catch(console.error);
