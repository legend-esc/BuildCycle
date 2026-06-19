#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub proposer: Address,
    pub recipient_address: Address,
    pub name: String,
    pub proof_doc_cid: String,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Recipient {
    pub address: Address,
    pub name: String,
    pub proof_doc_cid: String,
    pub approved: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DistributionRecord {
    pub recipient_id: u32,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Admin,
    Initialized,
    Proposal(u32),
    ProposalCounter,
    Recipient(u32),
    RecipientCounter,
    Distribution(u32),
    DistributionCounter,
    RecipientDistributions(u32),
    PoolBalance,
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ProposalNotFound = 4,
    RecipientNotFound = 5,
    ProposalNotActive = 6,
    RecipientNotApproved = 7,
    InsufficientBalance = 8,
    InvalidInput = 9,
}

const MIN_VOTES_TO_APPROVE: u32 = 3;

#[contract]
pub struct CommunityPoolContract;

#[contractimpl]
impl CommunityPoolContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&StorageKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&StorageKey::Admin, &admin);
        env.storage().instance().set(&StorageKey::Initialized, &true);
        env.storage().instance().set(&StorageKey::PoolBalance, &0i128);
        Ok(())
    }

    pub fn propose_recipient(
        env: Env,
        address: Address,
        name: String,
        proof_doc_cid: String,
    ) -> Result<u32, Error> {
        Self::require_initialized(&env)?;

        let proposal_id: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::ProposalCounter)
            .unwrap_or(0);

        let proposal = Proposal {
            proposer: address.clone(),
            recipient_address: address,
            name,
            proof_doc_cid,
            yes_votes: 0,
            no_votes: 0,
            active: true,
        };

        env.storage()
            .instance()
            .set(&StorageKey::Proposal(proposal_id), &proposal);
        env.storage()
            .instance()
            .set(&StorageKey::ProposalCounter, &(proposal_id + 1));

        Ok(proposal_id)
    }

    pub fn vote_recipient(env: Env, proposal_id: u32, approve: bool) -> Result<(), Error> {
        Self::require_initialized(&env)?;

        let mut proposal: Proposal = env
            .storage()
            .instance()
            .get(&StorageKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;

        if !proposal.active {
            return Err(Error::ProposalNotActive);
        }

        if approve {
            proposal.yes_votes += 1;
        } else {
            proposal.no_votes += 1;
        }

        if proposal.yes_votes >= MIN_VOTES_TO_APPROVE {
            proposal.active = false;
            let recipient_id: u32 = env
                .storage()
                .instance()
                .get(&StorageKey::RecipientCounter)
                .unwrap_or(0);
            let recipient = Recipient {
                address: proposal.recipient_address.clone(),
                name: proposal.name.clone(),
                proof_doc_cid: proposal.proof_doc_cid.clone(),
                approved: true,
            };
            env.storage()
                .instance()
                .set(&StorageKey::Recipient(recipient_id), &recipient);
            env.storage()
                .instance()
                .set(&StorageKey::RecipientCounter, &(recipient_id + 1));
        }

        env.storage()
            .instance()
            .set(&StorageKey::Proposal(proposal_id), &proposal);

        Ok(())
    }

    pub fn distribute(
        env: Env,
        recipient_id: u32,
        amount: i128,
        token_address: Address,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;

        let admin: Address = env.storage().instance().get(&StorageKey::Admin).unwrap();
        admin.require_auth();

        let recipient: Recipient = env
            .storage()
            .instance()
            .get(&StorageKey::Recipient(recipient_id))
            .ok_or(Error::RecipientNotFound)?;

        if !recipient.approved {
            return Err(Error::RecipientNotApproved);
        }

        let balance: i128 = env
            .storage()
            .instance()
            .get(&StorageKey::PoolBalance)
            .unwrap_or(0);
        if amount > balance {
            return Err(Error::InsufficientBalance);
        }

        let token = token::Client::new(&env, &token_address);
        token.transfer(&env.current_contract_address(), &recipient.address, &amount);

        env.storage()
            .instance()
            .set(&StorageKey::PoolBalance, &(balance - amount));

        let dist_id: u32 = env
            .storage()
            .instance()
            .get(&StorageKey::DistributionCounter)
            .unwrap_or(0);

        let dist = DistributionRecord {
            recipient_id,
            amount,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&StorageKey::Distribution(dist_id), &dist);

        let mut dist_list: Vec<u32> = env
            .storage()
            .instance()
            .get(&StorageKey::RecipientDistributions(recipient_id))
            .unwrap_or(Vec::new(&env));
        dist_list.push_back(dist_id);
        env.storage()
            .instance()
            .set(
                &StorageKey::RecipientDistributions(recipient_id),
                &dist_list,
            );

        env.storage()
            .instance()
            .set(&StorageKey::DistributionCounter, &(dist_id + 1));

        Ok(())
    }

    pub fn receive_fee(env: Env, amount: i128) -> Result<(), Error> {
        Self::require_initialized(&env)?;

        let balance: i128 = env
            .storage()
            .instance()
            .get(&StorageKey::PoolBalance)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&StorageKey::PoolBalance, &(balance + amount));

        Ok(())
    }

    pub fn get_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&StorageKey::PoolBalance)
            .unwrap_or(0)
    }

    pub fn get_distribution_history(env: Env, recipient_id: u32) -> Vec<DistributionRecord> {
        let dist_ids: Vec<u32> = env
            .storage()
            .instance()
            .get(&StorageKey::RecipientDistributions(recipient_id))
            .unwrap_or(Vec::new(&env));

        let mut result: Vec<DistributionRecord> = Vec::new(&env);
        for i in 0..dist_ids.len() {
            if let Some(dist) = env
                .storage()
                .instance()
                .get::<_, DistributionRecord>(&StorageKey::Distribution(
                    dist_ids.get(i).unwrap(),
                ))
            {
                result.push_back(dist);
            }
        }
        result
    }

    pub fn get_recipient(env: Env, recipient_id: u32) -> Result<Recipient, Error> {
        env.storage()
            .instance()
            .get(&StorageKey::Recipient(recipient_id))
            .ok_or(Error::RecipientNotFound)
    }

    fn require_initialized(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&StorageKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, Address, Address, CommunityPoolContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let usdc = env.register_stellar_asset_contract_v2(admin.clone()).address();

        let contract_id = env.register_contract(None, CommunityPoolContract);
        let client = CommunityPoolContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        (env, admin, usdc, client)
    }

    // --- propose_recipient ---

    #[test]
    fn propose_creates_proposal() {
        let (_env, _admin, _usdc, client) = setup();
        let addr = Address::generate(&_env);
        let name = String::from_str(&_env, "Tool Library");
        let cid = String::from_str(&_env, "QmProposal1");

        let id = client.propose_recipient(&addr, &name, &cid);
        assert_eq!(id, 0);
    }

    #[test]
    fn propose_increments_id() {
        let (_env, _admin, _usdc, client) = setup();
        let addr = Address::generate(&_env);
        let name = String::from_str(&_env, "TL");
        let cid = String::from_str(&_env, "cid1");

        assert_eq!(client.propose_recipient(&addr, &name, &cid), 0);
        assert_eq!(client.propose_recipient(&addr, &name, &cid), 1);
    }

    // --- vote_recipient ---

    #[test]
    fn vote_approve_creates_recipient_after_threshold() {
        let (env, _admin, _usdc, client) = setup();
        let addr = Address::generate(&env);
        let name = String::from_str(&env, "Tool Library");
        let cid = String::from_str(&env, "QmDoc1");

        let pid = client.propose_recipient(&addr, &name, &cid);

        client.vote_recipient(&pid, &true);
        client.vote_recipient(&pid, &true);
        let recipient = client.vote_recipient(&pid, &true);

        let stored = client.get_recipient(&0);
        assert_eq!(stored.address, addr);
        assert_eq!(stored.name, name);
        assert!(stored.approved);

        assert_eq!(recipient, ());
    }

    #[test]
    fn vote_reject_does_not_approve() {
        let (_env, _admin, _usdc, client) = setup();
        let addr = Address::generate(&_env);
        let name = String::from_str(&_env, "Bad Org");
        let cid = String::from_str(&_env, "QmBad");

        let pid = client.propose_recipient(&addr, &name, &cid);
        client.vote_recipient(&pid, &false);
        client.vote_recipient(&pid, &false);
        client.vote_recipient(&pid, &false);

        assert_eq!(
            client.try_get_recipient(&0),
            Err(Ok(Error::RecipientNotFound))
        );
    }

    #[test]
    fn vote_fails_on_inactive_proposal() {
        let (_env, _admin, _usdc, client) = setup();
        let addr = Address::generate(&_env);
        let name = String::from_str(&_env, "TL");
        let cid = String::from_str(&_env, "cid");

        let pid = client.propose_recipient(&addr, &name, &cid);
        client.vote_recipient(&pid, &true);
        client.vote_recipient(&pid, &true);
        client.vote_recipient(&pid, &true);

        assert_eq!(
            client.try_vote_recipient(&pid, &true),
            Err(Ok(Error::ProposalNotActive))
        );
    }

    // --- distribute ---

    #[test]
    fn distribute_sends_funds_to_recipient() {
        let (env, _admin, usdc, _client) = setup();
        let addr = Address::generate(&env);
        let name = String::from_str(&env, "TL");
        let cid = String::from_str(&env, "cid");

        let contract_id = env.register_contract(None, CommunityPoolContract);

        let sac = token::StellarAssetClient::new(&env, &usdc);
        sac.mint(&contract_id, &1_000_000);

        let pool_client = CommunityPoolContractClient::new(&env, &contract_id);
        pool_client.initialize(&_admin);

        pool_client.receive_fee(&1_000_000);

        let pid = pool_client.propose_recipient(&addr, &name, &cid);
        pool_client.vote_recipient(&pid, &true);
        pool_client.vote_recipient(&pid, &true);
        pool_client.vote_recipient(&pid, &true);

        let bb = soroban_sdk::token::Client::new(&env, &usdc).balance(&addr);
        pool_client.distribute(&0, &500_000, &usdc);
        let ab = soroban_sdk::token::Client::new(&env, &usdc).balance(&addr);
        assert_eq!(ab - bb, 500_000);
    }

    #[test]
    fn distribute_fails_if_not_approved() {
        let (_env, _admin, usdc, client) = setup();

        assert_eq!(
            client.try_distribute(&0, &100, &usdc),
            Err(Ok(Error::RecipientNotFound))
        );
    }

    #[test]
    fn distribute_fails_if_insufficient_balance() {
        let (_env, _admin, usdc, client) = setup();
        let addr = Address::generate(&_env);
        let name = String::from_str(&_env, "TL");
        let cid = String::from_str(&_env, "cid");

        let pid = client.propose_recipient(&addr, &name, &cid);
        client.vote_recipient(&pid, &true);
        client.vote_recipient(&pid, &true);
        client.vote_recipient(&pid, &true);

        assert_eq!(
            client.try_distribute(&0, &100, &usdc),
            Err(Ok(Error::InsufficientBalance))
        );
    }

    // --- receive_fee / get_balance ---

    #[test]
    fn receive_fee_increases_balance() {
        let (_env, _admin, _usdc, client) = setup();
        assert_eq!(client.get_balance(), 0);

        client.receive_fee(&1000);
        assert_eq!(client.get_balance(), 1000);

        client.receive_fee(&500);
        assert_eq!(client.get_balance(), 1500);
    }

    // --- get_distribution_history ---

    #[test]
    fn distribution_history_tracks_records() {
        let (env, admin, usdc, _client) = setup();

        let sac = token::StellarAssetClient::new(&env, &usdc);
        let contract_id = env.register_contract(None, CommunityPoolContract);
        sac.mint(&contract_id, &10_000_000);

        let pool_client = CommunityPoolContractClient::new(&env, &contract_id);
        pool_client.initialize(&admin);

        pool_client.receive_fee(&10_000_000);

        let addr = Address::generate(&env);
        let pid = pool_client.propose_recipient(&addr, &String::from_str(&env, "TL"), &String::from_str(&env, "cid"));
        pool_client.vote_recipient(&pid, &true);
        pool_client.vote_recipient(&pid, &true);
        pool_client.vote_recipient(&pid, &true);

        pool_client.distribute(&0, &1_000_000, &usdc);
        pool_client.distribute(&0, &2_000_000, &usdc);

        let hist = pool_client.get_distribution_history(&0);
        assert_eq!(hist.len(), 2);
        assert_eq!(hist.get(0).unwrap().amount, 1_000_000);
        assert_eq!(hist.get(1).unwrap().amount, 2_000_000);
    }

    #[test]
    fn get_balance_starts_zero() {
        let (_env, _admin, _usdc, client) = setup();
        assert_eq!(client.get_balance(), 0);
    }
}
