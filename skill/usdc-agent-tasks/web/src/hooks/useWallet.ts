import { useCallback, useEffect } from 'react';
import { BrowserProvider, formatUnits, Contract } from 'ethers';
import { useStore } from '../store';
import { CHAIN_ID, CHAIN_NAME, RPC_URL, BLOCK_EXPLORER, USDC_ADDRESS, ERC20_ABI } from '../lib/contract';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isConnected?: () => boolean;
      selectedAddress?: string | null;
    };
  }
}

async function switchToNetwork() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + CHAIN_ID.toString(16) }],
    });
  } catch (err: unknown) {
    const switchError = err as { code: number };
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x' + CHAIN_ID.toString(16),
          chainName: CHAIN_NAME,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [BLOCK_EXPLORER],
        }],
      });
    }
  }
}

async function getUsdcBalance(provider: BrowserProvider, address: string): Promise<string> {
  try {
    const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const balance = await usdc.balanceOf(address);
    return formatUnits(balance, 6);
  } catch {
    return '0.00';
  }
}

export function useWallet() {
  const { wallet, setWallet, disconnectWallet } = useStore();

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    try {
      await switchToNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await getUsdcBalance(provider, address);
      setWallet({ address, balance, connected: true });
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  }, [setWallet]);

  const disconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Update balance periodically when connected
  const refreshBalance = useCallback(async () => {
    if (!wallet.connected || !wallet.address || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await getUsdcBalance(provider, wallet.address);
      setWallet({ balance });
    } catch {
      // Silent fail on balance refresh
    }
  }, [wallet.connected, wallet.address, setWallet]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accts = accounts as string[];
      if (accts.length === 0) {
        // User disconnected
        disconnectWallet();
      } else if (wallet.connected && accts[0] !== wallet.address) {
        // User switched accounts
        const provider = new BrowserProvider(window.ethereum!);
        const balance = await getUsdcBalance(provider, accts[0]);
        setWallet({ address: accts[0], balance, connected: true });
      }
    };

    const handleChainChanged = () => {
      // Reload on chain change to ensure consistency
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet.connected, wallet.address, setWallet, disconnectWallet]);

  // Refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!wallet.connected) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [wallet.connected, refreshBalance]);

  return {
    ...wallet,
    connect,
    disconnect,
    refreshBalance,
    truncatedAddress: wallet.address
      ? wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4)
      : null,
  };
}
