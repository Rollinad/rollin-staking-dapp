import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  SwapVert,
  Settings,
  LocalGasStation,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import type { Address } from "viem";
import { TokenSelectDialog } from "./TokenSelectDialog";
import { useTokens, Token } from "../../hooks/useTokens";
import { useTokensData } from "../../hooks/useTokensData";
import { UnverifiedTokenWarning } from "./UnverifiedTokenWarning";
import { TokenButton } from "./TokenButton";
import { cardStyle, tokenButtonStyle } from "./styles";
import { use0x } from "../../hooks/use0x";

// Define status type for the StatusChip
type TradeStatus = 'submitted' | 'confirmed' | 'failed' | string;

// Interface for cached token balances
interface TokenBalanceCache {
  [address: string]: {
    balance: bigint;
    timestamp: number;
  };
}

// Status chip component for gasless swaps
const StatusChip = ({ status }: { status: TradeStatus }) => {
  const getColor = () => {
    switch (status) {
      case 'submitted':
        return '#FFD700'; // Gold
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'failed':
        return '#f44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  return (
    <Box 
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: `${getColor()}20`,
        color: getColor(),
        borderRadius: '16px',
        padding: '4px 10px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}
    >
      {status === 'submitted' && <CircularProgress size={12} sx={{ mr: 1, color: getColor() }} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Box>
  );
};

// Define the return type for executeSwap
interface GaslessSwapResult {
  tradeHash: string;
  status: string;
}

// Type guard to check if a result is a GaslessSwapResult
function isGaslessSwapResult(result: any): result is GaslessSwapResult {
  return result && typeof result.tradeHash === 'string' && typeof result.status === 'string';
}

export const SwapCard = () => {
  // Account & Connection
  const { isConnected } = useAccount();

  // Token States
  const { tokens, loading: tokensLoading } = useTokens();
  const [sellToken, setSellToken] = useState<Token | undefined>();
  const [buyToken, setBuyToken] = useState<Token | undefined>();
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  // UI States
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSwapping, setIsSwapping] = useState(false); // Track when tokens are being swapped
  
  // Balance cache to preserve token balances during swaps
  const balanceCacheRef = useRef<TokenBalanceCache>({});
  
  // Gasless feature states
  const [useGasless, setUseGasless] = useState(false);
  const [tradeHash, setTradeHash] = useState<string | null>(null);
  const [tradeStatus, setTradeStatus] = useState<TradeStatus | null>(null);
  const [statusUpdateInterval, setStatusUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize use0x hook
  const {
    getSwapQuote,
    executeSwap,
    checkGaslessTradeStatus,
    isLoading,
    isApproving,
    error: swapError,
  } = use0x();

  // Set error state combining both local and swap errors
  useEffect(() => {
    if (swapError) {
      setError(swapError);
    }
  }, [swapError]);

  // Set initial tokens
  useEffect(() => {
    if (tokens.length >= 2 && !sellToken && !buyToken) {
      const ethToken = tokens.find(token => 
        token.symbol.toLowerCase() === 'eth' || 
        token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      );
      
      const usdcToken = tokens.find(token => 
        token.symbol.toLowerCase() === 'usdc'
      );
      
      if (ethToken && usdcToken) {
        setSellToken(ethToken);
        setBuyToken(usdcToken);
      } else {
        setSellToken(tokens[0]);
        setBuyToken(tokens[1]);
      }
    }
  }, [tokens, sellToken, buyToken]);

  // Get tokens data for both sell and buy tokens
  const tokenAddresses = useMemo(() => {
    const addresses: Address[] = [];
    if (sellToken) addresses.push(sellToken.address as Address);
    if (buyToken) addresses.push(buyToken.address as Address);
    return addresses;
  }, [sellToken, buyToken]);

  const tokensData = useTokensData(tokenAddresses);

  // Update balance cache when tokensData changes
  useEffect(() => {
    const now = Date.now();
    
    // Update cache with new balances
    Object.entries(tokensData).forEach(([address, data]) => {
      if (data && data.balance !== undefined) {
        balanceCacheRef.current[address.toLowerCase()] = {
          balance: data.balance,
          timestamp: now
        };
      }
    });
    
    console.log("Cache updated:", balanceCacheRef.current);
    console.log("Current tokensData:", tokensData);
  }, [tokensData]);

  // Get sell and buy token balances with fallbacks from cache
  const sellBalance = useMemo(() => {
    if (!sellToken) return undefined;
    
    // Try accessing balance using normal address
    let balance = tokensData[sellToken.address]?.balance;
    
    // If that fails, try with lowercase address
    if (balance === undefined) {
      const lowerAddress = sellToken.address.toLowerCase();
      balance = tokensData[lowerAddress]?.balance;
      
      // If still undefined, try the cache
      if (balance === undefined && balanceCacheRef.current[lowerAddress]) {
        balance = balanceCacheRef.current[lowerAddress].balance;
        console.log("Using cached balance for sell token:", balance.toString());
      }
    }
    
    return balance;
  }, [sellToken, tokensData]);

  const buyBalance = useMemo(() => {
    if (!buyToken) return undefined;
    
    // Try accessing balance using normal address
    let balance = tokensData[buyToken.address]?.balance;
    
    // If that fails, try with lowercase address
    if (balance === undefined) {
      const lowerAddress = buyToken.address.toLowerCase();
      balance = tokensData[lowerAddress]?.balance;
      
      // If still undefined, try the cache
      if (balance === undefined && balanceCacheRef.current[lowerAddress]) {
        balance = balanceCacheRef.current[lowerAddress].balance;
        console.log("Using cached balance for buy token:", balance.toString());
      }
    }
    
    return balance;
  }, [buyToken, tokensData]);

  // Format balance with maximum 6 decimal places
  const formatBalance = (balance: bigint, decimals: number) => {
    try {
      const formatted = formatUnits(balance, decimals);
      const [whole, decimal] = formatted.split(".");
      if (!decimal) return whole;
      return `${whole}.${decimal.slice(0, 6)}`;
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0"; // Fallback value
    }
  };

  // Check if sell amount exceeds balance
  const isAmountExceedingBalance = useMemo(() => {
    if (!sellBalance || !sellAmount || !sellToken) return false;
    try {
      const amountInWei = parseUnits(sellAmount, sellToken.decimal);
      return amountInWei > sellBalance;
    } catch {
      return false;
    }
  }, [sellBalance, sellAmount, sellToken]);

  // Validate numeric input with decimal places
  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!sellToken) return;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, decimal] = value.split(".");
      if (!decimal || decimal.length <= sellToken.decimal) {
        setSellAmount(value);
        setError("");
        
        // Reset trade status when amount changes
        if (tradeHash) {
          setTradeHash(null);
          setTradeStatus(null);
          if (statusUpdateInterval) {
            clearInterval(statusUpdateInterval);
            setStatusUpdateInterval(null);
          }
        }
      }
    }
  };

  // Set maximum available balance
  const handleSetMaxBalance = () => {
    if (sellBalance && sellToken) {
      setSellAmount(formatBalance(sellBalance, sellToken.decimal));
    }
  };

  // Swap tokens positions with improved data handling
  const handleSwapTokens = () => {
    if (!sellToken || !buyToken) return;
    
    setIsSwapping(true); // Start token swap - prevent balance display during transition
    
    // Store current tokens before swapping
    const tempSellToken = sellToken;
    const tempBuyToken = buyToken;
    
    // Perform the swap
    setSellToken(tempBuyToken);
    setBuyToken(tempSellToken);
    setSellAmount("");
    setBuyAmount("");
    setError("");
    
    // Reset trade status when tokens swap
    if (tradeHash) {
      setTradeHash(null);
      setTradeStatus(null);
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        setStatusUpdateInterval(null);
      }
    }
    
    // Set a timeout to ensure tokensData has time to update
    setTimeout(() => {
      setIsSwapping(false);
    }, 500);
  };

  // Toggle gasless mode
  const handleToggleGasless = () => {
    setUseGasless(!useGasless);
    
    // Reset quote when toggling gasless mode
    setBuyAmount("");
    setError("");
    
    // Reset trade status
    if (tradeHash) {
      setTradeHash(null);
      setTradeStatus(null);
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        setStatusUpdateInterval(null);
      }
    }
  };

  // Poll for gasless trade status
  const pollTradeStatus = useCallback(async (hash: string) => {
    try {
      const statusData = await checkGaslessTradeStatus(hash);
      setTradeStatus(statusData.status);
      
      // Stop polling if the transaction is confirmed or failed
      if (statusData.status === 'confirmed' || statusData.status === 'failed') {
        if (statusUpdateInterval) {
          clearInterval(statusUpdateInterval);
          setStatusUpdateInterval(null);
        }
      }
    } catch (error) {
      console.error('Error checking trade status:', error);
    }
  }, [checkGaslessTradeStatus, statusUpdateInterval]);

  // Start polling for trade status
  const startStatusPolling = useCallback((hash: string) => {
    // Clear any existing interval
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
    }
    
    // Initial check
    pollTradeStatus(hash);
    
    // Set up interval (every 3 seconds)
    const interval = setInterval(() => pollTradeStatus(hash), 3000);
    setStatusUpdateInterval(interval);
    
    // Clean up interval after 5 minutes (timeout)
    setTimeout(() => {
      clearInterval(interval);
      setStatusUpdateInterval(null);
    }, 5 * 60 * 1000);
  }, [pollTradeStatus, statusUpdateInterval]);

  // Update quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!sellAmount || !isConnected || !sellToken || !buyToken) return;

      if (isAmountExceedingBalance) {
        setError("Insufficient balance");
        setBuyAmount("");
        return;
      }

      try {
        const quote = await getSwapQuote(sellToken, buyToken, sellAmount, useGasless);
        if (quote.buyAmount) {
          setBuyAmount(formatUnits(BigInt(quote.buyAmount), buyToken.decimal));
          setError("");
        } else {
          setError("Invalid quote received");
          setBuyAmount("");
        }
      } catch (err) {
        setError((err as Error).message);
        setBuyAmount("");
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [sellAmount, sellToken, buyToken, isConnected, isAmountExceedingBalance, getSwapQuote, buyToken?.decimal, useGasless]);

  // Handle swap execution
  const handleSwap = async () => {
    if (!isConnected || !sellAmount || isAmountExceedingBalance || !sellToken || !buyToken) return;

    try {
      const result = await executeSwap(sellToken, buyToken, sellAmount, useGasless);
      
      if (useGasless && isGaslessSwapResult(result)) {
        // For gasless swaps, set the trade hash and start polling for status
        setTradeHash(result.tradeHash);
        setTradeStatus('submitted');
        startStatusPolling(result.tradeHash);
      } else {
        // For regular swaps, reset form after successful swap
        setSellAmount("");
        setBuyAmount("");
      }
      
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
      }
    };
  }, [statusUpdateInterval]);

  // Check if the current token is compatible with gasless swaps
  const isGaslessCompatible = useMemo(() => {
    if (!sellToken) return false;
    
    // Native tokens are not compatible with gasless swaps
    const isNativeToken = sellToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    
    // You can add other conditions based on specific tokens or token features
    return !isNativeToken;
  }, [sellToken]);

  // Show loading state while tokens are loading
  if (tokensLoading || !sellToken || !buyToken) {
    return (
      <Card sx={cardStyle}>
        <CardContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={cardStyle}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Swap
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={isGaslessCompatible 
              ? "Gasless swaps let you trade without paying for gas (transaction fees)" 
              : "Gasless swaps are not available for this token"
            }>
              <FormControlLabel
                control={
                  <Switch 
                    checked={useGasless && isGaslessCompatible} 
                    onChange={handleToggleGasless}
                    disabled={!isGaslessCompatible}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4CAF50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4CAF50',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalGasStation sx={{ mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="body2">Gasless</Typography>
                  </Box>
                }
                sx={{ mr: 1, color: 'white' }}
              />
            </Tooltip>
            <IconButton sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
              <Settings />
            </IconButton>
          </Box>
        </Box>

        {/* Sell Token Input */}
        <Paper
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            p: 2,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
              You pay
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              {/* This is the fixed balance display for sell token */}
              {sellToken && (
                <Typography
                  sx={{
                    color: isAmountExceedingBalance
                      ? "#ff6b6b"
                      : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  Balance: {isSwapping ? "Loading..." : (sellBalance !== undefined 
                    ? formatBalance(sellBalance, sellToken.decimal) 
                    : "Loading...")}
                </Typography>
              )}
              {!isSwapping && sellBalance !== undefined && sellBalance > 0n && (
                <Typography
                  sx={{
                    color: "rgba(255, 255, 255, 0.4)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    "&:hover": {
                      color: "rgba(255, 255, 255, 0.8)",
                    },
                  }}
                  onClick={handleSetMaxBalance}
                >
                  MAX
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              fullWidth
              value={sellAmount}
              onChange={handleSellAmountChange}
              placeholder="0"
              error={isAmountExceedingBalance}
              disabled={!!tradeStatus && tradeStatus === 'submitted' || isSwapping}
              sx={{
                "& .MuiInputBase-root": {
                  color: "#fff",
                  backgroundColor: "transparent",
                  "&:before, &:after": {
                    display: "none",
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "24px",
                  padding: "12px",
                },
              }}
            />
            <TokenButton
              token={sellToken}
              onClick={() => setSellDialogOpen(true)}
              disabled={!!tradeStatus && tradeStatus === 'submitted' || isSwapping}
              loading={isSwapping}
            />
          </Box>
          <UnverifiedTokenWarning token={sellToken} />
          {!isGaslessCompatible && useGasless && (
            <Typography
              sx={{
                color: "#ff9800",
                fontSize: "0.875rem",
                mt: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <InfoIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              This token doesn't support gasless swaps. Please switch to a standard swap.
            </Typography>
          )}
          {isAmountExceedingBalance && (
            <Typography
              sx={{
                color: "#ff6b6b",
                fontSize: "0.875rem",
                mt: 1,
              }}
            >
              Amount exceeds balance
            </Typography>
          )}
        </Paper>

        {/* Swap Direction Button */}
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <IconButton
            onClick={handleSwapTokens}
            disabled={!!tradeStatus && tradeStatus === 'submitted' || isSwapping}
            sx={{
              color: "#fff",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            {isSwapping ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              <SwapVert />
            )}
          </IconButton>
        </Box>

        {/* Buy Token Input */}
        <Paper
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            p: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
              You receive
            </Typography>
            {/* Buy token balance display */}
            {buyToken && (
              <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                Balance: {isSwapping ? "Loading..." : (buyBalance !== undefined 
                  ? formatBalance(buyBalance, buyToken.decimal) 
                  : "Loading...")}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              fullWidth
              value={buyAmount}
              placeholder="0"
              disabled
              sx={{
                "& .MuiInputBase-root": {
                  color: "#fff",
                  backgroundColor: "transparent",
                  "&:before, &:after": {
                    display: "none",
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "24px",
                  padding: "12px",
                },
              }}
            />
            <TokenButton
              token={buyToken}
              onClick={() => setBuyDialogOpen(true)}
              disabled={!!tradeStatus && tradeStatus === 'submitted' || isSwapping}
              loading={isSwapping}
            />
          </Box>
          <UnverifiedTokenWarning token={buyToken} />
        </Paper>

        {/* Gasless Transaction Status */}
        <Collapse in={!!tradeStatus}>
          {tradeStatus && (
            <Paper
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                p: 2,
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Transaction Status:
              </Typography>
              <StatusChip status={tradeStatus} />
            </Paper>
          )}
        </Collapse>

        {/* Error Message */}
        {error && (
          <Typography
            color="error"
            sx={{
              mb: 2,
              color: "#ff6b6b",
              backgroundColor: "rgba(255, 107, 107, 0.1)",
              p: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Typography>
        )}

        {/* Swap Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={
            !isConnected || 
            isLoading || 
            isApproving || 
            !sellAmount || 
            isAmountExceedingBalance || 
            (tradeStatus === 'submitted') ||
            (useGasless && !isGaslessCompatible) ||
            isSwapping
          }
          onClick={handleSwap}
          sx={{
            ...tokenButtonStyle,
            height: 48,
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : isApproving ? (
            "Approving..."
          ) : isSwapping ? (
            "Loading Tokens..."
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !sellAmount ? (
            "Enter Amount"
          ) : isAmountExceedingBalance ? (
            "Insufficient Balance"
          ) : tradeStatus === 'submitted' ? (
            "Transaction Pending"
          ) : useGasless && !isGaslessCompatible ? (
            "Gasless Not Supported"
          ) : (
            `Swap${useGasless ? ' (Gasless)' : ''}`
          )}
        </Button>

        {/* Token Selection Dialogs */}
        <TokenSelectDialog
          availableTokens={tokens}
          open={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          onSelect={setSellToken}
          selectedToken={sellToken}
        />
        <TokenSelectDialog
          availableTokens={tokens}
          open={buyDialogOpen}
          onClose={() => setBuyDialogOpen(false)}
          onSelect={setBuyToken}
          selectedToken={buyToken}
        />
      </CardContent>
    </Card>
  );
};