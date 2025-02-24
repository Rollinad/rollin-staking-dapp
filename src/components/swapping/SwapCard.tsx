import { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import {
  SwapVert,
  Settings,
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

export const SwapCard = () => {
  // Account & Connection
  const { isConnected } = useAccount();

  // Token States
  const { tokens, loading: tokensLoading } = useTokens();
  const [sellToken, setSellToken] = useState<Token>();
  const [buyToken, setBuyToken] = useState<Token>();
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  // UI States
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [error, setError] = useState("");

  // Initialize use0x hook
  const {
    getSwapQuote,
    executeSwap,
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
      setSellToken(tokens[0]);
      setBuyToken(tokens[1]);
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

  // Get sell and buy token balances
  const sellBalance = useMemo(() => {
    if (!sellToken) return undefined;
    return tokensData[sellToken.address]?.balance;
  }, [sellToken, tokensData]);

  const buyBalance = useMemo(() => {
    if (!buyToken) return undefined;
    return tokensData[buyToken.address]?.balance;
  }, [buyToken, tokensData]);

  // Format balance with maximum 6 decimal places
  const formatBalance = (balance: bigint, decimals: number) => {
    const formatted = formatUnits(balance, decimals);
    const [whole, decimal] = formatted.split(".");
    if (!decimal) return whole;
    return `${whole}.${decimal.slice(0, 6)}`;
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
      }
    }
  };

  // Set maximum available balance
  const handleSetMaxBalance = () => {
    if (sellBalance && sellToken) {
      setSellAmount(formatBalance(sellBalance, sellToken.decimal));
    }
  };

  // Swap tokens positions
  const handleSwapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount("");
    setBuyAmount("");
    setError("");
  };

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
        const quote = await getSwapQuote(sellToken, buyToken, sellAmount);
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
  }, [sellAmount, sellToken, buyToken, isConnected, isAmountExceedingBalance, getSwapQuote, buyToken?.decimal]);

  // Handle swap execution
  const handleSwap = async () => {
    if (!isConnected || !sellAmount || isAmountExceedingBalance || !sellToken || !buyToken) return;

    try {
      await executeSwap(sellToken, buyToken, sellAmount);
      
      // Reset form after successful swap
      setSellAmount("");
      setBuyAmount("");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

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
          <IconButton sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
            <Settings />
          </IconButton>
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
              {sellBalance && (
                <Typography
                  sx={{
                    color: isAmountExceedingBalance
                      ? "#ff6b6b"
                      : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  Balance: {formatBalance(sellBalance, sellToken.decimal)}
                </Typography>
              )}
              {sellBalance && sellBalance > 0n && (
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
            />
          </Box>
          <UnverifiedTokenWarning token={sellToken} />
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
            sx={{
              color: "#fff",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <SwapVert />
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
            {buyBalance && (
              <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                Balance: {formatBalance(buyBalance, buyToken.decimal)}
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
            />
          </Box>
          <UnverifiedTokenWarning token={buyToken} />
        </Paper>

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
            !isConnected || isLoading || isApproving || !sellAmount || isAmountExceedingBalance
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
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !sellAmount ? (
            "Enter Amount"
          ) : isAmountExceedingBalance ? (
            "Insufficient Balance"
          ) : (
            "Swap"
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