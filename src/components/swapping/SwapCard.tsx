// SwapCard.tsx
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
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  SwapVert,
  Settings,
  KeyboardArrowDown,
  VerifiedUser,
} from "@mui/icons-material";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import type { Address } from "viem";
import { TokenSelectDialog } from "./TokenSelectDialog";
import { ErrorMessage } from "../../types/staking";
import { useTokens, Token } from "../../hooks/useTokens";
import { useTokensData } from "../../hooks/useTokensData";

export const SwapCard = () => {
  const { address, isConnected, chainId } = useAccount();
  const [sellToken, setSellToken] = useState<Token>();
  const [buyToken, setBuyToken] = useState<Token>();
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const { tokens, loading: tokensLoading } = useTokens();

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

    // Allow empty string or numbers with up to token's decimal places
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

  // Fetch price quote from API
  const fetchPrice = async () => {
    if (
      !sellAmount ||
      !isConnected ||
      isAmountExceedingBalance ||
      !sellToken ||
      !buyToken
    )
      return;

    setLoading(true);
    setError("");

    try {
      const sellAmountBase = parseUnits(
        sellAmount,
        sellToken.decimal
      ).toString();

      const response = await fetch("/api/rollin-protocol/swap/price", {
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

      const quote = await response.json();

      if (!response.ok) {
        throw new Error(quote.reason || "Failed to fetch price");
      }

      setBuyAmount(formatUnits(BigInt(quote.buyAmount), buyToken.decimal));
    } catch (err) {
      const error = err as ErrorMessage;
      setError(error.message ?? "Error fetching price");
      setBuyAmount("");
    } finally {
      setLoading(false);
    }
  };

  // Update price when inputs change
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (isAmountExceedingBalance) {
        setError("Insufficient balance");
        setBuyAmount("");
      } else {
        fetchPrice();
      }
    }, 500);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellAmount, sellToken, buyToken, isAmountExceedingBalance]);

  // Handle swap execution
  const handleSwap = async () => {
    if (
      !isConnected ||
      !sellAmount ||
      isAmountExceedingBalance ||
      !sellToken ||
      !buyToken
    )
      return;

    setLoading(true);
    setError("");

    try {
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

      const quote = await response.json();

      if (!response.ok) {
        throw new Error(quote.reason || "Failed to fetch quote");
      }

      // TODO: Execute the swap transaction
      console.log("Executing swap with quote:", quote);
    } catch (err) {
      const error = err as ErrorMessage;
      setError(error.message ?? "Error executing swap");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const tokenButtonStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(5px)",
    color: "#fff",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    padding: "12px",
  };

  // Token button component with verification badge
  const TokenButton = ({
    token,
    onClick,
  }: {
    token: Token;
    onClick: () => void;
  }) => (
    <Button
      variant='contained'
      sx={tokenButtonStyle}
      endIcon={<KeyboardArrowDown />}
      onClick={onClick}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            style={{ width: 24, height: 24, borderRadius: "50%" }}
          />
        ) : (
          <Avatar
            src={token.logoURI}
            sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            {token.symbol.charAt(0)}
          </Avatar>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {token.symbol}
          {token.verified && (
            <Tooltip title='Verified Token'>
              <VerifiedUser
                sx={{
                  fontSize: 16,
                  color: "#00e676",
                  ml: 0.5,
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    </Button>
  );

  // Warning message for unverified tokens
  const UnverifiedTokenWarning = ({ token }: { token: Token }) =>
    !token.verified && (
      <Typography
        sx={{
          color: "#ffb74d",
          fontSize: "0.875rem",
          mt: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        ⚠️ Unverified token - Trade with caution
      </Typography>
    );

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
            variant='h5'
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
              placeholder='0'
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
              placeholder='0'
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
            color='error'
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
          variant='contained'
          size='large'
          disabled={
            !isConnected || loading || !sellAmount || isAmountExceedingBalance
          }
          onClick={handleSwap}
          sx={{
            ...tokenButtonStyle,
            height: 48,
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
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
