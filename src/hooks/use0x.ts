// @ts-nocheck
import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import {
  parseUnits,
  type Address,
  maxUint256,
  concat,
  numberToHex,
  size,
  type Hex,
  type Chain,
} from 'viem';
import { Token } from './useTokens';

interface SwapQuote {
  buyAmount?: string;
  transaction: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  permit2?: {
    eip712?: any;
  };
  issues?: {
    allowance?: {
      spender: string;
    };
  };
}

interface TransactionParams {
  account: Address;
  to: Address;
  data: Hex;
  value: bigint;
  nonce: number;
  chain: Chain;
  gas?: bigint;
  gasPrice?: bigint;
}

export const use0x = () => {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenApproval = useCallback(async (
    spender: Address,
    contract: any
  ) => {
    try {
      setIsApproving(true);
      setError(null);

      const { request } = await contract.simulate.approve([spender, maxUint256]);
      const hash = await contract.write.approve(request.args);
      await publicClient?.waitForTransactionReceipt({ hash });

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to approve token';
      setError(errorMessage);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [publicClient]);

  const getSwapQuote = useCallback(async (
    sellToken: Token,
    buyToken: Token,
    sellAmount: string
  ): Promise<SwapQuote> => {
    try {
      setIsLoading(true);
      setError(null);

      const sellAmountBase = parseUnits(
        sellAmount,
        sellToken.decimal
      ).toString();

      const response = await fetch("/api/rollin-protocol/swap/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount: sellAmountBase,
          takerAddress: address!,
          chainId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.reason || 'Failed to fetch quote');
      }

      if (!data.transaction?.to || !data.transaction?.data) {
        throw new Error('Invalid quote: Missing transaction details');
      }

      return data;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Error fetching quote';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId]);

  const executeSwap = useCallback(async (
    sellToken: Token,
    buyToken: Token,
    sellAmount: string
  ) => {
    if (!isConnected || !walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Get quote (includes allowance check)
      const quote = await getSwapQuote(sellToken, buyToken, sellAmount);

      // 2. Handle allowance if needed for non-native tokens
      const isNativeToken = sellToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      
      if (!isNativeToken && quote.issues?.allowance) {
        await handleTokenApproval(
          quote.issues.allowance.spender as Address,
          sellToken.address
        );

        // Get fresh quote after approval
        const updatedQuote = await getSwapQuote(sellToken, buyToken, sellAmount);
        Object.assign(quote, updatedQuote);
      }

      // 3. Handle permit2 signature if needed
      let signature: Hex | undefined;
      if (quote.permit2?.eip712) {
        signature = await walletClient.signTypedData(quote.permit2.eip712);
        
        if (signature && quote.transaction?.data) {
          const signatureLengthInHex = numberToHex(size(signature), {
            signed: false,
            size: 32,
          });
          
          quote.transaction.data = concat([
            quote.transaction.data as Hex,
            signatureLengthInHex as Hex,
            signature as Hex,
          ]);
        }
      }

      // 4. Get nonce using publicClient
      const nonce = await publicClient.getTransactionCount({
        address: address as Address,
      });

      // 5. Prepare base transaction parameters
      const txParams: TransactionParams = {
        account: address as Address,
        to: quote.transaction.to as Address,
        data: quote.transaction.data as Hex,
        value: isNativeToken ? BigInt(quote.transaction.value || '0') : 0n,
        nonce,
        chain: walletClient.chain,
      };

      // Add optional gas parameters if provided
      if (quote.transaction.gas) {
        txParams.gas = BigInt(quote.transaction.gas);
      }
      if (quote.transaction.gasPrice) {
        txParams.gasPrice = BigInt(quote.transaction.gasPrice);
      }

      // 6. Execute transaction
      const hash = await walletClient.sendTransaction(txParams);

      // 7. Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return receipt;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to execute swap';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    walletClient,
    address,
    publicClient,
    getSwapQuote,
    handleTokenApproval
  ]);

  return {
    getSwapQuote,
    executeSwap,
    isLoading,
    isApproving,
    error,
  };
};