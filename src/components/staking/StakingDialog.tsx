import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Dialog as MuiDialog,
  DialogActions,
  DialogContentText,
  styled,
  alpha,
} from "@mui/material";
import { useERC20 } from "../../hooks/useERC20";
import { useStakingContract } from "../../hooks/useStakingContract";
import { formatUnits, parseUnits } from "viem";
import { ErrorMessage, StakeData, StakingOption } from "../../types/staking";
import { STAKING_CONTRACT_ADDRESS } from "../../constants";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { useStakingToken } from "../../hooks/useStakingToken";
import { useContractBalance } from "../../hooks/useContractBalance";
import { useWaitForTransactionReceipt } from "wagmi";

// Transaction Types
type TransactionType =
  | "approve"
  | "stake"
  | "unstake"
  | "unstakeFreeze"
  | "withdrawFrozen";

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
  "& .MuiDialogTitle-root": {
    color: "white",
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
  },
}));

const StyledCard = styled(Card)(() => ({
  background: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(5px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "12px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.2)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
}));

const StyledInfoCard = styled(StyledCard)(() => ({
  background: `linear-gradient(135deg, ${alpha("#9C27B0", 0.4)} 0%, ${alpha(
    "#673AB7",
    0.4
  )} 100%)`,
  backdropFilter: "blur(10px)",
}));

const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#9C27B0",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255, 255, 255, 0.7)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#9C27B0",
  },
  "& input": {
    color: "white",
  },
}));

const StyledTab = styled(Tab)({
  color: "rgba(255, 255, 255, 0.7)",
  "&.Mui-selected": {
    color: "white",
  },
  "&:hover": {
    color: "white",
    opacity: 1,
  },
});

const StyledButton = styled(Button)(() => ({
  background: "linear-gradient(45deg, #9C27B0 30%, #673AB7 90%)",
  border: 0,
  borderRadius: "8px",
  boxShadow: "0 3px 5px 2px rgba(156, 39, 176, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(45deg, #7B1FA2 30%, #512DA8 90%)",
    boxShadow: "0 4px 10px 2px rgba(156, 39, 176, .4)",
  },
  "&.Mui-disabled": {
    background: "rgba(255, 255, 255, 0.12)",
    color: "rgba(255, 255, 255, 0.3)",
  },
}));

interface StakingDialogProps {
  open: boolean;
  onClose: () => void;
  address: `0x${string}`;
  defaultOption?: StakingOption | null;
}

interface ErrorState {
  open: boolean;
  message: string;
  severity: "error" | "warning" | "info" | "success";
}

