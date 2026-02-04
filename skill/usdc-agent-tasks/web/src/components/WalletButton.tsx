import { useWallet } from '../hooks/useWallet';

export default function WalletButton() {
  const { address, balance, connected, connect, disconnect, truncatedAddress } = useWallet();

  if (connected && address) {
    return (
      <button
        onClick={disconnect}
        className="brutal-btn px-3 py-2 text-xs bg-brutal-blue flex items-center gap-2"
      >
        <span className="font-mono font-bold">{truncatedAddress}</span>
        <span className="font-bold">${balance} USDC</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="brutal-btn px-3 py-2 text-xs sm:text-sm bg-brutal-yellow"
    >
      🔗 CONNECT
    </button>
  );
}
