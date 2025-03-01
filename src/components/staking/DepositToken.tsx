import { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useERC20 } from "../../hooks/useERC20";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { isAddress } from "viem";
import { useStakingContract } from "../../hooks/useStakingContract";
import { useDepositToken } from "../../hooks/useDepositToken";

export const DepositToken = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [processingTx, setProcessingTx] = useState(false);

  const { depositTokens, isPending, isApproving } = useDepositToken();
  const { showSnackbar } = useSnackbar();
  const { registeredContracts } = useStakingContract();

  const validAddress = isAddress(tokenAddress)
    ? (tokenAddress as `0x${string}`)
    : undefined;
  const token = useERC20(validAddress!);

  // Input styles
  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#9C27B0",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.7)",
      "&.Mui-focused": {
        color: "#9C27B0",
      },
    },
    "& .MuiInputBase-input": {
      color: "#ffffff",
    },
    "& .MuiFormHelperText-root": {
      color: "rgba(255, 255, 255, 0.5)",
    },
  };

  // Format registered contracts for select dropdown
  const formattedTokens = ((registeredContracts as `0x${string}`[]) || []).map(
    (contract) => ({
      address: contract,
    })
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validAddress) {
      showSnackbar("Invalid token address", "error");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showSnackbar("Please enter a valid amount", "error");
      return;
    }

    if (parseFloat(amount) > parseFloat(token.balance)) {
      showSnackbar(
        `Insufficient balance. You have ${token.balance} ${token.symbol}`,
        "error"
      );
      return;
    }

    try {
      setProcessingTx(true);
      await depositTokens(validAddress, amount, Number(token.decimals) || 18);
      showSnackbar("Tokens deposited successfully!", "success");
      setAmount("");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to deposit tokens", "error");
    } finally {
      setProcessingTx(false);
    }
  };

  // Loading state
  const isLoading = isPending || isApproving || processingTx;

  return (
    <Card
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography
            variant='h5'
            sx={{
              color: "#ffffff",
              fontWeight: "bold",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            Deposit Reward Tokens
          </Typography>

          <Tooltip
            title='Deposit tokens to use as rewards for stakers in your pool'
            arrow
          >
            <IconButton sx={{ ml: 1, color: "rgba(255, 255, 255, 0.6)" }}>
              <InfoIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography
          variant='body2'
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            mb: 3,
          }}
        >
          Deposit tokens to provide rewards for stakers in your pool. These
          tokens will be distributed as rewards to users who stake in your pool.
        </Typography>

        {/* Form */}
        <Box component='form' onSubmit={handleSubmit}>
          <FormControl fullWidth margin='normal' sx={inputStyles}>
            <InputLabel id='token-select-label'>Select Token Pool</InputLabel>
            <Select
              labelId='token-select-label'
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              label='Select Token Pool'
              disabled={isLoading}
            >
              {formattedTokens.map((token) => (
                <MenuItem key={token.address} value={token.address}>
                  {token.address}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {validAddress && token.name && (
            <Box
              sx={{
                mb: 3,
                mt: 2,
                p: 2,
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(156, 39, 176, 0.2)",
              }}
            >
              <Typography
                variant='subtitle1'
                sx={{ color: "#ffffff", fontWeight: "medium", mb: 1 }}
              >
                Token Information
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Name:
                </Typography>
                <Typography variant='body2' sx={{ color: "#ffffff" }}>
                  {token.name}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Symbol:
                </Typography>
                <Typography variant='body2' sx={{ color: "#ffffff" }}>
                  {token.symbol}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Your Balance:
                </Typography>
                <Typography variant='body2' sx={{ color: "#ffffff" }}>
                  {parseFloat(token.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {token.symbol}
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label='Amount'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading || !validAddress}
            margin='normal'
            required
            type='number'
            inputProps={{ step: "any", min: 0 }}
            helperText={`Enter amount of ${
              token.symbol || "tokens"
            } to deposit`}
            sx={inputStyles}
          />

          <Button
            variant='contained'
            type='submit'
            disabled={
              isLoading ||
              !tokenAddress ||
              !amount ||
              !validAddress ||
              parseFloat(amount) <= 0
            }
            fullWidth
            sx={{
              mt: 3,
              backgroundColor: "rgba(156, 39, 176, 0.8)",
              backdropFilter: "blur(5px)",
              "&:hover": {
                backgroundColor: "rgba(156, 39, 176, 0.9)",
              },
              "&:disabled": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color='inherit' />
            ) : isApproving ? (
              "Approving..."
            ) : (
              "Deposit Tokens"
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
