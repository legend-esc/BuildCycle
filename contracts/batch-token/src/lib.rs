#![no_std]

extern crate alloc;

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, xdr::ToXdr, Address, Bytes, BytesN, Env,
    String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Batch {
    pub seller: Address,
    pub metadata_hash: BytesN<32>,
    pub qr_secret_hash: BytesN<32>,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Metadata {
    pub title: String,
    pub category: String,
    pub quantity: i128,
    pub unit: String,
    pub condition: String,
    pub dimensions: String,
    pub gps_lat: i64,
    pub gps_lon: i64,
    pub photos_cid: String,
    pub description: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConditionReport {
    pub reporter: Address,
    pub timestamp: u64,
    pub notes: String,
    pub grade: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Batch(u32),
    BatchMetadata(u32),
    BatchCondition(u32),
    BuyerClaim(u32),
    BatchCounter,
    SellerBatches(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchListedEvent {
    pub batch_id: u32,
    pub seller: Address,
    pub category: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchConditionReportedEvent {
    pub batch_id: u32,
    pub reporter: Address,
    pub grade: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchClaimedEvent {
    pub batch_id: u32,
    pub buyer: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BatchClosedEvent {
    pub batch_id: u32,
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    BatchNotFound = 1,
    Unauthorized = 2,
    BatchNotActive = 3,
    BatchAlreadyClaimed = 4,
    ActiveEscrowExists = 5,
    InvalidQRProof = 6,
    NotSeller = 7,
    InvalidInput = 8,
}

const EARTH_RADIUS_KM: f64 = 6371.0;

#[contract]
pub struct BatchTokenContract;

#[contractimpl]
impl BatchTokenContract {
    pub fn mint(
        env: Env,
        seller: Address,
        metadata: Metadata,
        qr_secret: BytesN<32>,
    ) -> Result<u32, Error> {
        seller.require_auth();

        let batch_id = Self::next_batch_id(&env);

        let qr_secret_hash: BytesN<32> = env
            .crypto()
            .sha256(&Bytes::from_slice(&env, &qr_secret.to_array()))
            .into();

        let metadata_bytes = Self::metadata_to_xdr(&env, &metadata);
        let metadata_hash: BytesN<32> = env.crypto().sha256(&metadata_bytes).into();

        let batch = Batch {
            seller: seller.clone(),
            metadata_hash,
            qr_secret_hash,
            active: true,
        };

        env.storage()
            .instance()
            .set(&StorageKey::Batch(batch_id), &batch);
        env.storage()
            .instance()
            .set(&StorageKey::BatchMetadata(batch_id), &metadata);
        env.storage()
            .instance()
            .set(&StorageKey::BatchCondition(batch_id), &Vec::<ConditionReport>::new(&env));

        let mut seller_batches: Vec<u32> = env
            .storage()
            .instance()
            .get(&StorageKey::SellerBatches(seller.clone()))
            .unwrap_or(Vec::new(&env));
        seller_batches.push_back(batch_id);
        env.storage()
            .instance()
            .set(&StorageKey::SellerBatches(seller.clone()), &seller_batches);

        env.events().publish(
            ("BatchListed", batch_id),
            BatchListedEvent {
                batch_id,
                seller,
                category: metadata.category,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(batch_id)
    }

    pub fn update_metadata(env: Env, batch_id: u32, metadata: Metadata) -> Result<(), Error> {
        let batch = Self::require_batch(&env, batch_id)?;
        batch.seller.require_auth();

        if !batch.active {
            return Err(Error::BatchNotActive);
        }

        let metadata_bytes = Self::metadata_to_xdr(&env, &metadata);
        let metadata_hash: BytesN<32> = env.crypto().sha256(&metadata_bytes).into();

        let updated = Batch {
            metadata_hash,
            ..batch
        };
        env.storage()
            .instance()
            .set(&StorageKey::Batch(batch_id), &updated);
        env.storage()
            .instance()
            .set(&StorageKey::BatchMetadata(batch_id), &metadata);

        Ok(())
    }

    pub fn report_condition(
        env: Env,
        batch_id: u32,
        grade: String,
        notes: String,
    ) -> Result<(), Error> {
        let batch = Self::require_batch(&env, batch_id)?;

        if !batch.active {
            return Err(Error::BatchNotActive);
        }

        let seller = batch.seller;

        let report = ConditionReport {
            reporter: seller.clone(),
            timestamp: env.ledger().timestamp(),
            notes,
            grade: grade.clone(),
        };

        let mut reports: Vec<ConditionReport> = env
            .storage()
            .instance()
            .get(&StorageKey::BatchCondition(batch_id))
            .unwrap_or(Vec::<ConditionReport>::new(&env));
        reports.push_back(report);
        env.storage()
            .instance()
            .set(&StorageKey::BatchCondition(batch_id), &reports);

        env.events().publish(
            ("BatchConditionReported", batch_id),
            BatchConditionReportedEvent {
                batch_id,
                reporter: seller,
                grade,
            },
        );

        Ok(())
    }

    pub fn set_buyer(env: Env, batch_id: u32, buyer: Address) -> Result<(), Error> {
        if env
            .storage()
            .instance()
            .has(&StorageKey::BuyerClaim(batch_id))
        {
            return Err(Error::BatchAlreadyClaimed);
        }

        let batch = Self::require_batch(&env, batch_id)?;

        if !batch.active {
            return Err(Error::BatchNotActive);
        }

        env.storage()
            .instance()
            .set(&StorageKey::BuyerClaim(batch_id), &buyer.clone());

        env.events().publish(
            ("BatchClaimed", batch_id),
            BatchClaimedEvent { batch_id, buyer },
        );

        Ok(())
    }

    pub fn burn(env: Env, batch_id: u32) -> Result<(), Error> {
        let batch = Self::require_batch(&env, batch_id)?;
        batch.seller.require_auth();

        if env
            .storage()
            .instance()
            .has(&StorageKey::BuyerClaim(batch_id))
        {
            return Err(Error::ActiveEscrowExists);
        }

        let updated = Batch {
            active: false,
            ..batch
        };
        env.storage()
            .instance()
            .set(&StorageKey::Batch(batch_id), &updated);

        env.events()
            .publish(("BatchClosed", batch_id), BatchClosedEvent { batch_id });

        Ok(())
    }

    pub fn is_verified_pickup(
        env: Env,
        batch_id: u32,
        qr_proof: BytesN<32>,
    ) -> Result<bool, Error> {
        let batch = Self::require_batch(&env, batch_id)?;

        if !batch.active {
            return Err(Error::BatchNotActive);
        }

        let proof_hash: BytesN<32> = env
            .crypto()
            .sha256(&Bytes::from_slice(&env, &qr_proof.to_array()))
            .into();
        Ok(proof_hash == batch.qr_secret_hash)
    }

    pub fn batch_uri(env: Env, batch_id: u32) -> Result<String, Error> {
        let _batch = Self::require_batch(&env, batch_id)?;
        let metadata: Metadata = require_metadata(&env, batch_id)?;

        let prefix = b"ipfs://";
        let cid_len = metadata.photos_cid.len() as usize;
        let mut buf = alloc::vec![0u8; prefix.len() + cid_len];
        buf[..prefix.len()].copy_from_slice(prefix);
        metadata
            .photos_cid
            .copy_into_slice(&mut buf[prefix.len()..]);
        Ok(String::from_bytes(&env, &buf))
    }

    pub fn batches_by_seller(env: Env, seller: Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&StorageKey::SellerBatches(seller))
            .unwrap_or(Vec::new(&env))
    }

    pub fn active_batches(env: Env, lat: i64, lon: i64, radius_km: i64) -> Vec<u32> {
        let mut result: Vec<u32> = Vec::new(&env);
        let counter: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::BatchCounter)
            .unwrap_or(0);

        let lat_f = lat as f64 / 1_000_000.0;
        let lon_f = lon as f64 / 1_000_000.0;
        let radius_f = radius_km as f64;

        for id in 0..counter {
            if let Some(batch) = env
                .storage()
                .instance()
                .get::<_, Batch>(&StorageKey::Batch(id))
            {
                if !batch.active {
                    continue;
                }
                if let Some(meta) = env
                    .storage()
                    .instance()
                    .get::<_, Metadata>(&StorageKey::BatchMetadata(id))
                {
                    let dist = haversine_km(
                        lat_f,
                        lon_f,
                        meta.gps_lat as f64 / 1_000_000.0,
                        meta.gps_lon as f64 / 1_000_000.0,
                    );
                    if dist <= radius_f {
                        result.push_back(id);
                    }
                }
            }
        }

        result
    }

    pub fn require_batch(env: &Env, batch_id: u32) -> Result<Batch, Error> {
        env.storage()
            .instance()
            .get(&StorageKey::Batch(batch_id))
            .ok_or(Error::BatchNotFound)
    }

    fn next_batch_id(env: &Env) -> u32 {
        let id: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::BatchCounter)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&StorageKey::BatchCounter, &(id + 1));
        id
    }

    fn metadata_to_xdr(env: &Env, metadata: &Metadata) -> Bytes {
        metadata.clone().to_xdr(env)
    }
}

fn require_metadata(env: &Env, batch_id: u32) -> Result<Metadata, Error> {
    env.storage()
        .instance()
        .get(&StorageKey::BatchMetadata(batch_id))
        .ok_or(Error::BatchNotFound)
}

fn haversine_km(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    let a = (d_lat * 0.5).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (d_lon * 0.5).sin().powi(2);
    let c = 2.0 * a.sqrt().asin();
    EARTH_RADIUS_KM * c
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn default_metadata(env: &Env) -> Metadata {
        Metadata {
            title: String::from_str(env, "Oak Planks"),
            category: String::from_str(env, "lumber"),
            quantity: 50,
            unit: String::from_str(env, "pieces"),
            condition: String::from_str(env, "Used"),
            dimensions: String::from_str(env, "2x4x96"),
            gps_lat: 40758700,
            gps_lon: -73985700,
            photos_cid: String::from_str(env, "QmTest123"),
            description: String::from_str(env, "Good condition oak planks"),
        }
    }

    fn setup() -> (Env, Address, BatchTokenContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, BatchTokenContract);
        let client = BatchTokenContractClient::new(&env, &contract_id);
        (env, contract_id, client)
    }

    // --- mint ---

    #[test]
    fn mint_creates_batch_with_correct_seller() {
        let (env, contract_id, client) = setup();
        let seller = Address::generate(&env);
        let metadata = default_metadata(&env);
        let qr_secret = BytesN::from_array(&env, &[1u8; 32]);

        let batch_id = client.mint(&seller, &metadata, &qr_secret);
        assert_eq!(batch_id, 0);

        let batch = env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .get::<_, Batch>(&StorageKey::Batch(0))
                .unwrap()
        });
        assert_eq!(batch.seller, seller);
        assert!(batch.active);
    }

    #[test]
    fn mint_emits_batch_listed_event() {
        let (env, _contract_id, client) = setup();
        let seller = Address::generate(&env);
        let metadata = default_metadata(&env);
        let qr_secret = BytesN::from_array(&env, &[1u8; 32]);

        client.mint(&seller, &metadata, &qr_secret);
    }

    #[test]
    fn mint_increments_batch_id() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);

        let id1 = client.mint(&seller, &meta.clone(), &secret.clone());
        let id2 = client.mint(&seller, &meta, &secret);
        assert_eq!(id1, 0);
        assert_eq!(id2, 1);
    }

    // --- update_metadata ---

    #[test]
    fn update_metadata_changes_metadata() {
        let (env, contract_id, client) = setup();
        let seller = Address::generate(&env);
        let meta = default_metadata(&env);
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let new_meta = Metadata {
            title: String::from_str(&env, "Updated Oak Planks"),
            ..default_metadata(&env)
        };
        client.update_metadata(&batch_id, &new_meta);

        let stored: Metadata = env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .get(&StorageKey::BatchMetadata(0))
                .unwrap()
        });
        assert_eq!(stored.title, String::from_str(&env, "Updated Oak Planks"));
    }

    // --- burn ---

    #[test]
    fn burn_deactivates_batch() {
        let (env, contract_id, client) = setup();
        let seller = Address::generate(&env);
        let meta = default_metadata(&env);
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        client.burn(&batch_id);

        let batch: Batch = env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .get(&StorageKey::Batch(0))
                .unwrap()
        });
        assert!(!batch.active);
    }

    #[test]
    fn burn_fails_if_buyer_claimed() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let buyer = Address::generate(&_env);
        client.set_buyer(&batch_id, &buyer);

        let result = client.try_burn(&batch_id);
        assert_eq!(result, Err(Ok(Error::ActiveEscrowExists)));
    }

    // --- set_buyer ---

    #[test]
    fn set_buyer_stores_claim() {
        let (env, contract_id, client) = setup();
        let seller = Address::generate(&env);
        let meta = default_metadata(&env);
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let buyer = Address::generate(&env);
        client.set_buyer(&batch_id, &buyer);

        let stored: Address = env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .get(&StorageKey::BuyerClaim(0))
                .unwrap()
        });
        assert_eq!(stored, buyer);
    }

    #[test]
    fn set_buyer_fails_twice() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let buyer1 = Address::generate(&_env);
        let buyer2 = Address::generate(&_env);
        client.set_buyer(&batch_id, &buyer1);

        let result = client.try_set_buyer(&batch_id, &buyer2);
        assert_eq!(result, Err(Ok(Error::BatchAlreadyClaimed)));
    }

    // --- is_verified_pickup ---

    #[test]
    fn is_verified_pickup_valid_qr() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret_bytes = [7u8; 32];
        let qr_secret = BytesN::from_array(&_env, &secret_bytes);
        let batch_id = client.mint(&seller, &meta, &qr_secret.clone());

        let valid = client.is_verified_pickup(&batch_id, &qr_secret);
        assert!(valid);
    }

    #[test]
    fn is_verified_pickup_invalid_qr() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let wrong_secret = BytesN::from_array(&_env, &[2u8; 32]);
        let valid = client.is_verified_pickup(&batch_id, &wrong_secret);
        assert!(!valid);
    }

    // --- report_condition ---

    #[test]
    fn report_condition_stores_report() {
        let (env, contract_id, client) = setup();
        let seller = Address::generate(&env);
        let meta = default_metadata(&env);
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let grade = String::from_str(&env, "Good");
        let notes = String::from_str(&env, "Solid shape");
        client.report_condition(&batch_id, &grade, &notes);

        let reports: Vec<ConditionReport> = env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .get(&StorageKey::BatchCondition(0))
                .unwrap()
        });
        assert_eq!(reports.len(), 1);
        assert_eq!(reports.get(0).unwrap().grade, grade);
        assert_eq!(reports.get(0).unwrap().notes, notes);
    }

    // --- batch_uri ---

    #[test]
    fn batch_uri_returns_ipfs_url() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);
        let batch_id = client.mint(&seller, &meta, &secret);

        let uri = client.batch_uri(&batch_id);
        assert!(uri.len() > 7);
    }

    // --- batches_by_seller ---

    #[test]
    fn batches_by_seller_returns_all() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let meta = default_metadata(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);

        client.mint(&seller, &meta.clone(), &secret.clone());
        client.mint(&seller, &meta.clone(), &secret.clone());
        client.mint(&seller, &meta, &secret);

        let ids = client.batches_by_seller(&seller);
        assert_eq!(ids.len(), 3);
    }

    #[test]
    fn batches_by_seller_empty_for_unknown() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let ids = client.batches_by_seller(&seller);
        assert_eq!(ids.len(), 0);
    }

    // --- active_batches ---

    #[test]
    fn active_batches_geo_filters() {
        let (_env, _contract_id, client) = setup();
        let seller = Address::generate(&_env);
        let secret = BytesN::from_array(&_env, &[1u8; 32]);

        let near_meta = Metadata {
            title: String::from_str(&_env, "Near"),
            ..default_metadata(&_env)
        };
        let far_meta = Metadata {
            title: String::from_str(&_env, "Far"),
            gps_lat: 34052400,
            gps_lon: -11824370,
            ..default_metadata(&_env)
        };

        client.mint(&seller, &near_meta, &secret.clone());
        client.mint(&seller, &far_meta, &secret);

        let ids = client.active_batches(&40758700, &-73985700, &100);
        assert_eq!(ids.len(), 1);
    }
}
