import { formatUnits } from "viem";
import { Token } from "../hooks/useTokens";

// Common addresses used for native token representation
const NATIVE_TOKEN_ADDRESSES = [
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // MON
    "0x0000000000000000000000000000000000000000"  // Alternative representation
  ];
  
  export const isNativeToken = (address: string): boolean => {
    return NATIVE_TOKEN_ADDRESSES.includes(address.toLowerCase());
  };
  
  export const getBalanceConfig = (token?: Token) => {
    if (!token) return {};
    
    return {
      token: isNativeToken(token.address) ? undefined : (token.address as `0x${string}`)
    };
  };

  export const formatTokenBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return undefined;
    const formatted = formatUnits(balance, decimals);
    const [whole, decimal] = formatted.split('.');
    if (!decimal) return whole;
    return `${whole}.${decimal.slice(0, 6)}`;
  };