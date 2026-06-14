import { Generated, ColumnType } from 'kysely';

export interface UserTable {
  id: Generated<number>;
  stellar_public_key: string;
  display_name: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface BatchTable {
  id: Generated<number>;
  contract_batch_id: string | null;
  seller_id: string; // stellar public key
  title: string;
  category: string;
  quantity: number;
  unit: string;
  condition: string;
  price: string;
  payment_asset: string;
  gps_lat: number;
  gps_lon: number;
  // PostGIS location point (Geography)
  location: any; 
  photos_cid: string;
  ipfs_metadata_uri: string;
  active: boolean;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface Database {
  users: UserTable;
  batches: BatchTable;
}
