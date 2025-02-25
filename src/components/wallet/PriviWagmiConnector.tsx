import { useEffect } from 'react';
import { useConnect } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * This component synchronizes Privy wallet connections with Wagmi
 * It doesn't render anything - just connects the state between the two libraries
 */
export const PrivyWagmiConnector: React.FC = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (!ready || !authenticated || wallets.length === 0) return;

    const syncWalletsToWagmi = async () => {
      try {
        // Find the first embedded wallet or the first wallet in the list
        const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
        
        if (!activeWallet) return;

        // Find the injected connector from wagmi
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (!injectedConnector) return;

        // Get the provider from the Privy wallet
        const provider = await activeWallet.getEthereumProvider();
        if (!provider) return;

        // Make the provider available globally (temporary for wagmi to detect)
        // @ts-ignore - Adding ethereum provider to window
        window.ethereum = provider;

        // Connect wagmi to the injected provider
        connect({ connector: injectedConnector });
      } catch (error) {
        console.error('Error syncing Privy wallet with Wagmi:', error);
      }
    };

    syncWalletsToWagmi();
  }, [ready, authenticated, wallets, connect, connectors]);

  return null;
};

export default PrivyWagmiConnector;