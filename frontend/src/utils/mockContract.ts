export type EscrowStatus = "Created" | "Locked" | "Released" | "Disputed" | "Resolved";

interface MockEscrow {
  id: number;
  batchId: number;
  batchTitle: string;
  buyer: string;
  seller: string;
  amount: number;
  asset: string;
  status: EscrowStatus;
  disputeDeadline: number;
  createdAt: number;
  disputeReason?: string;
}

let escrowCounter = 100;
const escrows: MockEscrow[] = [
  {
    id: 101, batchId: 1, batchTitle: "Oak Hardwood Planks",
    buyer: "BuyerA", seller: "GCCON123", amount: 450,
    asset: "USDC", status: "Released", disputeDeadline: Date.now() + 86400000 * 7,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 102, batchId: 4, batchTitle: "PVC Schedule 40 Pipe",
    buyer: "BuyerB", seller: "BRKLYNDEV", amount: 320,
    asset: "EURC", status: "Locked", disputeDeadline: Date.now() + 86400000 * 5,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 103, batchId: 6, batchTitle: "Reclaimed Barn Wood",
    buyer: "BuyerC", seller: "GCCON123", amount: 900,
    asset: "USDC", status: "Disputed", disputeDeadline: Date.now() + 86400000 * 3,
    createdAt: Date.now() - 86400000 * 1,
    disputeReason: "Material condition does not match description",
  },
  {
    id: 104, batchId: 11, batchTitle: "Commercial Sink",
    buyer: "BuyerD", seller: "BRKLYNDEV", amount: 550,
    asset: "USDC", status: "Created", disputeDeadline: Date.now() + 86400000 * 14,
    createdAt: Date.now() - 3600000,
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockCreateEscrow(
  batchId: number,
  batchTitle: string,
  seller: string,
  amount: number,
  asset: string
): Promise<{ escrowId: number }> {
  await delay(1200);
  escrowCounter++;
  const escrow: MockEscrow = {
    id: escrowCounter,
    batchId,
    batchTitle,
    buyer: "You",
    seller,
    amount,
    asset,
    status: "Created",
    disputeDeadline: Date.now() + 86400000 * 14,
    createdAt: Date.now(),
  };
  escrows.push(escrow);
  return { escrowId: escrow.id };
}

export async function mockLockPayment(escrowId: number): Promise<{ success: boolean }> {
  await delay(1500);
  const escrow = escrows.find((e) => e.id === escrowId);
  if (escrow) escrow.status = "Locked";
  return { success: true };
}

export async function mockConfirmPickup(escrowId: number, _qrSecret: string): Promise<{ success: boolean }> {
  void _qrSecret;
  await delay(1000);
  const escrow = escrows.find((e) => e.id === escrowId);
  if (escrow) escrow.status = "Released";
  return { success: true };
}

export async function mockDispute(escrowId: number, reason: string): Promise<{ success: boolean }> {
  await delay(800);
  const escrow = escrows.find((e) => e.id === escrowId);
  if (escrow) {
    escrow.status = "Disputed";
    escrow.disputeReason = reason;
  }
  return { success: true };
}

export async function mockResolveDispute(
  escrowId: number,
  _resolution: "full_refund" | "partial_release" | "full_release"
): Promise<{ success: boolean }> {
  void _resolution;
  await delay(1000);
  const escrow = escrows.find((e) => e.id === escrowId);
  if (escrow) escrow.status = "Resolved";
  return { success: true };
}

export function getMockEscrows(): MockEscrow[] {
  return [...escrows];
}

export function getMockEscrowById(id: number): MockEscrow | undefined {
  return escrows.find((e) => e.id === id);
}
