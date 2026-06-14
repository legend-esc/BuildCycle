import { Router, Response } from 'express';
import { db } from '../db';
import { sql } from 'kysely';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/batches?lat=&lng=&radius=&category=&min_price=&max_price=
router.get('/', async (req, res) => {
  const { lat, lng, radius, category, min_price, max_price } = req.query;

  let query = db.selectFrom('batches').selectAll().where('active', '=', true);

  if (category) {
    query = query.where('category', '=', category as string);
  }

  if (min_price) {
    query = query.where('price', '>=', min_price as string);
  }

  if (max_price) {
    query = query.where('price', '<=', max_price as string);
  }

  if (lat && lng && radius) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const rad = parseFloat(radius as string); // in meters

    query = query.where(
      sql<boolean>`ST_DWithin(location, ST_MakePoint(${longitude}, ${latitude})::geography, ${rad})`
    );
  }

  try {
    const batches = await query.execute();
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/batches/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const batch = await db
      .selectFrom('batches')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json(batch);
  } catch (err) {
    console.error('Error fetching batch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/batches (auth required)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const {
    title,
    category,
    quantity,
    unit,
    condition,
    price,
    payment_asset,
    gps_lat,
    gps_lon,
    photos_cid,
    ipfs_metadata_uri,
  } = req.body;

  if (!req.user) return res.sendStatus(401);

  try {
    const result = await db
      .insertInto('batches')
      .values({
        seller_id: req.user.publicKey,
        title,
        category,
        quantity,
        unit,
        condition,
        price,
        payment_asset,
        gps_lat,
        gps_lon,
        photos_cid,
        ipfs_metadata_uri,
        active: true,
        location: sql`ST_MakePoint(${gps_lon}, ${gps_lat})::geography`,
      } as any) // cast to any because of Generated and sql helper
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
