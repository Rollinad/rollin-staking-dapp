import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { TokenData } from "../types/staking";

// Single token data hook
export const useTokenData = (tokenAddress: Address) => {
  const { address: userAddress, chain } = useAccount();
  const [tokenData, setTokenData] = useState<TokenData>({});

  const { data: balance } = useBalance({
    address: userAddress,
    token: tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? undefined : tokenAddress,
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  });

  useEffect(() => {
    if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      setTokenData({
        balance: balance?.value,
        symbol: chain?.nativeCurrency.symbol,
        name: chain?.nativeCurrency.name,
        decimals: 18,
      });
    } else {
      setTokenData({
        balance: balance?.value,
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
      });
    }
  }, [balance, symbol, name, decimals, tokenAddress, chain]);

  return tokenData;
};