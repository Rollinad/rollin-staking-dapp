import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { formatEther } from "viem";
import { ProposalToken } from "../../../types/funding";

interface SwapDialogProps {
  isOpen: boolean;
  swapType: "buy" | "sell";
  swapAmount: string;
  proposalToken: ProposalToken;
  tokenPrice: bigint | null;
  handleSwapAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSwap: () => void;
  handleClose: () => void;
  tradingPending: boolean;
  tradingConfirming: boolean;
  tradingError: Error | null;
}

export const SwapDialog: React.FC<SwapDialogProps> = ({
  isOpen,
  swapType,
  swapAmount,
  proposalToken,
  tokenPrice,
  handleSwapAmountChange,
  handleSwap,
  handleClose,
  tradingPending,
  tradingConfirming,
  tradingError,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          color: "white",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          minWidth: 350,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        {swapType === "buy"
          ? `Buy ${proposalToken.tokenSymbol} Tokens`
          : `Sell ${proposalToken.tokenSymbol} Tokens`}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <TextField
          label={
            swapType === "buy"
              ? "ETH Amount"
              : `${proposalToken.tokenSymbol} Amount`
          }
          fullWidth
          value={swapAmount}
          onChange={handleSwapAmountChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ color: "white" }}>
                {swapType === "buy" ? "ETH" : proposalToken.tokenSymbol}
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={{
            mt: 1,
            mb: 3,
            input: { color: "white" },
            label: { color: "rgba(255, 255, 255, 0.7)" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.3)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.5)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
        />

        <Box sx={{ mb: 2, p: 2, bgcolor: "rgba(255, 255, 255, 0.05)", borderRadius: 1 }}>
          {swapType === "buy" && tokenPrice && (
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              You will receive approximately{" "}
              <span style={{ color: "white", fontWeight: "bold" }}>
                {swapAmount && parseFloat(swapAmount) > 0
                  ? (
                      parseFloat(swapAmount) / parseFloat(formatEther(tokenPrice))
                    ).toFixed(6)
                  : "0"}{" "}
                {proposalToken.tokenSymbol}
              </span> tokens.
            </Typography>
          )}

          {swapType === "sell" && tokenPrice && (
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              You will receive approximately{" "}
              <span style={{ color: "white", fontWeight: "bold" }}>
                {swapAmount && parseFloat(swapAmount) > 0
                  ? (
                      parseFloat(swapAmount) * parseFloat(formatEther(tokenPrice))
                    ).toFixed(6)
                  : "0"}{" "}
                ETH
              </span>.
            </Typography>
          )}
        </Box>

        {tradingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {tradingError.message ||
              "Error processing trade. Please try again."}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            color: "white", 
            borderColor: "rgba(255, 255, 255, 0.3)",
            "&:hover": {
              borderColor: "rgba(255, 255, 255, 0.5)",
              backgroundColor: "rgba(255, 255, 255, 0.05)"
            }
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            console.log("Attempting swap:", { swapType, swapAmount, proposalId: proposalToken.tokenAddress });
            handleSwap();
          }}
          disabled={
            !swapAmount ||
            parseFloat(swapAmount) <= 0 ||
            tradingPending ||
            tradingConfirming
          }
          sx={{ 
            borderRadius: 1,
            background: swapType === "buy" ? "linear-gradient(90deg, #3f51b5 0%, #2196f3 100%)" : "linear-gradient(90deg, #f44336 0%, #ff9800 100%)",
            "&:hover": {
              background: swapType === "buy" ? "linear-gradient(90deg, #303f9f 0%, #1976d2 100%)" : "linear-gradient(90deg, #d32f2f 0%, #f57c00 100%)"
            }
          }}
        >
          {tradingPending || tradingConfirming ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : swapType === "buy" ? (
            "Buy Tokens"
          ) : (
            "Sell Tokens"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
