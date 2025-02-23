// TokenSelectDialog.tsx
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Button,
  InputAdornment,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Search, Add, Warning } from "@mui/icons-material";
import { erc20Abi, formatUnits, isAddress } from "viem";
import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { useTokensData } from "../../hooks/useTokensData";
import { ErrorMessage } from "../../types/staking";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface TokenSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

// Common tokens on Base network
const COMMON_TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    logoURI: "/eth-logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    logoURI: "/usdc-logo.png",
  },
];

export const TokenSelectDialog = ({
  open,
  onClose,
  onSelect,
  selectedToken,
}: TokenSelectDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customTokenLoading, setCustomTokenLoading] = useState(false);
  const [customTokenError, setCustomTokenError] = useState("");

  // Get custom token data at component level
  const { data: customTokenSymbol } = useReadContract({
    address: isAddress(customAddress) ? (customAddress as Address) : undefined,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const { data: customTokenName } = useReadContract({
    address: isAddress(customAddress) ? (customAddress as Address) : undefined,
    abi: erc20Abi,
    functionName: "name",
  });

  const { data: customTokenDecimals } = useReadContract({
    address: isAddress(customAddress) ? (customAddress as Address) : undefined,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // Get token addresses for data fetching
  const tokenAddresses = useMemo(
    () => COMMON_TOKENS.map((token) => token.address as Address),
    []
  );

  // Fetch all tokens data at once
  const tokensData = useTokensData(tokenAddresses);

  // Filter tokens and combine with fetched data
  const filteredTokens = useMemo(
    () =>
      COMMON_TOKENS.filter(
        (token) =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((token) => ({
        ...token,
        balance: tokensData[token.address]?.balance,
      })),
    [searchQuery, tokensData]
  );

  const handleLoadCustomToken = async () => {
    if (!isAddress(customAddress)) {
      setCustomTokenError("Invalid address");
      return;
    }

    setCustomTokenLoading(true);
    setCustomTokenError("");

    try {
      if (!customTokenSymbol || !customTokenName || !customTokenDecimals) {
        throw new Error("Invalid token contract");
      }

      const newToken: Token = {
        address: customAddress,
        symbol: customTokenSymbol as string,
        name: customTokenName as string,
        decimals: Number(customTokenDecimals),
      };

      onSelect(newToken);
      onClose();
    } catch (err) {
      const error = err as ErrorMessage;
      setCustomTokenError(error.message ?? "Failed to load token info");
    } finally {
      setCustomTokenLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      <DialogTitle sx={{ color: "#fff" }}>Select a token</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder='Search by name or paste address'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiInputBase-root": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
              </InputAdornment>
            ),
          }}
        />

        <List
          sx={{
            maxHeight: 400,
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255, 255, 255, 0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "4px",
            },
          }}
        >
          {filteredTokens.map((token) => (
            <ListItemButton
              key={token.address}
              selected={selectedToken?.address === token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              sx={{
                borderRadius: 1,
                mb: 1,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={token.logoURI}
                  sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                >
                  {token.symbol.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography sx={{ color: "#fff" }}>{token.symbol}</Typography>
                }
                secondary={
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                    {token.name}
                  </Typography>
                }
              />
              {token.balance && (
                <Typography sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  {formatUnits(token.balance, token.decimals)}
                </Typography>
              )}
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: "#fff", mb: 1 }}>
            Add custom token
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder='Token contract address'
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              error={!!customTokenError}
              helperText={customTokenError}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#fff",
                },
              }}
            />
            <Button
              variant='contained'
              onClick={handleLoadCustomToken}
              disabled={customTokenLoading || !customAddress}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              {customTokenLoading ? <CircularProgress size={24} /> : <Add />}
            </Button>
          </Box>
          {customTokenError && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: "rgba(255, 87, 34, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Warning color='error' />
              <Typography color='error'>{customTokenError}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
