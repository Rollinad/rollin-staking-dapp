// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TokenData } from "../types/staking";

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const useTokensData = (tokenAddresses: Address[]) => {
  const { address: userAddress, isConnected } = useAccount();
  const [tokensData, setTokensData] = useState<Record<string, TokenData>>({});
  // Add a counter to force refresh
  const [refreshCounter, setRefreshCounter] = useState(0);
  // Add loading state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get native token balance with a refresh interval to ensure updated balances
  const { data: nativeBalance, refetch: refetchNative, isLoading: isNativeLoading } = useBalance({
    address: userAddress,
    watch: true, // Watch for balance changes
    enabled: isConnected,
  });

  // Get balances for all tokens with a refetch function
  const balanceResults = useReadContracts({
    contracts: tokenAddresses
      .filter(address => address !== NATIVE_TOKEN_ADDRESS)
      .map((address) => ({
        address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress as Address],
        enabled: !!userAddress && isConnected,
      })),
    watch: true, // Watch for balance changes
  });

  // Function to force a refresh of token balances - defined AFTER the hooks
  const refreshBalances = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshCounter(prev => prev + 1);
    console.log("Manual balance refresh triggered");
    
    // Return a promise that resolves when the refresh is complete
    return new Promise((resolve, reject) => {
      // Create a timeout to prevent hanging
      const timeout = setTimeout(() => {
        setIsRefreshing(false);
        reject(new Error("Balance refresh timeout"));
      }, 10000);
      
      // Wait for the next effect cycle where the actual refresh happens
      setTimeout(async () => {
        try {
          await Promise.all([
            refetchNative?.(),
            balanceResults.refetch?.()
          ]);
          clearTimeout(timeout);
          setIsRefreshing(false);
          resolve(true);
        } catch (err) {
          clearTimeout(timeout);
          setIsRefreshing(false);
          reject(err);
        }
      }, 100);
    });
  }, [refetchNative, balanceResults]);

  // Force refresh whenever refreshCounter changes
  useEffect(() => {
    if (refreshCounter > 0) {
      console.log("Refreshing token balances...");
      Promise.all([
        refetchNative?.(),
        balanceResults.refetch?.()
      ]).then(() => {
        console.log("Balance refresh completed");
        setIsRefreshing(false);
      }).catch(err => {
        console.error("Error refreshing balances:", err);
        setIsRefreshing(false);
      });
    }
  }, [refreshCounter, refetchNative, balanceResults.refetch, balanceResults]);

  useEffect(() => {
    const newTokensData: Record<string, TokenData> = {};

    tokenAddresses.forEach((address) => {
      // Also store lowercase version of address for consistent lookups
      const addressLower = address.toLowerCase();
      
      if (address === NATIVE_TOKEN_ADDRESS) {
        // Handle native token
        if (nativeBalance) {
          // Store with both original and lowercase keys
          newTokensData[address] = {
            balance: nativeBalance.value,
          };
          newTokensData[addressLower] = {
            balance: nativeBalance.value,
          };
        }
      } else {
        // Handle ERC20 tokens
        const balanceIndex = tokenAddresses.indexOf(address) - (tokenAddresses.includes(NATIVE_TOKEN_ADDRESS) ? 1 : 0);
        const balance = balanceResults.data?.[balanceIndex]?.result;
        
        if (balance !== undefined) {
          // Store with both original and lowercase keys
          newTokensData[address] = {
            balance: balance as bigint,
          };
          newTokensData[addressLower] = {
            balance: balance as bigint,
          };
          
          console.log(`Updated balance for ${addressLower}: ${(balance as bigint).toString()}`);
        }
      }
    });

    setTokensData(newTokensData);
  }, [tokenAddresses, nativeBalance, balanceResults.data]);

  return { 
    ...tokensData, 
    refreshBalances,
    isRefreshing, 
    isLoading: isNativeLoading || balanceResults.isLoading || isRefreshing 
  };
};