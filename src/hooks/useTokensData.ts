// @ts-nocheck
import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TokenData } from "../types/staking";

export const useTokensData = (tokenAddresses: Address[]) => {
  const { address: userAddress } = useAccount();
  const [tokensData, setTokensData] = useState<Record<string, TokenData>>({});

  // Get balances for all tokens
  const balanceResults = useReadContracts({
    contracts: tokenAddresses.map((address) => ({
      address:
        address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          ? undefined
          : address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress as Address],
      enabled:
        !!userAddress &&
        address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    })),
  });

  // Get symbols for all tokens
  const symbolResults = useReadContracts({
    contracts: tokenAddresses.map((address) => ({
      address,
      abi: erc20Abi,
      functionName: "symbol",
      enabled: address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    })),
  });

  // Get names for all tokens
  const nameResults = useReadContracts({
    contracts: tokenAddresses.map((address) => ({
      address,
      abi: erc20Abi,
      functionName: "name",
      enabled: address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    })),
  });

  // Get decimals for all tokens
  const decimalsResults = useReadContracts({
    contracts: tokenAddresses.map((address) => ({
      address,
      abi: erc20Abi,
      functionName: "decimals",
      enabled: address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    })),
  });

  // Special handling for native ETH balance
  const { data: ethBalance } = useBalance({
    address: userAddress,
  });

  useEffect(() => {
    const newTokensData: Record<string, TokenData> = {};

    tokenAddresses.forEach((address, index) => {
      if (address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        // Handle ETH
        newTokensData[address] = {
          balance: ethBalance?.value,
          symbol: "ETH",
          name: "Ethereum",
          decimals: 18,
        };
      } else {
        // Handle ERC20 tokens
        newTokensData[address] = {
          balance: balanceResults.data?.[index]?.result as bigint,
          symbol: symbolResults.data?.[index]?.result as string,
          name: nameResults.data?.[index]?.result as string,
          decimals: Number(decimalsResults.data?.[index]?.result),
        };
      }
    });

    setTokensData(newTokensData);
  }, [
    tokenAddresses,
    ethBalance?.value,
    balanceResults.data,
    symbolResults.data,
    nameResults.data,
    decimalsResults.data,
  ]);

  return tokensData;
};
