// @ts-nocheck
import { useState } from "react";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { ErrorMessage } from "../types/staking";
import { STAKING_CONTRACT_ADDRESS } from "../constants";

export function useDepositToken() {
  const { address: userAddress } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [tokenToCheck, setTokenToCheck] = useState<{
    address: `0x${string}`;
    owner: `0x${string}` | undefined;
  } | null>(null);

  const { data: allowanceData } = useReadContract({
    address: tokenToCheck?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: tokenToCheck?.owner && [tokenToCheck.owner, STAKING_CONTRACT_ADDRESS],
  });

  const handleContractError = (error: ErrorMessage): string => {
    const errorMessage = error.message || error.details || String(error);

    if (errorMessage.includes("ERC20: transfer amount exceeds balance")) {
      return "Token transfer failed: Insufficient balance";
    }
    if (errorMessage.includes("ERC20: transfer amount exceeds allowance")) {
      return "Token transfer failed: Insufficient allowance. Please approve tokens first.";
    }
    if (errorMessage.includes("Not authorized")) {
      return "Not authorized to deposit to this pool";
    }

    return `Transaction failed: ${errorMessage}`;
  };

  const approveToken = async (tokenAddress: `0x${string}`, amount: bigint) => {
    setIsApproving(true);
    try {
      return writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_CONTRACT_ADDRESS, amount],
      });
    } finally {
      setIsApproving(false);
    }
  };

  const checkAllowance = async (
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    amount: bigint
  ): Promise<boolean> => {
    try {
      setTokenToCheck({
        address: tokenAddress,
        owner: ownerAddress,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      return ((allowanceData as bigint) || 0n) >= amount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  const depositTokens = async (
    tokenAddress: `0x${string}`,
    amount: string,
    decimals: number
  ) => {
    try {
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      const amountBigInt = parseUnits(amount, decimals);

      const hasAllowance = await checkAllowance(
        tokenAddress,
        userAddress,
        amountBigInt
      );

      if (!hasAllowance) {
        await approveToken(tokenAddress, amountBigInt);
      }

      return await writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "transfer",
        args: [STAKING_CONTRACT_ADDRESS, amountBigInt],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      console.error("Deposit error:", errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  return {
    depositTokens,
    isPending,
    isApproving,
    error,
  };
}
