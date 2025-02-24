import { STAKING_CONTRACT_ADDRESS } from "@/constants";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";

export const useContractBalance = (tokenAddress: string) => {
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [STAKING_CONTRACT_ADDRESS as `0x${string}`],
  });

  return { balance: balance?.toString() || '0' };
};