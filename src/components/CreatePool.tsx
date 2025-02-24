import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useStakingContract } from "../hooks/useStakingContract";
import { useSnackbar } from "../contexts/SnackbarContext";
import { isAddress, formatEther } from "viem";
import { ErrorMessage } from "@/types/staking";

export const CreatePool = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [balanceError, setBalanceError] = useState<string>("");
  const { createPool, isPending, error, poolFee, validatePoolFee } = useStakingContract();
  const { showSnackbar } = useSnackbar();

  const commonInputStyles = {
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
      color: error ? "#ff6b6b" : "rgba(255, 255, 255, 0.5)",
    },
  };

  useEffect(() => {
    if (poolFee) {
      const validation = validatePoolFee();
      if (!validation.isValid) {
        setBalanceError(validation.error || "");
      } else {
        setBalanceError("");
      }
    }
  }, [poolFee, validatePoolFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(tokenAddress)) {
      showSnackbar("Invalid token address", "error");
      return;
    }

    // Check balance before proceeding
    const validation = validatePoolFee();
    if (!validation.isValid) {
      showSnackbar(validation.error || "Insufficient balance", "error");
      return;
    }

    try {
      await createPool(tokenAddress);
      showSnackbar("Pool created successfully!", "success");
      setTokenAddress("");
    } catch (err) {
      const error = err as ErrorMessage;
      showSnackbar(error.message || "Failed to create pool", "error");
    }
  };

  const renderPoolFeeAlert = () => {
    if (typeof poolFee === 'undefined') return null;
    
    const feeAmount = poolFee ? formatEther(poolFee as bigint) : '0';
    
    return (
      <Alert 
        severity={balanceError ? "error" : "info"}
        sx={{ 
          mb: 2,
          backgroundColor: balanceError 
            ? "rgba(211, 47, 47, 0.1)" 
            : "rgba(33, 150, 243, 0.1)",
          color: "white",
          "& .MuiAlert-icon": {
            color: balanceError ? "#f44336" : "#2196f3"
          }
        }}
      >
        {balanceError || `Pool creation fee: ${feeAmount} MON`}
      </Alert>
    );
  };

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
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            color: "#ffffff",
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            mb: 3,
          }}
        >
          Create Staking Pool
        </Typography>

        {renderPoolFeeAlert()}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Token Address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            disabled={isPending}
            margin="normal"
            required
            error={!!error}
            helperText={error?.message}
            sx={commonInputStyles}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={isPending || !tokenAddress || !!balanceError}
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
            {isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Pool"
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};