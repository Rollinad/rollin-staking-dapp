// hooks/useTokensData.ts
import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TokenData } from "../types/staking";

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const useTokensData = (tokenAddresses: Address[]) => {
  const { address: userAddress } = useAccount();
  const [tokensData, setTokensData] = useState<Record<string, TokenData>>({});

  // Get native token balance
  const { data: nativeBalance } = useBalance({
    address: userAddress,
  });

  // Get balances for all tokens
  const balanceResults = useReadContracts({
    contracts: tokenAddresses
      .filter(address => address !== NATIVE_TOKEN_ADDRESS)
      .map((address) => ({
        address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress as Address],
        enabled: !!userAddress,
      })),
  });

  useEffect(() => {
    const newTokensData: Record<string, TokenData> = {};

    tokenAddresses.forEach((address) => {
      if (address === NATIVE_TOKEN_ADDRESS) {
        // Handle native token
        if (nativeBalance) {
          newTokensData[address] = {
            balance: nativeBalance.value,
          };
        }
      } else {
        // Handle ERC20 tokens
        const balanceIndex = tokenAddresses.indexOf(address) - (tokenAddresses.includes(NATIVE_TOKEN_ADDRESS) ? 1 : 0);
        const balance = balanceResults.data?.[balanceIndex]?.result;
        
        if (balance !== undefined) {
          newTokensData[address] = {
            balance: balance as bigint,
          };
        }
      }
    });

    setTokensData(newTokensData);
  }, [tokenAddresses, nativeBalance, balanceResults.data]);

  return tokensData;
};