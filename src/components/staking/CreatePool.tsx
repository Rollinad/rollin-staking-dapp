import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useStakingContract } from "../../hooks/useStakingContract";
import { useERC20 } from "../../hooks/useERC20";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { isAddress, parseUnits } from "viem";
import { ErrorMessage } from "../../types/staking";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";

export const CreatePool = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [validatingAllocation, setValidatingAllocation] = useState(false);
  const [allocationError, setAllocationError] = useState("");
  const [requiredAmount, setRequiredAmount] = useState<bigint | null>(null);

  const { createPool, isPending, error, allocationPercent } =
    useStakingContract();
  const { showSnackbar } = useSnackbar();

  const validAddress = isAddress(tokenAddress)
    ? (tokenAddress as `0x${string}`)
    : undefined;
  const token = useERC20(validAddress!);

  const { data: tokenTotalSupply, isLoading: loadingTotalSupply } =
    useReadContract({
      address: validAddress,
      abi: erc20Abi,
      functionName: "totalSupply",
    });

  // Calculate required allocation whenever relevant data changes
  useEffect(() => {
    const checkAllocation = async () => {
      if (!validAddress || !token || !allocationPercent || !tokenTotalSupply) {
        return;
      }

      try {
        setValidatingAllocation(true);
        setAllocationError("");

        // Calculate required amount based on total supply and allocation percent
        const calculatedRequiredAmount =
          (tokenTotalSupply as bigint) / BigInt(allocationPercent);
        setRequiredAmount(calculatedRequiredAmount);

        // Check if user has enough tokens
        const userBalanceBigInt = parseUnits(
          token.balance,
          Number(token.decimals || 18)
        );

        if (userBalanceBigInt < calculatedRequiredAmount) {
          const requiredFormatted =
            Number(calculatedRequiredAmount) /
            10 ** Number(token.decimals || 18);
          const allocationPercentFormatted = Number(allocationPercent) / 100;

          setAllocationError(
            `Insufficient ${token.symbol || "token"} allocation. You have ${
              token.balance
            } ${
              token.symbol || "tokens"
            } but need ${requiredFormatted.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })} ${
              token.symbol || "tokens"
            } (${allocationPercentFormatted}% of total supply).`
          );
        }
      } catch (err) {
        console.error("Error checking allocation:", err);
        setAllocationError("Failed to verify token allocation requirement");
      } finally {
        setValidatingAllocation(false);
      }
    };

    checkAllocation();
  }, [
    validAddress,
    token.balance,
    token.decimals,
    token.symbol,
    allocationPercent,
    tokenTotalSupply,
    token,
  ]);

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
      color: error ? "#ff6b6b" : "rgba(255, 255, 255, 0.5)",
    },
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validAddress) {
      showSnackbar("Invalid token address", "error");
      return;
    }

    if (allocationError) {
      showSnackbar(allocationError, "error");
      return;
    }

    try {
      await createPool(validAddress);
      showSnackbar("Pool created successfully!", "success");
      setTokenAddress("");
      setAllocationError("");
    } catch (err) {
      const catchedException = err as ErrorMessage;
      const errorMessage = catchedException.message || "Failed to create pool";

      if (
        errorMessage.includes("Insufficient allocation") ||
        errorMessage.includes("Insufficient token allocation")
      ) {
        setAllocationError(errorMessage);
      } else {
        showSnackbar(errorMessage, "error");
      }
    }
  };

  // Loading state
  const isLoading =
    isPending ||
    validatingAllocation ||
    loadingTotalSupply ||
    token?.isApproving;

  // Format allocation requirement for display
  const formattedAllocationRequirement = useMemo(
    () =>
      allocationPercent ? `${Number(allocationPercent)}%` : "loading...",
    [allocationPercent]
  );

  console.log(`allocationPercent ${allocationPercent}`)

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
            Create Staking Pool
          </Typography>

          <Tooltip
            title={`You need to own at least ${formattedAllocationRequirement} of the token's total supply to create a staking pool.`}
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
          Create a new staking pool for your token. You must own at least{" "}
          {formattedAllocationRequirement} of the token's total supply.
        </Typography>

        {/* Token Information Section */}
        {token && token.name && token.symbol && (
          <Box
            sx={{
              mb: 3,
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
              <Typography
                variant='body2'
                sx={{
                  color: allocationError ? "#ff6b6b" : "#ffffff",
                  fontWeight: allocationError ? "medium" : "normal",
                }}
              >
                {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.symbol}
              </Typography>
            </Box>

            {requiredAmount && token.decimals && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Required for Pool:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: allocationError
                      ? "#ff6b6b"
                      : "rgba(156, 39, 176, 0.9)",
                    fontWeight: "medium",
                  }}
                >
                  {(
                    Number(requiredAmount) /
                    10 ** Number(token.decimals)
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}{" "}
                  {token.symbol}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Allocation Error Alert */}
        {allocationError && (
          <Alert
            severity='error'
            sx={{
              mb: 3,
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              color: "#ffffff",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              "& .MuiAlert-icon": {
                color: "#f44336",
              },
            }}
          >
            <AlertTitle>Insufficient Allocation</AlertTitle>
            {allocationError}
          </Alert>
        )}

        {/* Form */}
        <Box component='form' onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label='Token Address'
            value={tokenAddress}
            onChange={(e) => {
              setTokenAddress(e.target.value);
              setAllocationError("");
              setRequiredAmount(null);
            }}
            disabled={isLoading}
            margin='normal'
            required
            error={!!error || !!allocationError}
            helperText={error?.message}
            sx={inputStyles}
          />

          <Button
            variant='contained'
            type='submit'
            disabled={
              isLoading || !tokenAddress || !!allocationError || !validAddress
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
            ) : (
              "Create Pool"
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
