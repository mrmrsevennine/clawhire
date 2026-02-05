import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { address, balance, connected, connect, disconnect, truncatedAddress } = useWallet();

  if (connected && address) {
    return (
      <button
        onClick={disconnect}
        className="px-3 py-2 text-sm rounded-lg bg-dark-800 border border-dark-700 flex items-center gap-3 hover:border-dark-600 transition-colors"
      >
        <span className="font-mono text-dark-300">{truncatedAddress}</span>
        <span className="font-semibold text-usdc-400">${balance}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-dark-800 border border-dark-700 text-dark-200 hover:border-usdc-500/50 hover:text-usdc-400 transition-colors"
    >
      Connect
    </button>
  );
}
