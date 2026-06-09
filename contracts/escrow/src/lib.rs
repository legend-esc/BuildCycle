#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, String,
    Vec,
};

const DISPUTE_WINDOW: u64 = 172800;
const CREATED_TIMEOUT: u64 = 2_592_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Created,
    Locked,
    Released,
    Disputed,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub batch_id: u32,
    pub buyer: Address,
    pub seller: Address,
    pub amount_sent: i128,
    pub amount_path: i128,
    pub sent_asset: Address,
    pub received_asset: Address,
    pub path: Vec<Address>,
    pub status: EscrowStatus,
    pub dispute_deadline: u64,
    pub qr_secret_hash: BytesN<32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityConfig {
    pub admin: Address,
    pub fee_bps: u32,
    pub pool_address: Address,
    pub min_fee: i128,
    pub max_fee: i128,
    pub batch_token_address: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub raised_by: Address,
    pub reason: String,
    pub resolved: bool,
    pub resolution: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowStatusResponse {
    pub status: EscrowStatus,
    pub buyer: Address,
    pub seller: Address,
    pub batch_id: u32,
    pub amount_sent: i128,
    pub dispute_deadline: u64,
    pub sent_asset: Address,
    pub received_asset: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Escrow(u32),
    CommunityConfig,
    Dispute(u32),
    EscrowCounter,
    BatchEscrowFlag(u32),
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    EscrowNotFound = 4,
    InvalidStateTransition = 5,
    BatchAlreadyInEscrow = 6,
    PaymentDeadlinePassed = 7,
    DisputeDeadlinePassed = 8,
    InvalidQRProof = 9,
    NoDisputeRaised = 10,
    DisputeAlreadyResolved = 11,
    AlreadyReleased = 12,
    InvalidInput = 13,
    InsufficientBalance = 14,
    DisputeWindowNotOpen = 15,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        batch_token_address: Address,
        pool_address: Address,
    ) -> Result<(), Error> {
        if env
            .storage()
            .instance()
            .has(&StorageKey::CommunityConfig)
        {
            return Err(Error::AlreadyInitialized);
        }

        let config = CommunityConfig {
            admin,
            fee_bps: 500,
            pool_address,
            min_fee: 0,
            max_fee: i128::MAX,
            batch_token_address,
        };

        env.storage()
            .instance()
            .set(&StorageKey::CommunityConfig, &config);

        Ok(())
    }

    pub fn create_escrow(
        env: Env,
        batch_id: u32,
        buyer: Address,
        seller: Address,
        sent_asset: Address,
        received_asset: Address,
        path: Vec<Address>,
        qr_secret_hash: BytesN<32>,
    ) -> Result<u32, Error> {
        seller.require_auth();

        Self::require_config(&env)?;

        if env
            .storage()
            .instance()
            .has(&StorageKey::BatchEscrowFlag(batch_id))
        {
            return Err(Error::BatchAlreadyInEscrow);
        }

        let escrow_id = Self::next_escrow_id(&env);

        let escrow = Escrow {
            batch_id,
            buyer: buyer.clone(),
            seller: seller.clone(),
            amount_sent: 0,
            amount_path: 0,
            sent_asset,
            received_asset,
            path,
            status: EscrowStatus::Created,
            dispute_deadline: env.ledger().timestamp() + CREATED_TIMEOUT,
            qr_secret_hash,
        };

        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);
        env.storage()
            .instance()
            .set(&StorageKey::BatchEscrowFlag(batch_id), &true);

        Ok(escrow_id)
    }

    pub fn lock_payment(env: Env, escrow_id: u32, amount: i128) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, escrow_id)?;
        escrow.buyer.require_auth();

        if escrow.status != EscrowStatus::Created {
            return Err(Error::InvalidStateTransition);
        }

        if env.ledger().timestamp() > escrow.dispute_deadline {
            return Err(Error::PaymentDeadlinePassed);
        }

        let token = token::Client::new(&env, &escrow.sent_asset);
        let contract_address = env.current_contract_address();

        token.transfer(&escrow.buyer, &contract_address, &amount);

        escrow.amount_sent = amount;
        escrow.amount_path = amount;
        escrow.status = EscrowStatus::Locked;
        escrow.dispute_deadline = env.ledger().timestamp() + DISPUTE_WINDOW;

        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    pub fn confirm_pickup(
        env: Env,
        escrow_id: u32,
        qr_proof: BytesN<32>,
    ) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, escrow_id)?;

        if escrow.status != EscrowStatus::Locked {
            return Err(Error::InvalidStateTransition);
        }

        let proof_hash: BytesN<32> = env
            .crypto()
            .sha256(&Bytes::from_slice(&env, &qr_proof.to_array()))
            .into();

        if proof_hash != escrow.qr_secret_hash {
            return Err(Error::InvalidQRProof);
        }

        escrow.status = EscrowStatus::Released;
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    pub fn release_funds(env: Env, escrow_id: u32) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, escrow_id)?;

        if escrow.status != EscrowStatus::Released {
            return Err(Error::InvalidStateTransition);
        }

        if escrow.amount_sent == 0 {
            return Err(Error::AlreadyReleased);
        }

        let config = Self::require_config(&env)?;
        let (_seller_share, fee) = Self::calculate_split(escrow.amount_sent, config.fee_bps);

        let applied_fee = fee.max(config.min_fee).min(config.max_fee);
        let seller_final = escrow.amount_sent - applied_fee;

        let token = token::Client::new(&env, &escrow.sent_asset);
        let contract_address = env.current_contract_address();

        token.transfer(&contract_address, &escrow.seller, &seller_final);
        token.transfer(&contract_address, &config.pool_address, &applied_fee);

        escrow.amount_sent = 0;
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    pub fn auto_release(env: Env, escrow_id: u32) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, escrow_id)?;

        if escrow.status != EscrowStatus::Locked {
            return Err(Error::InvalidStateTransition);
        }

        if env.ledger().timestamp() <= escrow.dispute_deadline {
            return Err(Error::DisputeDeadlinePassed);
        }

        if env
            .storage()
            .instance()
            .has(&StorageKey::Dispute(escrow_id))
        {
            return Err(Error::InvalidStateTransition);
        }

        escrow.status = EscrowStatus::Released;
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Self::release_funds(env, escrow_id)
    }

    pub fn dispute(env: Env, escrow_id: u32, reason: String) -> Result<(), Error> {
        let mut escrow = Self::require_escrow(&env, escrow_id)?;

        if escrow.status != EscrowStatus::Locked {
            return Err(Error::InvalidStateTransition);
        }

        if env.ledger().timestamp() > escrow.dispute_deadline {
            return Err(Error::DisputeWindowNotOpen);
        }

        escrow.buyer.require_auth();

        let dispute = Dispute {
            raised_by: escrow.buyer.clone(),
            reason,
            resolved: false,
            resolution: 0,
        };

        env.storage()
            .instance()
            .set(&StorageKey::Dispute(escrow_id), &dispute);

        escrow.status = EscrowStatus::Disputed;
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        escrow_id: u32,
        resolution: u32,
        admin: Address,
    ) -> Result<(), Error> {
        admin.require_auth();

        let config = Self::require_config(&env)?;
        if admin != config.admin {
            return Err(Error::Unauthorized);
        }

        let mut escrow = Self::require_escrow(&env, escrow_id)?;
        if escrow.status != EscrowStatus::Disputed {
            return Err(Error::InvalidStateTransition);
        }

        let mut dispute: Dispute = env
            .storage()
            .instance()
            .get(&StorageKey::Dispute(escrow_id))
            .ok_or(Error::NoDisputeRaised)?;

        if dispute.resolved {
            return Err(Error::DisputeAlreadyResolved);
        }

        let token = token::Client::new(&env, &escrow.sent_asset);
        let contract_address = env.current_contract_address();

        match resolution {
            1 => {
                token.transfer(&contract_address, &escrow.buyer, &escrow.amount_sent);
            }
            2 => {
                let half = escrow.amount_sent / 2;
                token.transfer(&contract_address, &escrow.buyer, &half);
                let remaining = escrow.amount_sent - half;
                token.transfer(&contract_address, &escrow.seller, &remaining);
            }
            3 => {
                let (_seller_share, fee) =
                    Self::calculate_split(escrow.amount_sent, config.fee_bps);
                let applied_fee = fee.max(config.min_fee).min(config.max_fee);
                let seller_final = escrow.amount_sent - applied_fee;
                token.transfer(&contract_address, &escrow.seller, &seller_final);
                token.transfer(&contract_address, &config.pool_address, &applied_fee);
            }
            _ => return Err(Error::InvalidInput),
        }

        dispute.resolved = true;
        dispute.resolution = resolution;
        env.storage()
            .instance()
            .set(&StorageKey::Dispute(escrow_id), &dispute);

        escrow.status = EscrowStatus::Resolved;
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        Ok(())
    }

    pub fn get_escrow_status(env: Env, escrow_id: u32) -> Result<EscrowStatusResponse, Error> {
        let escrow = Self::require_escrow(&env, escrow_id)?;

        Ok(EscrowStatusResponse {
            status: escrow.status,
            buyer: escrow.buyer,
            seller: escrow.seller,
            batch_id: escrow.batch_id,
            amount_sent: escrow.amount_sent,
            dispute_deadline: escrow.dispute_deadline,
            sent_asset: escrow.sent_asset,
            received_asset: escrow.received_asset,
        })
    }

    pub fn update_community_config(
        env: Env,
        new_pool: Address,
        new_bps: u32,
    ) -> Result<(), Error> {
        let mut config = Self::require_config(&env)?;
        config.admin.require_auth();

        if new_bps > 10_000 {
            return Err(Error::InvalidInput);
        }

        config.pool_address = new_pool;
        config.fee_bps = new_bps;

        env.storage()
            .instance()
            .set(&StorageKey::CommunityConfig, &config);

        Ok(())
    }

    pub fn claim_unclaimed(env: Env, escrow_id: u32) -> Result<(), Error> {
        let escrow = Self::require_escrow(&env, escrow_id)?;
        escrow.seller.require_auth();

        if escrow.status != EscrowStatus::Created {
            return Err(Error::InvalidStateTransition);
        }

        if env.ledger().timestamp() <= escrow.dispute_deadline {
            return Err(Error::PaymentDeadlinePassed);
        }

        env.storage()
            .instance()
            .remove(&StorageKey::Escrow(escrow_id));
        env.storage()
            .instance()
            .remove(&StorageKey::BatchEscrowFlag(escrow.batch_id));

        Ok(())
    }

    fn require_escrow(env: &Env, escrow_id: u32) -> Result<Escrow, Error> {
        env.storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(Error::EscrowNotFound)
    }

    fn require_config(env: &Env) -> Result<CommunityConfig, Error> {
        env.storage()
            .instance()
            .get(&StorageKey::CommunityConfig)
            .ok_or(Error::NotInitialized)
    }

    fn next_escrow_id(env: &Env) -> u32 {
        let id: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::EscrowCounter)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&StorageKey::EscrowCounter, &(id + 1));
        id
    }

    pub fn calculate_split(amount: i128, bps: u32) -> (i128, i128) {
        let fee = amount * bps as i128 / 10_000;
        let seller_share = amount - fee;
        (seller_share, fee)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn setup_env(
    ) -> (Env, Address, Address, Address, Address, Address, Address, EscrowContractClient<'static>)
    {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);
        let pool = Address::generate(&env);
        let batch_token = Address::generate(&env);

        let usdc = env.register_stellar_asset_contract(admin.clone());

        let sac = token::StellarAssetClient::new(&env, &usdc);
        sac.mint(&buyer, &1_000_000_000);
        sac.mint(&seller, &1_000_000_000);

        let escrow_contract_id = env.register_contract(None, EscrowContract);
        let escrow_client = EscrowContractClient::new(&env, &escrow_contract_id);

        escrow_client.initialize(&admin, &batch_token, &pool);

        (env, admin, seller, buyer, usdc, pool, batch_token, escrow_client)
    }

    fn tc<'a>(env: &'a Env, addr: &'a Address) -> token::Client<'a> {
        token::Client::new(env, addr)
    }

    fn qr_hash(env: &Env, secret: &BytesN<32>) -> BytesN<32> {
        env.crypto()
            .sha256(&Bytes::from_slice(env, &secret.to_array()))
            .into()
    }

    fn create_escrow(
        env: &Env,
        client: &EscrowContractClient<'static>,
        batch_id: u32,
        buyer: &Address,
        seller: &Address,
        asset: &Address,
        qr: &BytesN<32>,
    ) -> u32 {
        let path: Vec<Address> = Vec::new(env);
        client.create_escrow(&batch_id, buyer, seller, asset, asset, &path, qr)
    }

    #[test]
    fn test_create_escrow_initializes_correctly() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32])));
        assert_eq!(id, 0);
        let s = c.get_escrow_status(&0);
        assert_eq!(s.status, EscrowStatus::Created);
        assert_eq!(s.buyer, buyer);
        assert_eq!(s.seller, seller);
    }

    #[test]
    fn test_create_escrow_fails_if_batch_already_in_escrow() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        let r = c.try_create_escrow(&0, &buyer, &seller, &usdc, &usdc, &Vec::new(&env), &h);
        assert_eq!(r, Err(Ok(Error::BatchAlreadyInEscrow)));
    }

    #[test]
    fn test_lock_confirm_release_full_flow() {
        let (env, _a, seller, buyer, usdc, pool, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);

        c.lock_payment(&id, &500_000_000);
        assert_eq!(c.get_escrow_status(&id).status, EscrowStatus::Locked);

        c.confirm_pickup(&id, &secret);
        assert_eq!(c.get_escrow_status(&id).status, EscrowStatus::Released);

        let sb = tc(&env, &usdc).balance(&seller);
        let pb = tc(&env, &usdc).balance(&pool);
        c.release_funds(&id);

        let expected_fee = 500_000_000 * 500 / 10_000;
        assert_eq!(
            tc(&env, &usdc).balance(&seller) - sb,
            500_000_000 - expected_fee
        );
        assert_eq!(tc(&env, &usdc).balance(&pool) - pb, expected_fee);
    }

    #[test]
    fn test_double_confirm_rejected() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);
        c.confirm_pickup(&id, &secret);
        assert_eq!(c.try_confirm_pickup(&id, &secret), Err(Ok(Error::InvalidStateTransition)));
    }

    #[test]
    fn test_lock_dispute_resolve_refund() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);

        c.dispute(&id, &String::from_str(&env, "Not as described"));
        assert_eq!(c.get_escrow_status(&id).status, EscrowStatus::Disputed);

        let bb = tc(&env, &usdc).balance(&buyer);
        c.resolve_dispute(&id, &1, &_a);
        assert_eq!(tc(&env, &usdc).balance(&buyer) - bb, 500_000_000);
        assert_eq!(c.get_escrow_status(&id).status, EscrowStatus::Resolved);
    }

    #[test]
    fn test_dispute_after_deadline_fails() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);

        env.ledger().set_timestamp(env.ledger().timestamp() + DISPUTE_WINDOW + 1);
        let r = c.try_dispute(&id, &String::from_str(&env, "Too late"));
        assert_eq!(r, Err(Ok(Error::DisputeWindowNotOpen)));
    }

    #[test]
    fn test_auto_release_after_deadline() {
        let (env, _a, seller, buyer, usdc, pool, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);

        env.ledger().set_timestamp(env.ledger().timestamp() + DISPUTE_WINDOW + 1);

        let sb = tc(&env, &usdc).balance(&seller);
        let pb = tc(&env, &usdc).balance(&pool);
        c.auto_release(&id);

        let ef = 500_000_000 * 500 / 10_000;
        assert_eq!(tc(&env, &usdc).balance(&seller) - sb, 500_000_000 - ef);
        assert_eq!(tc(&env, &usdc).balance(&pool) - pb, ef);
    }

    #[test]
    fn test_invalid_qr_rejected() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);

        let wrong = BytesN::from_array(&env, &[2u8; 32]);
        assert_eq!(c.try_confirm_pickup(&id, &wrong), Err(Ok(Error::InvalidQRProof)));
    }

    #[test]
    fn test_release_funds_fails_twice() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let secret = BytesN::from_array(&env, &[1u8; 32]);
        let hash = qr_hash(&env, &secret);
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &hash);
        c.lock_payment(&id, &500_000_000);
        c.confirm_pickup(&id, &secret);
        c.release_funds(&id);
        assert_eq!(c.try_release_funds(&id), Err(Ok(Error::AlreadyReleased)));
    }

    #[test]
    fn test_claim_unclaimed_after_timeout() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        env.ledger().set_timestamp(env.ledger().timestamp() + CREATED_TIMEOUT + 1);
        c.claim_unclaimed(&id);
        assert_eq!(c.try_get_escrow_status(&id), Err(Ok(Error::EscrowNotFound)));
    }

    #[test]
    fn test_claim_unclaimed_fails_before_timeout() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        assert_eq!(c.try_claim_unclaimed(&id), Err(Ok(Error::PaymentDeadlinePassed)));
    }

    #[test]
    fn test_lock_payment_fails_if_already_locked() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &500_000_000);
        assert_eq!(c.try_lock_payment(&id, &500_000_000), Err(Ok(Error::InvalidStateTransition)));
    }

    #[test]
    fn test_get_escrow_status_returns_correct_info() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 1, &buyer, &seller, &usdc, &h);
        let s = c.get_escrow_status(&id);
        assert_eq!(s.batch_id, 1);
        assert_eq!(s.buyer, buyer);
        assert_eq!(s.seller, seller);
        assert_eq!(s.sent_asset, usdc);
        assert_eq!(s.received_asset, usdc);
        assert_eq!(s.status, EscrowStatus::Created);
    }

    #[test]
    fn test_update_community_config() {
        let (env, _a, _s, _b, usdc, new_pool, _bt, c) = setup_env();
        c.update_community_config(&new_pool, &1000);
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);
        let id = c.create_escrow(&0, &buyer, &seller, &usdc, &usdc, &Vec::new(&env), &h);
        assert_eq!(id, 0);
    }

    #[test]
    fn test_lock_payment_stores_amount() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &750_000_000);
        assert_eq!(c.get_escrow_status(&id).amount_sent, 750_000_000);
    }

    #[test]
    fn test_double_dispute_fails() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &500_000_000);
        c.dispute(&id, &String::from_str(&env, "First"));
        assert_eq!(c.try_dispute(&id, &String::from_str(&env, "Second")), Err(Ok(Error::InvalidStateTransition)));
    }

    #[test]
    fn test_split_calculation_zero_bps() {
        let (s, f) = EscrowContract::calculate_split(1_000_000_000, 0);
        assert_eq!(f, 0);
        assert_eq!(s, 1_000_000_000);
    }

    #[test]
    fn test_split_calculation_full_bps() {
        let (s, f) = EscrowContract::calculate_split(1_000_000_000, 10_000);
        assert_eq!(f, 1_000_000_000);
        assert_eq!(s, 0);
    }

    #[test]
    fn test_split_calculation_default() {
        let (s, f) = EscrowContract::calculate_split(1_000_000_000, 500);
        assert_eq!(f, 50_000_000);
        assert_eq!(s, 950_000_000);
    }

    #[test]
    fn test_resolve_dispute_partial_release() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &500_000_000);
        c.dispute(&id, &String::from_str(&env, "D"));

        let bb = tc(&env, &usdc).balance(&buyer);
        let sb = tc(&env, &usdc).balance(&seller);
        c.resolve_dispute(&id, &2, &_a);

        assert_eq!(tc(&env, &usdc).balance(&buyer) - bb, 250_000_000);
        assert_eq!(tc(&env, &usdc).balance(&seller) - sb, 250_000_000);
    }

    #[test]
    fn test_resolve_dispute_full_release() {
        let (env, _a, seller, buyer, usdc, pool, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &500_000_000);
        c.dispute(&id, &String::from_str(&env, "D"));

        let sb = tc(&env, &usdc).balance(&seller);
        let pb = tc(&env, &usdc).balance(&pool);
        c.resolve_dispute(&id, &3, &_a);

        let ef = 500_000_000 * 500 / 10_000;
        assert_eq!(tc(&env, &usdc).balance(&seller) - sb, 500_000_000 - ef);
        assert_eq!(tc(&env, &usdc).balance(&pool) - pb, ef);
    }

    #[test]
    fn test_cannot_release_without_confirm() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        c.lock_payment(&id, &500_000_000);
        assert_eq!(c.try_release_funds(&id), Err(Ok(Error::InvalidStateTransition)));
    }

    #[test]
    fn test_dispute_from_created_state_rejected() {
        let (env, _a, seller, buyer, usdc, _p, _bt, c) = setup_env();
        let h = qr_hash(&env, &BytesN::from_array(&env, &[1u8; 32]));
        let id = create_escrow(&env, &c, 0, &buyer, &seller, &usdc, &h);
        assert_eq!(c.try_dispute(&id, &String::from_str(&env, "Nope")), Err(Ok(Error::InvalidStateTransition)));
    }
}
