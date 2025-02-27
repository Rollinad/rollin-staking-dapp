import { useState } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { parseUnits, erc20Abi } from 'viem';
import { ErrorMessage } from '../types/staking';
import { STAKING_CONTRACT_ADDRESS } from '../constants';

export function useDepositToken() {
  const { address: userAddress } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [tokenToCheck, setTokenToCheck] = useState<{
    address: `0x${string}`,
    owner: `0x${string}` | undefined
  } | null>(null);
  
  // Use the hook at the top level to check allowance
  const { data: allowanceData } = useReadContract({
    address: tokenToCheck?.address,
    abi: erc20Abi,
    functionName: 'allowance',
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

  // This function now uses the erc20Abi directly instead of the useERC20 hook
  const approveToken = async (
    tokenAddress: `0x${string}`,
    amount: bigint
  ) => {
    setIsApproving(true);
    try {
      return await writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [STAKING_CONTRACT_ADDRESS, amount]
      });
    } finally {
      setIsApproving(false);
    }
  };

  // This function checks the allowance using the React hook result
  const checkAllowance = async (
    tokenAddress: `0x${string}`,
    ownerAddress: `0x${string}`,
    amount: bigint
  ): Promise<boolean> => {
    try {
      // Set the token to check, which will trigger the useReadContract hook
      setTokenToCheck({
        address: tokenAddress,
        owner: ownerAddress,
      });
      
      // Wait for a small delay to ensure the hook has time to fetch the data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Compare the allowance with the amount
      return (allowanceData as bigint || 0n) >= amount;
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
      
      // Convert amount to bigint with correct decimals
      const amountBigInt = parseUnits(amount, decimals);
      
      // Check if approval is needed
      const hasAllowance = await checkAllowance(
        tokenAddress, 
        userAddress, 
        amountBigInt
      );
      
      // If not enough allowance, request approval first
      if (!hasAllowance) {
        await approveToken(tokenAddress, amountBigInt);
      }
      
      // Submit the transaction to transfer tokens directly to the contract
      return await writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [STAKING_CONTRACT_ADDRESS, amountBigInt]
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      console.error('Deposit error:', errorMessage, err);
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