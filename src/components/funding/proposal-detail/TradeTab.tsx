import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import { formatEther } from "viem";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { ProposalToken } from "../../../types/funding";

interface TradeTabProps {
  proposalToken: ProposalToken;
  tokenPrice: bigint | null;
  tokenBalance: bigint | null;
  openSwapDialog: (type: "buy" | "sell") => void;
  tradingPending: boolean;
  tradingConfirming: boolean;
  tradingError: Error | null;
  balanceLoading?: boolean;
}

export const TradeTab: React.FC<TradeTabProps> = ({
  proposalToken,
  tokenPrice,
  tokenBalance,
  openSwapDialog,
  tradingPending,
  tradingConfirming,
  tradingError,
  balanceLoading = false,
}) => {
  console.log("TradeTab rendering with:", { 
    tokenSymbol: proposalToken.tokenSymbol,
    tokenPrice: tokenPrice ? formatEther(tokenPrice) : null,
    tokenBalance: tokenBalance ? formatEther(tokenBalance) : null,
    hasTokens: tokenBalance ? tokenBalance > 0n : false
  });
  return (
    <Grid container spacing={3} sx={{ padding: "24px" }}>
      <Grid item xs={12} md={6}>
        <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
          Trade {proposalToken.tokenSymbol} Tokens
        </Typography>

        {tradingError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {tradingError.message ||
              "Error processing trade. Please try again."}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant='body1' sx={{ color: "white", mb: 3 }}>
            You can buy or sell {proposalToken.tokenSymbol} tokens using the
            automated market maker (AMM).
          </Typography>

          <Stack spacing={2} direction='row'>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => openSwapDialog("buy")}
              disabled={tradingPending || tradingConfirming || !tokenPrice}
              startIcon={<SwapHorizIcon />}
              sx={{ py: 1.5 }}
            >
              {!tokenPrice ? "Loading Price..." : "Buy Tokens"}
            </Button>

            <Button
              variant='outlined'
              fullWidth
              onClick={() => openSwapDialog("sell")}
              disabled={
                tradingPending ||
                tradingConfirming ||
                tokenBalance === undefined ||
                tokenBalance === null ||
                tokenBalance <= 0n
              }
              startIcon={<SwapHorizIcon />}
              sx={{
                py: 1.5,
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.5)",
              }}
            >
              {tokenBalance === undefined || balanceLoading ? 
                "Loading..." : 
                tokenBalance && tokenBalance > 0n ? 
                  "Sell Tokens" : 
                  "No Tokens to Sell"}
            </Button>
          </Stack>
        </Paper>

        <Typography variant='body2' sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          The token price is determined by the current liquidity pool ratio.
          Trading large amounts may result in significant price impact.
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
              Trading Information
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Current Price
                </Typography>
                {!tokenPrice ? (
                  <Typography
                    variant='body2'
                    sx={{ color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}
                  >
                    Loading price...
                  </Typography>
                ) : (
                  <Typography
                    variant='body2'
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {formatEther(tokenPrice)} ETH per{" "}
                    {proposalToken.tokenSymbol}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Your Token Balance
                </Typography>
                {balanceLoading ? (
                  <Typography
                    variant='body2'
                    sx={{ color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}
                  >
                    Loading balance...
                  </Typography>
                ) : (
                  <Typography
                    variant='body2'
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {tokenBalance !== null && tokenBalance !== undefined 
                      ? formatEther(tokenBalance) 
                      : "0"}{" "}
                    {proposalToken.tokenSymbol}
                    {tokenBalance && tokenBalance > 0n && (
                      <span style={{ color: "#4caf50", marginLeft: "4px" }}>
                        (Available to sell)
                      </span>
                    )}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />

              <Box>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 1 }}
                >
                  AMM Contract
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: "white", wordBreak: "break-all" }}
                >
                  {proposalToken.ammAddress}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
