// src/components/funding/proposal-detail/SwapDialog.tsx
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
          bgcolor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(20px)",
          color: "white",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          minWidth: 350,
        },
      }}
    >
      <DialogTitle>
        {swapType === "buy"
          ? `Buy ${proposalToken.tokenSymbol} Tokens`
          : `Sell ${proposalToken.tokenSymbol} Tokens`}
      </DialogTitle>

      <DialogContent>
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
              <InputAdornment position='end' sx={{ color: "white" }}>
                {swapType === "buy" ? "ETH" : proposalToken.tokenSymbol}
              </InputAdornment>
            ),
          }}
          variant='outlined'
          sx={{
            mt: 2,
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

        {swapType === "buy" && tokenPrice && (
          <Typography
            variant='body2'
            sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
          >
            You will receive approximately{" "}
            {swapAmount && parseFloat(swapAmount) > 0
              ? (
                  parseFloat(swapAmount) / parseFloat(formatEther(tokenPrice))
                ).toFixed(6)
              : "0"}{" "}
            {proposalToken.tokenSymbol} tokens.
          </Typography>
        )}

        {swapType === "sell" && tokenPrice && (
          <Typography
            variant='body2'
            sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
          >
            You will receive approximately{" "}
            {swapAmount && parseFloat(swapAmount) > 0
              ? (
                  parseFloat(swapAmount) * parseFloat(formatEther(tokenPrice))
                ).toFixed(6)
              : "0"}{" "}
            ETH.
          </Typography>
        )}

        {tradingError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {tradingError.message ||
              "Error processing trade. Please try again."}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleClose}
          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          Cancel
        </Button>

        <Button
          variant='contained'
          onClick={handleSwap}
          disabled={
            !swapAmount ||
            parseFloat(swapAmount) <= 0 ||
            tradingPending ||
            tradingConfirming
          }
        >
          {tradingPending || tradingConfirming ? (
            <CircularProgress size={24} />
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
