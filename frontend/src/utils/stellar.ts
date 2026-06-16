import { isConnected, requestAccess } from "@stellar/freighter-api";

export interface EscrowTransaction {
  escrowId: number;
  batchId: number;
  buyer: string;
  seller: string;
  amount: number;
  asset: string;
  status: "Created" | "Locked" | "Released" | "Disputed" | "Resolved";
  disputeDeadline: number;
}

async function assertConnected(): Promise<void> {
  const connected = await isConnected();
  if (!connected) {
    await requestAccess();
  }
}

export async function createEscrowTransaction(
  _batchId: number,
  _seller: string,
  _amount: number,
  _asset: string
): Promise<{ escrowId: number }> {
  void _batchId; void _seller; void _amount; void _asset;
  await assertConnected();
  return { escrowId: Date.now() };
}

export async function lockPaymentTransaction(
  _escrowId: number
): Promise<{ success: boolean }> {
  void _escrowId;
  await assertConnected();
  return { success: true };
}

export async function confirmPickupTransaction(
  _escrowId: number,
  _qrSecret: string
): Promise<{ success: boolean }> {
  void _escrowId; void _qrSecret;
  await assertConnected();
  return { success: true };
}

export async function disputeTransaction(
  _escrowId: number,
  _reason: string
): Promise<{ success: boolean }> {
  void _escrowId; void _reason;
  await assertConnected();
  return { success: true };
}

export async function resolveDisputeTransaction(
  _escrowId: number,
  _resolution: "full_refund" | "partial_release" | "full_release"
): Promise<{ success: boolean }> {
  void _escrowId; void _resolution;
  await assertConnected();
  return { success: true };
}
