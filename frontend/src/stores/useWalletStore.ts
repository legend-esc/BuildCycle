import { create } from "zustand";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  isConnected: false,
  connect: async () => {
    try {
      const freighter = await import("@stellar/freighter-api");
      const { requestAccess } = freighter;
      const result = await requestAccess();
      if (result.error) {
        alert(result.error);
        return;
      }
      set({ publicKey: result.address, isConnected: true });
    } catch {
      alert("Freighter extension not detected. Please install Freighter.");
    }
  },
  disconnect: () => set({ publicKey: null, isConnected: false }),
}));
