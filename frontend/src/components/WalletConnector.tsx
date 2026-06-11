import { useWalletStore } from "@/stores/useWalletStore";

export default function WalletConnector() {
  const { publicKey, isConnected, connect, disconnect } = useWalletStore();

  return (
    <div className="flex items-center gap-3">
      {isConnected && publicKey ? (
        <>
          <span className="hidden sm:inline text-sm text-buildcycle-gray-600">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="px-3 py-1.5 text-sm border border-buildcycle-gray-300 rounded-lg text-buildcycle-gray-700 hover:bg-buildcycle-gray-100 transition"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          className="px-4 py-1.5 text-sm font-medium bg-buildcycle-orange-500 text-white rounded-lg hover:bg-buildcycle-orange-600 transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
