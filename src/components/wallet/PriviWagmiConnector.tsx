import { useEffect, useRef } from 'react';
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
  const connectionAttemptedRef = useRef(false);

  // Log key states for debugging
  useEffect(() => {
    console.log('PrivyWagmiConnector state:', {
      ready,
      authenticated,
      walletsCount: wallets.length,
      availableConnectors: connectors.map(c => c.id)
    });
  }, [ready, authenticated, wallets, connectors]);

  useEffect(() => {
    // Reset the connection attempt flag when the wallet state changes
    if (!ready || !authenticated) {
      connectionAttemptedRef.current = false;
    }
    
    if (!ready || !authenticated) return;
    
    // Check if we have wallets to connect
    if (wallets.length === 0) {
      console.log('No wallets available in Privy');
      return;
    }

    // Prevent multiple connection attempts
    if (connectionAttemptedRef.current) return;
    
    const syncWalletsToWagmi = async () => {
      try {
        connectionAttemptedRef.current = true;
        console.log('Attempting to sync Privy wallet with Wagmi');
        
        // Find the first embedded wallet or the first wallet in the list
        const activeWallet = wallets.find(wallet => wallet.walletClientType === 'privy') || wallets[0];
        
        if (!activeWallet) {
          console.log('No active wallet found');
          return;
        }

        console.log('Found active wallet:', activeWallet.walletClientType);

        // Find the injected connector from wagmi
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (!injectedConnector) {
          console.log('No injected connector found');
          return;
        }

        // Get the provider from the Privy wallet
        console.log('Getting Ethereum provider from wallet');
        const provider = await activeWallet.getEthereumProvider();
        if (!provider) {
          console.log('No provider available from wallet');
          return;
        }

        // Make the provider available globally (temporary for wagmi to detect)
        console.log('Setting window.ethereum provider');
        // @ts-ignore - Adding ethereum provider to window
        window.ethereum = provider;

        // Connect wagmi to the injected provider
        console.log('Connecting to Wagmi with injected connector');
        await connect({ connector: injectedConnector });
        console.log('Successfully connected to Wagmi');
      } catch (error) {
        console.error('Error syncing Privy wallet with Wagmi:', error);
        // Reset the flag after a delay to allow for retry
        setTimeout(() => {
          connectionAttemptedRef.current = false;
        }, 5000);
      }
    };

    syncWalletsToWagmi();
  }, [ready, authenticated, wallets, connect, connectors]);

  return null;
};

export default PrivyWagmiConnector;