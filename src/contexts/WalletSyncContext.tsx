import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";

// Define the context type
interface WalletSyncContextType {
  twitterLinkedAddress: string | null;
  isTwitterLinkedToAnotherWallet: boolean;
  isPrivyAuthenticated: boolean;
  walletMismatchError: string | null;
  unlinkTwitter: () => Promise<void>;
}

// Create a context with default values
const WalletSyncContext = createContext<WalletSyncContextType>({
  twitterLinkedAddress: null,
  isTwitterLinkedToAnotherWallet: false,
  isPrivyAuthenticated: false,
  walletMismatchError: null,
  unlinkTwitter: async () => {},
});

/**
 * This provider component synchronizes wallet states between RainbowKit/wagmi and Privy
 * When a wallet is disconnected or switched in RainbowKit, it will call Privy's logout
 * It also tracks which wallet has a X account linked to it
 */
export const WalletSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { logout, user, authenticated, linkWallet, unlinkTwitter } = usePrivy();
  const { address, isConnected } = useAccount();
  const [twitterLinkedAddress, setTwitterLinkedAddress] = useState<
    string | null
  >(null);
  const [isPrivyAuthenticated, setIsPrivyAuthenticated] = useState(false);
  const [walletMismatchError, setWalletMismatchError] = useState<string | null>(null);

  // References to track previous connection state and address
  const prevConnectedRef = useRef(false);
  const prevAddressRef = useRef<string | undefined>(undefined);

  // Check if the current address has a X account linked
  const hasTwitterLinked = user?.linkedAccounts?.some(
    (account) => account.type === "twitter_oauth"
  );

  // Update authentication status when Privy auth state changes
  useEffect(() => {
    setIsPrivyAuthenticated(authenticated);
  }, [authenticated]);

  // Handle Twitter wallet link and enforce consistency with RainbowKit wallet
  useEffect(() => {
    if (hasTwitterLinked && user) {
      const linkedWalletAddress = user.wallet?.address ?? null;
      setTwitterLinkedAddress(linkedWalletAddress);

      // Check if the Twitter-linked wallet matches the currently connected wallet
      if (linkedWalletAddress && address && linkedWalletAddress.toLowerCase() !== address.toLowerCase()) {
        console.warn("Twitter linked to different wallet than the one connected in RainbowKit");
        setWalletMismatchError(
          `Your X account is linked to wallet ${linkedWalletAddress.slice(0, 6)}...${linkedWalletAddress.slice(-4)}, ` +
          `but you are currently connected with ${address.slice(0, 6)}...${address.slice(-4)}. ` +
          `Please connect with the correct wallet or unlink your X account.`
        );
      } else {
        setWalletMismatchError(null);
      }
    }
  }, [hasTwitterLinked, user, address]);

  // Handle Privy wallet linking separately
  const walletLinkAttemptedRef = useRef(false);
  
  useEffect(() => {
    if (isConnected && authenticated && user?.wallet === undefined && !walletLinkAttemptedRef.current) {
      console.log("Linking wallet to Privy");
      walletLinkAttemptedRef.current = true;
      
      // Use setTimeout to avoid potential infinite loop
      setTimeout(() => {
        try {
          linkWallet({ suggestedAddress: address });
        } catch (error) {
          console.error("Error linking wallet to Privy:", error);
          // Reset after delay to allow for retry
          setTimeout(() => {
            walletLinkAttemptedRef.current = false;
          }, 5000);
        }
      }, 100);
    }
    
    // Reset the flag if user or connection state changes
    if (!isConnected || !authenticated || user?.wallet !== undefined) {
      walletLinkAttemptedRef.current = false;
    }
  }, [isConnected, authenticated, user?.wallet, linkWallet, address]);

  // Monitor wallet connection changes and sync with Privy
  useEffect(() => {
    // Only run the effect if we have previous state to compare with
    if (
      prevConnectedRef.current !== isConnected ||
      (prevAddressRef.current && prevAddressRef.current !== address)
    ) {
      // Handle wallet disconnection
      if (prevConnectedRef.current && !isConnected) {
        console.log(
          "Wallet disconnected from RainbowKit, logging out from Privy"
        );
        logout();
      }

      // Handle wallet switching
      if (
        isConnected &&
        prevAddressRef.current &&
        address !== prevAddressRef.current
      ) {
        console.log("Wallet switched in RainbowKit, logging out from Privy");
        logout();
      }
    }

    // Update references
    prevConnectedRef.current = isConnected;
    prevAddressRef.current = address;
  }, [
    isConnected,
    address,
    logout,
  ]);

  // Check if Twitter is linked to a different wallet than the currently connected one
  const isTwitterLinkedToAnotherWallet = useMemo(
    () =>
      Boolean(twitterLinkedAddress) && Boolean(address)
        ? twitterLinkedAddress !== address
        : false,
    [twitterLinkedAddress, address]
  );

  // Function to handle unlinking Twitter from wallet
  const handleUnlinkTwitter = async () => {
    try {
      console.log("Unlinking X account");
      // Find the Twitter account to unlink
      const twitterAccount = user?.linkedAccounts?.find(
        (account) => account.type === "twitter_oauth"
      );
      
      if (twitterAccount) {
        await unlinkTwitter("twitter_oauth");
        setWalletMismatchError(null);
      } else {
        console.log("No X account found to unlink");
      }
    } catch (error) {
      console.error("Error unlinking X account:", error);
    }
  };

  return (
    <WalletSyncContext.Provider
      value={{
        twitterLinkedAddress,
        isTwitterLinkedToAnotherWallet,
        isPrivyAuthenticated,
        walletMismatchError,
        unlinkTwitter: handleUnlinkTwitter,
      }}
    >
      {children}
    </WalletSyncContext.Provider>
  );
};

// Export a hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useWalletSync = () => useContext(WalletSyncContext);
