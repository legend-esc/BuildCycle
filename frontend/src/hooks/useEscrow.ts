import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createEscrowTransaction,
  lockPaymentTransaction,
  confirmPickupTransaction,
  disputeTransaction,
  resolveDisputeTransaction,
} from "@/utils/stellar";
import {
  mockCreateEscrow,
  mockLockPayment,
  mockConfirmPickup,
  mockDispute,
  mockResolveDispute,
  getMockEscrows,
  getMockEscrowById,
} from "@/utils/mockContract";
import { useWalletStore } from "@/stores/useWalletStore";

function useRealContract() {
  return useWalletStore((s) => s.isConnected);
}

export function useCreateEscrow() {
  const useContract = useRealContract();
  return useMutation({
    mutationFn: async ({
      batchId,
      batchTitle,
      seller,
      amount,
      asset,
    }: {
      batchId: number;
      batchTitle: string;
      seller: string;
      amount: number;
      asset: string;
    }) => {
      if (useContract) {
        return createEscrowTransaction(batchId, seller, amount, asset);
      }
      return mockCreateEscrow(batchId, batchTitle, seller, amount, asset);
    },
  });
}

export function useLockPayment() {
  const useContract = useRealContract();
  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: number }) => {
      if (useContract) {
        return lockPaymentTransaction(escrowId);
      }
      return mockLockPayment(escrowId);
    },
  });
}

export function useConfirmPickup() {
  const useContract = useRealContract();
  return useMutation({
    mutationFn: async ({ escrowId, qrSecret }: { escrowId: number; qrSecret: string }) => {
      if (useContract) {
        return confirmPickupTransaction(escrowId, qrSecret);
      }
      return mockConfirmPickup(escrowId, qrSecret);
    },
  });
}

export function useDispute() {
  const useContract = useRealContract();
  return useMutation({
    mutationFn: async ({ escrowId, reason }: { escrowId: number; reason: string }) => {
      if (useContract) {
        return disputeTransaction(escrowId, reason);
      }
      return mockDispute(escrowId, reason);
    },
  });
}

export function useResolveDispute() {
  const useContract = useRealContract();
  return useMutation({
    mutationFn: async ({
      escrowId,
      resolution,
    }: {
      escrowId: number;
      resolution: "full_refund" | "partial_release" | "full_release";
    }) => {
      if (useContract) {
        return resolveDisputeTransaction(escrowId, resolution);
      }
      return mockResolveDispute(escrowId, resolution);
    },
  });
}

export function useEscrows() {
  return useQuery({
    queryKey: ["escrows"],
    queryFn: async () => {
      return getMockEscrows();
    },
    refetchInterval: 10000,
  });
}

export function useEscrow(id: number) {
  return useQuery({
    queryKey: ["escrow", id],
    queryFn: async () => {
      return getMockEscrowById(id) || null;
    },
    refetchInterval: 5000,
  });
}
