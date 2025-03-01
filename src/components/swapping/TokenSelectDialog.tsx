// TokenSelectDialog.tsx
import { useState, useMemo, useEffect } from "react";
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
  Tooltip,
} from "@mui/material";
import { Search, Add, Warning, VerifiedUser } from "@mui/icons-material";
import { erc20Abi, formatUnits, isAddress } from "viem";
import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { useTokensData } from "../../hooks/useTokensData";
import { ErrorMessage, TokenData } from "../../types/staking";
import { Token } from "../../hooks/useTokens";

interface TokenSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  availableTokens: Token[];
}

export const TokenSelectDialog = ({
  open,
  onClose,
  onSelect,
  selectedToken,
  availableTokens,
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
    () => availableTokens.map((token) => token.address as Address),
    [availableTokens]
  );

  // Fetch all tokens data at once using updated hook with destructured refreshBalances
  const { refreshBalances, ...tokensData } = useTokensData(tokenAddresses);
  
  // Refresh balances when dialog opens
  useEffect(() => {
    if (open) {
      refreshBalances();
    }
  }, [open, refreshBalances]);

  // Filter tokens and combine with fetched data
  const filteredTokens = useMemo(
    () => {
      // Cast tokensData to appropriate type for TS
      const tokenBalances = tokensData as unknown as Record<string, TokenData>;
      
      return availableTokens
        .filter(
          (token) =>
            token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((token) => {
          // Try both original and lowercase address
          const balance = 
            tokenBalances[token.address]?.balance || 
            tokenBalances[token.address.toLowerCase()]?.balance || 
            undefined;
            
          return {
            ...token,
            balance
          };
        });
    },
    [searchQuery, availableTokens, tokensData]
  );

  // Token name with verification badge component
  const TokenName = ({ token }: { token: Token }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography sx={{ color: "#fff" }}>{token.symbol}</Typography>
      {token.verified && (
        <Tooltip title="Verified Token">
          <VerifiedUser
            sx={{
              fontSize: 16,
              color: "#00e676",
            }}
          />
        </Tooltip>
      )}
    </Box>
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
        decimal: Number(customTokenDecimals),
        verified: false, // Custom tokens are unverified by default
        logoURI: "",
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
      maxWidth="sm"
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
          placeholder="Search by name or paste address"
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
              <InputAdornment position="start">
                <Search sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
              </InputAdornment>
            ),
          }}
        />

<List>
        {filteredTokens.map((token) => (
          <ListItemButton
            key={token.address}
            selected={selectedToken?.address === token.address}
            onClick={() => {
              onSelect(token);
              onClose();
            }}
            sx={{ /* ... existing styles ... */ }}
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
              primary={<TokenName token={token} />}
              secondary={
                <Typography sx={{ color: "rgba(255, 255, 255, 0.6)" }}>
                  {token.name}
                </Typography>
              }
            />
            {token.balance ? (
              <Typography sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                {formatUnits(
                  token.balance,
                  token.decimal
                )}
              </Typography>
            ) : (
              <Typography sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                0
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
              placeholder="Token contract address"
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
              variant="contained"
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
              <Warning color="error" />
              <Typography color="error">{customTokenError}</Typography>
            </Box>
          )}
          <Typography
            sx={{
              color: "#ffb74d",
              fontSize: "0.875rem",
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            ⚠️ Custom tokens are unverified by default - Trade with caution
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};