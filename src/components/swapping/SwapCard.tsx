// SwapCard.tsx
import { useState, useEffect } from "react";
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
import { SwapVert, Settings, KeyboardArrowDown } from "@mui/icons-material";
import { useAccount, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { TokenSelectDialog } from "./TokenSelectDialog";
import { ErrorMessage } from "../../types/staking";

// Token interface
interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

// Initial tokens
const INITIAL_TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    logoURI: "/eth-logo.png",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    logoURI: "/usdc-logo.png",
  },
};

export const SwapCard = () => {
  const { address, isConnected } = useAccount();
  const [sellToken, setSellToken] = useState<Token>(INITIAL_TOKENS.ETH);
  const [buyToken, setBuyToken] = useState<Token>(INITIAL_TOKENS.USDC);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  const { chainId } = useAccount();

  // Get balance of selected token
  const { data: balance } = useBalance({
    address,
    token:
      sellToken.address === INITIAL_TOKENS.ETH.address
        ? undefined
        : (sellToken.address as `0x${string}`),
  });

  // Swap tokens positions
  const handleSwapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount("");
    setBuyAmount("");
  };

  // Fetch price quote from 0x API
  const fetchPrice = async () => {
    if (!sellAmount || !isConnected) return;

    setLoading(true);
    setError("");

    try {
      const sellAmountBase = parseUnits(
        sellAmount,
        sellToken.decimals
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

      setBuyAmount(formatUnits(BigInt(quote.buyAmount), buyToken.decimals));
    } catch (err) {
      const error = err as ErrorMessage;
      setError(error.message ?? "Error");
      setBuyAmount("");
    } finally {
      setLoading(false);
    }
  };

  // Fetch price when sell amount changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPrice();
    }, 500);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellAmount, sellToken, buyToken]);

  const handleSwap = async () => {
    if (!isConnected || !sellAmount) return;

    setLoading(true);
    setError("");

    try {
      const sellAmountBase = parseUnits(
        sellAmount,
        sellToken.decimals
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
      setError(error.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Card sx={cardStyle}>
      <CardContent>
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
            {balance && (
              <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                Balance: {formatUnits(balance.value, balance.decimals)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              fullWidth
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder='0'
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
            <Button
              variant='contained'
              sx={tokenButtonStyle}
              endIcon={<KeyboardArrowDown />}
              onClick={() => setSellDialogOpen(true)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {sellToken.logoURI && (
                  <img
                    src={sellToken.logoURI}
                    alt={sellToken.symbol}
                    style={{ width: 24, height: 24, borderRadius: "50%" }}
                  />
                )}
                {sellToken.symbol}
              </Box>
            </Button>
          </Box>
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
          <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 1 }}>
            You receive
          </Typography>
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
            <Button
              variant='contained'
              sx={tokenButtonStyle}
              endIcon={<KeyboardArrowDown />}
              onClick={() => setBuyDialogOpen(true)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {buyToken.logoURI && (
                  <img
                    src={buyToken.logoURI}
                    alt={buyToken.symbol}
                    style={{ width: 24, height: 24, borderRadius: "50%" }}
                  />
                )}
                {buyToken.symbol}
              </Box>
            </Button>
          </Box>
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
          disabled={!isConnected || loading || !sellAmount}
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
          ) : (
            "Swap"
          )}
        </Button>

        {/* Token Selection Dialogs */}
        <TokenSelectDialog
          open={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          onSelect={setSellToken}
          selectedToken={sellToken}
        />
        <TokenSelectDialog
          open={buyDialogOpen}
          onClose={() => setBuyDialogOpen(false)}
          onSelect={setBuyToken}
          selectedToken={buyToken}
        />
      </CardContent>
    </Card>
  );
};
