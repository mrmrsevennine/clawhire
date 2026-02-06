import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { address, balance, connected, connect, disconnect, truncatedAddress } = useWallet();

  if (connected && address) {
    return (
      <button
        onClick={disconnect}
        className="ml-2 px-3 py-2.5 text-sm rounded-xl bg-white border border-slate-200 flex items-center gap-3 hover:border-slate-300 transition-all hover:shadow-sm"
      >
        <span className="font-mono text-slate-500 text-xs">{truncatedAddress}</span>
        <span className="font-heading font-semibold text-teal-700">${balance}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="ml-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-all hover:shadow-sm"
    >
      Connect
    </button>
  );
}
