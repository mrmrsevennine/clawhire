import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { address, balance, connected, connect, disconnect, truncatedAddress } = useWallet();

  if (connected && address) {
    return (
      <button
        onClick={disconnect}
        className="ml-2 px-3 py-2.5 text-sm rounded-3xl bg-cream-50 border border-sand-200 flex items-center gap-3 hover:border-sand-300 transition-all hover:shadow-sm"
      >
        <span className="font-mono text-sand-500 text-xs">{truncatedAddress}</span>
        <span className="font-heading font-semibold text-accent-700">${balance}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="ml-2 px-4 py-2.5 text-sm font-medium rounded-3xl bg-cream-50 border border-sand-200 text-bark-700 hover:border-accent-300 hover:text-accent-700 transition-all hover:shadow-sm"
    >
      Connect
    </button>
  );
}
