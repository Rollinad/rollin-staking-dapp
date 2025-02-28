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
}

// Create a context with default values
const WalletSyncContext = createContext<WalletSyncContextType>({
  twitterLinkedAddress: null,
  isTwitterLinkedToAnotherWallet: false,
  isPrivyAuthenticated: false,
});

/**
 * This provider component synchronizes wallet states between RainbowKit/wagmi and Privy
 * When a wallet is disconnected or switched in RainbowKit, it will call Privy's logout
 * It also tracks which wallet has a Twitter account linked to it
 */
export const WalletSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { logout, user, authenticated, login } = usePrivy();
  const { address, isConnected } = useAccount();
  const [twitterLinkedAddress, setTwitterLinkedAddress] = useState<
    string | null
  >(null);
  const [isPrivyAuthenticated, setIsPrivyAuthenticated] = useState(false);

  // References to track previous connection state and address
  const prevConnectedRef = useRef(false);
  const prevAddressRef = useRef<string | undefined>(undefined);

  // Check if the current address has a Twitter account linked
  const hasTwitterLinked = user?.linkedAccounts?.some(
    (account) => account.type === "twitter_oauth"
  );

  // Update authentication status when Privy auth state changes
  useEffect(() => {
    setIsPrivyAuthenticated(authenticated);
  }, [authenticated]);

  // Update the Twitter linked address when the user connects Twitter
  useEffect(() => {
    if (hasTwitterLinked && user) {
      setTwitterLinkedAddress((user.linkedAccounts[0] as any).address);
    }
  }, [hasTwitterLinked, user]);

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
  }, [isConnected, address, authenticated, login, logout]);

  // Check if Twitter is linked to a different wallet than the currently connected one
  const isTwitterLinkedToAnotherWallet = useMemo(
    () =>
      Boolean(twitterLinkedAddress) && Boolean(address)
        ? twitterLinkedAddress !== address
        : false,
    [twitterLinkedAddress, address]
  );

  return (
    <WalletSyncContext.Provider
      value={{
        twitterLinkedAddress,
        isTwitterLinkedToAnotherWallet,
        isPrivyAuthenticated,
      }}
    >
      {children}
    </WalletSyncContext.Provider>
  );
};

// Export a hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useWalletSync = () => useContext(WalletSyncContext);
