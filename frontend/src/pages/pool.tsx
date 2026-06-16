import { useState } from "react";
import { useWalletStore } from "@/stores/useWalletStore";

interface Proposal {
  id: number;
  recipient: string;
  name: string;
  proofDocCid: string;
  votesFor: number;
  votesAgainst: number;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

interface Distribution {
  id: number;
  recipientId: number;
  recipientName: string;
  amount: number;
  asset: string;
  timestamp: number;
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: 1, recipient: "GCLEANUP", name: "Cleanup Equipment", proofDocCid: "QmCleanup1", votesFor: 5, votesAgainst: 1, status: "approved", createdAt: Date.now() - 86400000 * 10 },
  { id: 2, recipient: "GTOOLS", name: "Tool Library Restock", proofDocCid: "QmTools2", votesFor: 3, votesAgainst: 2, status: "pending", createdAt: Date.now() - 86400000 * 3 },
  { id: 3, recipient: "GCOMM", name: "Community Workshop", proofDocCid: "QmComm3", votesFor: 1, votesAgainst: 4, status: "rejected", createdAt: Date.now() - 86400000 * 7 },
];

const MOCK_DISTRIBUTIONS: Distribution[] = [
  { id: 1, recipientId: 1, recipientName: "Cleanup Equipment", amount: 500, asset: "USDC", timestamp: Date.now() - 86400000 * 5 },
  { id: 2, recipientId: 2, recipientName: "Tool Library Restock", amount: 250, asset: "USDC", timestamp: Date.now() - 86400000 * 1 },
];

export default function PoolDashboard() {
  const { isConnected } = useWalletStore();
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formDoc, setFormDoc] = useState("");

  const poolBalance = 12500;

  function handleSubmitProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) return;
    const newProposal: Proposal = {
      id: Date.now(),
      recipient: formAddress,
      name: formName,
      proofDocCid: formDoc || "QmNone",
      votesFor: 0,
      votesAgainst: 0,
      status: "pending",
      createdAt: Date.now(),
    };
    setProposals((prev) => [newProposal, ...prev]);
    setShowForm(false);
    setFormName("");
    setFormAddress("");
    setFormDoc("");
  }

  function handleVote(id: number, approve: boolean) {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              votesFor: approve ? p.votesFor + 1 : p.votesFor,
              votesAgainst: approve ? p.votesAgainst : p.votesAgainst + 1,
            }
          : p
      )
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-2">Community Pool</h1>
      <p className="text-sm text-buildcycle-gray-500 mb-6">
        Funded by 5% of every escrow transaction. Community members propose and vote on how funds are distributed.
      </p>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-buildcycle-orange-500 to-buildcycle-orange-700 rounded-xl p-6 text-white mb-8">
        <p className="text-sm opacity-80">Pool Balance</p>
        <p className="text-4xl font-bold mt-1">{poolBalance.toLocaleString()} USDC</p>
        <p className="text-xs opacity-60 mt-1">Distributed: {MOCK_DISTRIBUTIONS.reduce((s, d) => s + d.amount, 0)} USDC</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Proposals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Proposals</h2>
            {isConnected && (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs px-3 py-1.5 bg-buildcycle-orange-500 text-white rounded-lg hover:bg-buildcycle-orange-600 transition"
              >
                + New Proposal
              </button>
            )}
          </div>

          <div className="space-y-3">
            {proposals.length === 0 ? (
              <p className="text-sm text-buildcycle-gray-400 py-4">No proposals yet.</p>
            ) : (
              proposals.map((proposal) => (
                <div key={proposal.id} className="bg-white border border-buildcycle-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-buildcycle-gray-800">{proposal.name}</h3>
                      <p className="text-xs text-buildcycle-gray-400">Recipient: {proposal.recipient}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      proposal.status === "approved" ? "bg-green-100 text-green-700" :
                      proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {proposal.status}
                    </span>
                  </div>

                  {proposal.proofDocCid !== "QmNone" && (
                    <p className="text-xs text-buildcycle-gray-400">
                      Proof: <span className="font-mono">{proposal.proofDocCid}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-buildcycle-gray-500 pt-1">
                    <span>{proposal.votesFor} for &middot; {proposal.votesAgainst} against</span>
                    {proposal.status === "pending" && isConnected && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleVote(proposal.id, true)}
                          className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVote(proposal.id, false)}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribution History */}
        <div>
          <h2 className="text-lg font-semibold text-buildcycle-gray-800 mb-4">Distribution History</h2>
          <div className="space-y-3">
            {MOCK_DISTRIBUTIONS.length === 0 ? (
              <p className="text-sm text-buildcycle-gray-400 py-4">No distributions yet.</p>
            ) : (
              MOCK_DISTRIBUTIONS.map((d) => (
                <div key={d.id} className="bg-white border border-buildcycle-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-buildcycle-gray-800">{d.recipientName}</h3>
                      <p className="text-xs text-buildcycle-gray-400">
                        {new Date(d.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-buildcycle-orange-600">
                      +{d.amount} {d.asset}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Proposal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-buildcycle-gray-800">New Proposal</h2>
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-buildcycle-gray-600 mb-1">Recipient Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="G..."
                  className="w-full border border-buildcycle-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-buildcycle-orange-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-buildcycle-gray-600 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Roof Repair Fund"
                  className="w-full border border-buildcycle-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-buildcycle-orange-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-buildcycle-gray-600 mb-1">Proof Document CID (optional)</label>
                <input
                  type="text"
                  value={formDoc}
                  onChange={(e) => setFormDoc(e.target.value)}
                  placeholder="Qm..."
                  className="w-full border border-buildcycle-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-buildcycle-orange-400"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-buildcycle-orange-500 text-white rounded-lg hover:bg-buildcycle-orange-600 transition"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