const parseErrorMessage = (error: ErrorMessage): string => {
  if (!error) return "An unknown error occurred";

  // Check if it's a viem error with transaction failure
  if (error.message?.includes("User rejected the request")) {
    return "Transaction was rejected by user";
  }

  // Check for insufficient balance
  if (error.message?.includes("insufficient balance")) {
    return "Insufficient balance to complete transaction";
  }

  // Check for common contract errors
  if (error.message?.includes("execution reverted")) {
    const revertMessage =
      error.message.split("execution reverted:")[1]?.trim() ||
      error.message.split("Error:")[1]?.trim();
    if (revertMessage) return revertMessage;
  }

  // Check for specific staking errors
  if (error.message?.includes("Invalid option")) {
    return "Invalid staking option selected";
  }
  if (error.message?.includes("Amount exceeds balance")) {
    return "Amount exceeds your available balance";
  }
  if (error.message?.includes("Amount exceeds allowance")) {
    return "Please approve tokens before staking";
  }
  if (error.message?.includes("Stake is locked")) {
    return "Stake is still locked. Please use frozen unstake or wait until lock period ends";
  }

  if (typeof error === "string") return error;
  if (error.message) return error.message.replace(/\[.*?\]|"|\\/g, "").trim();

  return "Transaction failed. Please try again";
};

export const StakingDialog: React.FC<StakingDialogProps> = ({
  open,
  onClose,
  address,
  defaultOption,
}) => {
  const [tab, setTab] = useState(0);
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<
    StakingOption | undefined
  >(defaultOption || undefined);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [stakedAmount, setStakedAmount] = useState("0");
  const [error, setError] = useState<ErrorState>({
    open: false,
    message: "",
    severity: "error",
  });
  const [rewardError, setRewardError] = useState<string>("");
  const [balanceError, setBalanceError] = useState<string>("");
  const [unstakeError, setUnstakeError] = useState<string>("");

  // Transaction tracking states
  const [pendingTxType, setPendingTxType] = useState<TransactionType | null>(
    null
  );
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { showSnackbar } = useSnackbar();

  const { balance: contractBalance } = useContractBalance(address);

  const {
    name,
    symbol,
    decimals,
    balance,
    allowance,
    approve,
    refetchAllowance,
    hash: approveHash,
    isApproving: isErc20Approving,
  } = useERC20(address);

  const {
    stakingData,
    stake,
    unstake,
    unstakeFreeze,
    withdrawFrozen,
    isPending,
    data: contractTxHash,
    refetchAllData,
  } = useStakingContract();

  const { stakingOptions, freezingBalance, availableFrozen, refetchAll } =
    useStakingToken(address);

  // Watch for approve transaction hash
  useEffect(() => {
    if (approveHash && pendingTxType === "approve" && !txHash) {
      setTxHash(approveHash);
      showSnackbar(
        "Approval transaction submitted. Waiting for confirmation...",
        "info"
      );
    }
  }, [approveHash, pendingTxType, txHash, showSnackbar]);

  // Watch for contract transaction hash (stake, unstake, etc.)
  useEffect(() => {
    if (
      contractTxHash &&
      pendingTxType &&
      pendingTxType !== "approve" &&
      !txHash
    ) {
      setTxHash(contractTxHash as `0x${string}`);
      const actionMap: Record<TransactionType, string> = {
        approve: "Approval",
        stake: "Staking",
        unstake: "Unstaking",
        unstakeFreeze: "Frozen unstake",
        withdrawFrozen: "Withdraw",
      };
      const actionName = actionMap[pendingTxType] || "Transaction";
      showSnackbar(
        `${actionName} transaction submitted. Waiting for confirmation...`,
        "info"
      );
    }
  }, [contractTxHash, pendingTxType, txHash, showSnackbar]);

  // Track transaction confirmation
  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  // Handle transaction status changes
  useEffect(() => {
    if (!txHash || !pendingTxType) return;

    if (isTxSuccess) {
      // Transaction succeeded
      let message = "Transaction successful";

      switch (pendingTxType) {
        case "approve":
          message = "Token approval successful";
          refetchAllowance();
          setIsApproving(false);
          break;
        case "stake":
          message = "Successfully staked tokens";
          refetchAllData();
          break;
        case "unstake":
          message = "Successfully unstaked tokens";
          refetchAllData();
          break;
        case "unstakeFreeze":
          message = "Frozen unstake initiated successfully";
          refetchAllData();
          refetchAll();
          setConfirmDialogOpen(false);
          break;
        case "withdrawFrozen":
          refetchAllData();
          refetchAll();
          message = "Frozen tokens withdrawn successfully";
          break;
      }

      showSnackbar(message, "success");

      // Reset transaction tracking state
      setPendingTxType(null);
      setTxHash(null);
    } else if (isTxError) {
      // Transaction failed
      showSnackbar(parseErrorMessage(txError as any), "error");

      // Reset transaction tracking state
      setPendingTxType(null);
      setTxHash(null);

      if (pendingTxType === "approve") {
        setIsApproving(false);
      }
    }
  }, [
    isTxSuccess,
    isTxError,
    txError,
    pendingTxType,
    txHash,
    refetchAllowance,
    showSnackbar,
    refetchAllData,
    refetchAll,
  ]);

  const handleError = (
    message: string,
    severity: ErrorState["severity"] = "error"
  ) => {
    console.log("Setting error:", { message, severity });
    setError({
      open: true,
      message,
      severity,
    });
  };

  // Calculate total staked amount
  const calculateTotalStakedAmount = (
    data?: StakeData[],
    option?: StakingOption
  ) => {
    if (!data) return "0";
    let total = 0n;
    data.forEach((stake) => {
      if (!option || stake.stakingOptionId === option.stakingOptionId) {
        total += BigInt(stake.amount);
      }
    });
    return formatUnits(total, Number(decimals) || 18);
  };

  // Validate amount against user's balance
  const validateAmount = (inputAmount: string): boolean => {
    if (!inputAmount || tab !== 0) {
      setBalanceError("");
      return true;
    }

    try {
      const amountNum = Number(inputAmount);
      const balanceNum = Number(balance);

      if (amountNum > balanceNum) {
        const errorMsg = `Amount exceeds your available balance (${balanceNum.toLocaleString()} ${symbol})`;
        setBalanceError(errorMsg);
        handleError(errorMsg, "warning");
        return false;
      }

      setBalanceError("");
      return true;
    } catch (error) {
      console.error("Error validating amount:", error);
      return false;
    }
  };

  // Validate unstake amount against the user's staked amount
  const validateUnstakeAmount = (inputAmount: string): boolean => {
    if (!inputAmount || !selectedOption || tab !== 1) {
      setUnstakeError("");
      return true;
    }

    try {
      const amountNum = Number(inputAmount);
      const stakedAmountNum = Number(stakedAmount);

      if (amountNum > stakedAmountNum) {
        const errorMsg = `Amount exceeds your staked amount (${stakedAmountNum.toLocaleString()} ${symbol})`;
        setUnstakeError(errorMsg);
        handleError(errorMsg, "warning");
        return false;
      }

      setUnstakeError("");
      return true;
    } catch (error) {
      console.error("Error validating unstake amount:", error);
      return false;
    }
  };

  useEffect(() => {
    if (error && error.open) {
      showSnackbar(error.message, error.severity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    try {
      const formattedAmount = calculateTotalStakedAmount(
        stakingData,
        selectedOption
      );
      setStakedAmount(formattedAmount);

      // Validate any existing amount entry against the new staked amount
      if (amount && tab === 1) {
        validateUnstakeAmount(amount);
      }
    } catch (error) {
      console.error("Error in staked amount calculation:", error);
      setStakedAmount("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakingData, selectedOption, decimals]);

  // Filter options based on tab and stake status
  const filteredOptions = stakingOptions?.filter((option) => {
    if (tab === 0) {
      // For Stake tab, only show active options
      return option.isActive;
    } else {
      // For Unstake tab, show both active and inactive options where user has stake
      const hasStake = stakingData?.some(
        (stake) =>
          stake.stakingOptionId === option.stakingOptionId &&
          Number(stake.amount) > 0
      );
      return option.isActive || hasStake;
    }
  });

  // Calculate the potential reward for stake tab
  const calculatePotentialReward = (option: StakingOption, amount: string) => {
    if (!amount || !option) return 0;
    const apy = Number(option.apy) / 100;
    const duration = Number(option.duration) / 31557600; // Convert seconds to years
    return Number(amount) * (apy / 100) * duration;
  };

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (!amount || tab === 1) {
      setNeedsApproval(false);
      return;
    }
    try {
      const amountBn = parseUnits(amount, Number(decimals) || 18);
      const allowanceBn = parseUnits(allowance, Number(decimals) || 18);
      setNeedsApproval(amountBn > allowanceBn);
    } catch (error) {
      console.error("Error checking approval:", error);
      setNeedsApproval(true);
    }
  }, [amount, allowance, decimals, tab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setSelectedOption(undefined);
    setAmount("");
    setBalanceError("");
    setRewardError("");
    setUnstakeError("");
  };

  const handleApprove = async () => {
    if (!amount) return;

    // Validate amount before approving
    if (!validateAmount(amount)) {
      return;
    }

    try {
      setIsApproving(true);
      setPendingTxType("approve");

      await approve(
        STAKING_CONTRACT_ADDRESS,
        parseUnits(amount, Number(decimals) || 18)
      );
    } catch (error) {
      console.error("Approval error:", error);
      handleError(parseErrorMessage(error as ErrorMessage), "error");
      setIsApproving(false);
      setPendingTxType(null);
    }
  };

  const handleOptionSelect = (option: StakingOption) => {
    setSelectedOption(option);

    // Reset unstake error when selecting a new option
    setUnstakeError("");

    if (amount) {
      if (tab === 0) {
        validateReward(option, amount);
      } else if (tab === 1) {
        validateUnstakeAmount(amount);
      }
    }
  };

  const handleStakeAction = async () => {
    if (!selectedOption || !amount) return;

    if (tab === 0) {
      if (!validateAmount(amount)) {
        return;
      }

      if (!validateReward(selectedOption, amount)) {
        handleError(rewardError, "error");
        return;
      }
    } else if (tab === 1) {
      if (!validateUnstakeAmount(amount)) {
        return;
      }
    }

    const userStake = stakingData?.find(
      (s) => s.stakingOptionId === selectedOption.stakingOptionId
    );

    try {
      if (tab === 0) {
        // Staking
        setPendingTxType("stake");
        await stake(
          address,
          selectedOption.stakingOptionId,
          parseUnits(amount, Number(decimals) || 18)
        );
      } else {
        const currentTime = Math.floor(Date.now() / 1000);
        const stakeDuration = Number(selectedOption.duration);
        const stakeStartTime = userStake ? Number(userStake.startTime) : 0;
        const endTime = stakeStartTime + stakeDuration;

        if (currentTime < endTime) {
          // Show confirmation dialog for locked stakes
          setConfirmDialogOpen(true);
          return;
        }

        // Normal unstake for unlocked stakes
        setPendingTxType("unstake");
        await unstake(
          address,
          selectedOption.stakingOptionId,
          parseUnits(amount, Number(decimals) || 18)
        );
      }
    } catch (error) {
      console.error("Stake/Unstake error:", error);
      handleError(parseErrorMessage(error as ErrorMessage), "error");
      setPendingTxType(null);
    }
  };

  const handleFrozenUnstake = async () => {
    if (!selectedOption || !amount) return;

    // Validate unstake amount before proceeding with frozen unstake
    if (!validateUnstakeAmount(amount)) {
      setConfirmDialogOpen(false);
      return;
    }

    try {
      setPendingTxType("unstakeFreeze");
      await unstakeFreeze(
        address,
        selectedOption.stakingOptionId,
        parseUnits(amount, Number(decimals) || 18)
      );
    } catch (error) {
      console.error("Frozen unstake error:", error);
      handleError(parseErrorMessage(error as ErrorMessage), "error");
      setPendingTxType(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleWithdrawFrozen = async () => {
    try {
      setPendingTxType("withdrawFrozen");
      await withdrawFrozen(address);
    } catch (error) {
      console.error("Withdraw frozen error:", error);
      handleError(parseErrorMessage(error as ErrorMessage), "error");
      setPendingTxType(null);
    }
  };

  const validateReward = (option: StakingOption, inputAmount: string) => {
    if (!inputAmount || !option || !contractBalance) return false;

    const potentialReward = calculatePotentialReward(option, inputAmount);
    const contractBalanceNum = Number(
      formatUnits(BigInt(contractBalance), Number(decimals) || 18)
    );

    if (potentialReward > contractBalanceNum) {
      setRewardError(
        `Potential reward (${potentialReward.toFixed(
          2
        )} ${symbol}) exceeds contract balance (${contractBalanceNum.toFixed(
          2
        )} ${symbol})`
      );
      return false;
    }

    setRewardError("");
    return true;
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);

      if (tab === 0) {
        // Validate amount against balance for staking tab
        validateAmount(value);

        // Continue with reward validation if option is selected
        if (selectedOption) {
          validateReward(selectedOption, value);
        }
      } else if (tab === 1) {
        // Validate unstake amount for unstaking tab
        validateUnstakeAmount(value);
      }

      // Clear previous warning errors
      if (error.severity === "warning" && !balanceError && !unstakeError) {
        setError((prev) => ({ ...prev, open: false }));
      }
    }
  };

  // Determine combined loading state
  const isSubmitting =
    isPending ||
    isApproving ||
    isErc20Approving ||
    isTxLoading ||
    !!pendingTxType;

  return (
    <>
      <StyledDialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Typography variant='h6' sx={{ color: "white", fontWeight: 600 }}>
            {name} Staking
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
              mb: 2,
            }}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant='fullWidth'
              TabIndicatorProps={{
                style: { background: "#9C27B0" },
              }}
            >
              <StyledTab label='Stake' />
              <StyledTab label='Unstake' />
              <StyledTab label='Frozen Token' />
            </Tabs>
          </Box>

          <Stack spacing={2}>
            {tab === 2 ? (
              <Box>
                <Typography
                  variant='subtitle1'
                  gutterBottom
                  sx={{ color: "white" }}
                >
                  Frozen Token Details
                </Typography>
                <StyledInfoCard>
                  <CardContent>
                    <Typography
                      variant='body1'
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Unfreezing Tokens:{" "}
                      {parseFloat(
                        formatUnits(
                          BigInt(freezingBalance?.toString() || "0"),
                          Number(decimals) || 18
                        )
                      ).toLocaleString()}{" "}
                      {symbol}
                    </Typography>
                    <Typography
                      variant='body1'
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Available for Withdrawal:{" "}
                      {parseFloat(
                        formatUnits(
                          BigInt(availableFrozen?.toString() || "0"),
                          Number(decimals) || 18
                        )
                      ).toLocaleString()}{" "}
                      {symbol}
                    </Typography>
                    {Number(availableFrozen || 0n) > 0 && (
                      <StyledButton
                        onClick={() => handleWithdrawFrozen()}
                        disabled={isSubmitting}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} color='inherit' />
                        ) : (
                          "Withdraw Available Tokens"
                        )}
                      </StyledButton>
                    )}
                  </CardContent>
                </StyledInfoCard>
              </Box>
            ) : (
              <>
                <StyledInfoCard>
                  <CardContent>
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          Total Staked Amount
                        </Typography>
                        <Typography variant='h6' sx={{ color: "white", mt: 1 }}>
                          {parseFloat(stakedAmount).toLocaleString()} {symbol}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          Available Balance
                        </Typography>
                        <Typography variant='h6' sx={{ color: "white", mt: 1 }}>
                          {Number(balance).toLocaleString()} {symbol}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </StyledInfoCard>

                <StyledTextField
                  fullWidth
                  type='text'
                  label={`Amount in ${symbol}`}
                  value={amount}
                  onChange={handleAmountChange}
                  variant='outlined'
                  error={!!balanceError || !!rewardError || !!unstakeError}
                  helperText={balanceError || rewardError || unstakeError}
                  FormHelperTextProps={{
                    sx: { color: "#f44336" },
                  }}
                />

                <Box>
                  <Typography
                    variant='subtitle2'
                    gutterBottom
                    sx={{ color: "white", mb: 2 }}
                  >
                    {tab === 0
                      ? "Select Staking Option"
                      : "Select Token to Unstake"}
                  </Typography>
                  {filteredOptions?.map((option) => {
                    const userStake = stakingData?.find(
                      (s) => s.stakingOptionId === option.stakingOptionId
                    );
                    const stakedAmount = userStake
                      ? Number(userStake.amount)
                      : 0;
                    const potentialReward =
                      tab === 0 && amount
                        ? calculatePotentialReward(option, amount)
                        : 0;

                    const stakingStartTime = userStake
                      ? new Date(Number(userStake.startTime) * 1000)
                      : null;
                    const currentTime = Date.now() / 1000;
                    const remainingTime = stakingStartTime
                      ? Number(userStake?.startTime) +
                        Number(option.duration) -
                        currentTime
                      : 0;
                    const remainingDays = Math.max(
                      0,
                      Math.ceil(remainingTime / 86400)
                    );

                    return (
                      <StyledCard
                        key={option.stakingOptionId}
                        sx={{
                          mb: 1,
                          cursor: "pointer",
                          border:
                            selectedOption?.stakingOptionId ===
                            option.stakingOptionId
                              ? `2px solid #9C27B0`
                              : "1px solid rgba(255, 255, 255, 0.2)",
                          "&:hover": {
                            borderColor: "#9C27B0",
                          },
                          opacity: option.isActive ? 1 : 0.8,
                        }}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant='body1' sx={{ color: "white" }}>
                              Duration: {Number(option.duration) / 86400} days
                            </Typography>
                            {!option.isActive && (
                              <Chip
                                label='Inactive'
                                color='warning'
                                size='small'
                                sx={{
                                  backgroundColor: "rgba(237, 108, 2, 0.2)",
                                  color: "#ed6c02",
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant='body1' sx={{ color: "white" }}>
                            APY: {Number(option.apy) / 100}%
                          </Typography>
                          {tab === 0 && amount && (
                            <Typography
                              variant='body2'
                              sx={{
                                color: "#66bb6a",
                                mt: 1,
                              }}
                            >
                              Potential Reward: {potentialReward.toFixed(2)}{" "}
                              {symbol}
                            </Typography>
                          )}
                          {stakedAmount > 0 && (
                            <Typography
                              variant='body2'
                              sx={{
                                color: "#9C27B0",
                                mt: 1,
                              }}
                            >
                              Your stake:{" "}
                              {parseFloat(
                                formatUnits(
                                  BigInt(stakedAmount),
                                  Number(decimals) || 18
                                )
                              ).toLocaleString()}{" "}
                              {symbol}
                            </Typography>
                          )}
                          {tab === 1 &&
                            stakedAmount > 0 &&
                            stakingStartTime && (
                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  variant='body2'
                                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                                >
                                  Staked on:{" "}
                                  {stakingStartTime.toLocaleDateString()}
                                </Typography>
                                {remainingDays > 0 ? (
                                  <Typography
                                    variant='body2'
                                    sx={{ color: "#ed6c02" }}
                                  >
                                    Locked for {remainingDays} more days
                                  </Typography>
                                ) : (
                                  <Typography
                                    variant='body2'
                                    sx={{ color: "#66bb6a" }}
                                  >
                                    Available for unstaking
                                  </Typography>
                                )}
                              </Box>
                            )}
                        </CardContent>
                      </StyledCard>
                    );
                  })}
                </Box>

                {tab === 0 && needsApproval ? (
                  <StyledButton
                    fullWidth
                    disabled={
                      !selectedOption ||
                      !amount ||
                      isSubmitting ||
                      !!balanceError
                    }
                    onClick={handleApprove}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color='inherit' />
                    ) : (
                      `Approve ${symbol}`
                    )}
                  </StyledButton>
                ) : (
                  <StyledButton
                    fullWidth
                    disabled={
                      !selectedOption ||
                      !amount ||
                      isSubmitting ||
                      (tab === 0 && (!!rewardError || !!balanceError)) ||
                      (tab === 1 && !!unstakeError)
                    }
                    onClick={handleStakeAction}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color='inherit' />
                    ) : (
                      `${tab === 0 ? "Stake" : "Unstake"} ${symbol}`
                    )}
                  </StyledButton>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
      </StyledDialog>

      <MuiDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Confirm Early Unstake</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Your tokens are still locked. Proceeding will initiate frozen
            unstaking with penalties. Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{ color: "white" }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <StyledButton
            onClick={handleFrozenUnstake}
            disabled={isSubmitting}
            sx={{
              background: "linear-gradient(45deg, #f44336 30%, #d32f2f 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f 30%, #c62828 90%)",
              },
            }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color='inherit' />
            ) : (
              "Proceed"
            )}
          </StyledButton>
        </DialogActions>
      </MuiDialog>
    </>
  );
};
