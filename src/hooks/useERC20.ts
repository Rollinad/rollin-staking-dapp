// @ts-nocheck
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { useEffect } from "react";
import { STAKING_CONTRACT_ADDRESS } from "../constants";

export function useERC20(address: `0x${string}`) {
  const { address: accountAddress } = useAccount();

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
  } = useWriteContract();

  const {
    isLoading: isWaitingForTransaction,
    isSuccess: isTransactionSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: name } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const { data: decimals } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "allowance",
    args: accountAddress
      ? [accountAddress, STAKING_CONTRACT_ADDRESS]
      : undefined,
    query: {
      refetchInterval: isWritePending || isWaitingForTransaction ? 1000 : false,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  useEffect(() => {
    if (isTransactionSuccess) {
      refetchAllowance();
      refetchBalance();
    }
  }, [isTransactionSuccess, refetchAllowance, refetchBalance]);

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!writeContract) {
      throw new Error("Write contract not available");
    }

    try {
      writeContract({
        address,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      });

      setTimeout(() => {
        refetchAllowance();
      }, 2000);
    } catch (error) {
      console.error("Approval error:", error);
      throw error;
    }
  };

  return {
    name,
    symbol,
    decimals,
    balance: balance
      ? formatUnits(balance as bigint, Number(decimals) || 18)
      : "0",
    allowance: allowance
      ? formatUnits(allowance as bigint, Number(decimals) || 18)
      : "0",
    approve,
    hash,
    refetchAllowance,
    refetchBalance,
    isApproving: isWritePending || isWaitingForTransaction,
  };
}
