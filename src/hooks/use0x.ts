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
  erc20Abi,
} from 'viem';
import { Token } from './useTokens';
import { splitSignature } from '../utils/signature';

interface SwapQuote {
  buyAmount?: string;
  transaction?: {
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
  // Gasless specific fields
  approval?: {
    type: string;
    eip712: any;
  };
  trade?: {
    type: string;
    eip712: any;
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
  const [isGasless, setIsGasless] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTokenApproval = useCallback(async (
    spender: Address,
    tokenAddress: Address
  ) => {
    try {
      setIsApproving(true);
      setError(null);

      const tokenContract = {
        address: tokenAddress,
        abi: erc20Abi
      };

      const hash = await walletClient.writeContract({
        ...tokenContract,
        functionName: 'approve',
        args: [spender, maxUint256]
      });
      await publicClient.waitForTransactionReceipt({ hash });

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to approve token';
      setError(errorMessage);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [publicClient, walletClient]);

  const getSwapQuote = useCallback(async (
    sellToken: Token,
    buyToken: Token,
    sellAmount: string,
    useGasless: boolean = false
  ): Promise<SwapQuote> => {
    try {
      setIsLoading(true);
      setError(null);
      setIsGasless(useGasless);

      const sellAmountBase = parseUnits(
        sellAmount,
        sellToken.decimal
      ).toString();

      // Determine which API endpoint to use based on useGasless flag
      const apiPath = useGasless ? "/api/rollin-protocol/gas-less/quote" : "/api/rollin-protocol/swap/quote";

      const response = await fetch(apiPath, {
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

      if (useGasless) {
        // For gasless swap, we need to check for trade and approval objects
        if (!data.trade?.eip712) {
          throw new Error('Invalid gasless quote: Missing trade details');
        }
      } else {
        // For regular swap, check for transaction details
        if (!data.transaction?.to || !data.transaction?.data) {
          throw new Error('Invalid quote: Missing transaction details');
        }
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
    sellAmount: string,
    useGasless: boolean = false
  ) => {
    if (!isConnected || !walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsGasless(useGasless);

      // 1. Get quote (includes allowance check)
      const quote = await getSwapQuote(sellToken, buyToken, sellAmount, useGasless);

      if (useGasless) {
        // Gasless swap flow
        return await executeGaslessSwap(quote, sellToken);
      } else {
        // Regular swap flow
        return await executeRegularSwap(quote, sellToken);
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to execute swap';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConnected,
    walletClient,
    address,
    publicClient,
    getSwapQuote
  ]);

  const executeRegularSwap = useCallback(async (
    quote: SwapQuote,
    sellToken: Token
  ) => {
    // Handle allowance if needed for non-native tokens
    const isNativeToken = sellToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    
    if (!isNativeToken && quote.issues?.allowance) {
      await handleTokenApproval(
        quote.issues.allowance.spender as Address,
        sellToken.address as Address
      );

      // Get fresh quote after approval
      const updatedQuote = await getSwapQuote(sellToken, buyToken, sellAmount, false);
      Object.assign(quote, updatedQuote);
    }

    // Handle permit2 signature if needed
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

    // Get nonce using publicClient
    const nonce = await publicClient.getTransactionCount({
      address: address as Address,
    });

    // Prepare base transaction parameters
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

    // Execute transaction
    const hash = await walletClient.sendTransaction(txParams);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    return receipt;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, publicClient, walletClient, handleTokenApproval]);

  const executeGaslessSwap = useCallback(async (
    quote: SwapQuote,
    sellToken: Token
  ) => {
    // Variables to hold our signatures and data
    let approvalSignature: Hex | null = null;
    let approvalDataToSubmit: any = null;
    let tradeSignature: Hex | null = null;
    let tradeDataToSubmit: any = null;

    // Check if token approval is required and if gasless approval is available
    const tokenApprovalRequired = quote.issues?.allowance != null;
    const gaslessApprovalAvailable = quote.approval != null;

    // Handle token approval if needed
    if (tokenApprovalRequired) {
      if (gaslessApprovalAvailable) {
        // Sign approval with EIP-712
        approvalSignature = await walletClient.signTypedData({
          types: quote.approval.eip712.types,
          domain: quote.approval.eip712.domain,
          message: quote.approval.eip712.message,
          primaryType: quote.approval.eip712.primaryType,
        });

        // Split signature and format for submission
        const approvalSplitSig = splitSignature(approvalSignature);
        approvalDataToSubmit = {
          type: quote.approval.type,
          eip712: quote.approval.eip712,
          signature: {
            ...approvalSplitSig,
            v: Number(approvalSplitSig.v),
            signatureType: SignatureType.EIP712,
          },
        };
      } else {
        // If gasless approval not available, use standard approval
        await handleTokenApproval(
          quote.issues.allowance.spender as Address,
          sellToken.address as Address
        );
      }
    }

    // Sign the trade with EIP-712
    tradeSignature = await walletClient.signTypedData({
      types: quote.trade.eip712.types,
      domain: quote.trade.eip712.domain,
      message: quote.trade.eip712.message,
      primaryType: quote.trade.eip712.primaryType,
    });

    // Split signature and format for submission
    const tradeSplitSig = splitSignature(tradeSignature);
    tradeDataToSubmit = {
      type: quote.trade.type,
      eip712: quote.trade.eip712,
      signature: {
        ...tradeSplitSig,
        v: Number(tradeSplitSig.v),
        signatureType: SignatureType.EIP712,
      },
    };

    // Submit the gasless trade
    const requestBody: any = {
      trade: tradeDataToSubmit,
      chainId: chainId,
    };

    if (approvalDataToSubmit) {
      requestBody.approval = approvalDataToSubmit;
    }

    // Submit to our API endpoint which will forward to 0x
    const response = await fetch("/api/rollin-protocol/gas-less/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.reason || 'Failed to submit gasless swap');
    }

    const tradeHash = data.tradeHash;
    
    // Start monitoring the trade status
    return { tradeHash, status: 'submitted' };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, walletClient, chainId, handleTokenApproval]);

  const checkGaslessTradeStatus = useCallback(async (
    tradeHash: string
  ) => {
    try {
      const response = await fetch(`/api/rollin-protocol/gas-less/status?tradeHash=${tradeHash}&chainId=${chainId}`, {
        method: "GET",
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.reason || 'Failed to check trade status');
      }

      return data;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Error checking trade status';
      setError(errorMessage);
      throw error;
    }
  }, [chainId]);

  return {
    getSwapQuote,
    executeSwap,
    checkGaslessTradeStatus,
    isLoading,
    isApproving,
    isGasless,
    error,
  };
};