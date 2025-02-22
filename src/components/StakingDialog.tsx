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
  useTheme,
  CircularProgress,
  Stack,
  Chip,
  Dialog as MuiDialog,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { useERC20 } from "../hooks/useERC20";
import { useStakingContract } from "../hooks/useStakingContract";
import { formatUnits, parseUnits } from "viem";
import { StakeData, StakingOption } from "../types/staking";
import { STAKING_CONTRACT_ADDRESS } from "../constants";
import { useStakingToken } from "@/hooks/useStakingToken";

interface StakingDialogProps {
  open: boolean;
  onClose: () => void;
  address: `0x${string}`;
  defaultOption?: StakingOption | null;
}

export const StakingDialog: React.FC<StakingDialogProps> = ({
  open,
  onClose,
  address,
  defaultOption,
}) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<
    StakingOption | undefined
  >(defaultOption || undefined);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [stakedAmount, setStakedAmount] = useState("0");

  const {
    name,
    symbol,
    decimals,
    balance,
    allowance,
    approve,
    refetchAllowance,
  } = useERC20(address);

  const {
    stakingData,
    stake,
    unstake,
    unstakeFreeze,
    withdrawFrozen,
    isPending,
  } = useStakingContract();

  const { stakingOptions, freezingBalance, availableFrozen } =
    useStakingToken(address);

  console.log(`freezingBalance ${freezingBalance}`);

  // Calculate total staked amount
  const calculateTotalStakedAmount = (
    data?: StakeData[],
    option?: StakingOption
  ) => {
    if (!data) return "0";
    let total = 0n; // Use BigInt for the calculation

    data.forEach((stake) => {
      if (!option || stake.stakingOptionId === option.stakingOptionId) {
        // Convert stake.amount to BigInt since it's already in Wei
        total += BigInt(stake.amount);
      }
    });

    // Format the number by dividing by 10^decimals
    return formatUnits(total, Number(decimals) || 18);
  };

  useEffect(() => {
    try {
      const formattedAmount = calculateTotalStakedAmount(
        stakingData,
        selectedOption
      );
      console.log("Formatted amount:", formattedAmount);
      setStakedAmount(formattedAmount);
    } catch (error) {
      console.error("Error in staked amount calculation:", error);
      setStakedAmount("0");
    }
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
    const amountBn = parseFloat(amount);
    const allowanceBn = parseFloat(allowance);
    setNeedsApproval(amountBn > allowanceBn);
  }, [amount, allowance, tab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setSelectedOption(undefined);
    setAmount("");
  };

  const handleApprove = async () => {
    if (!amount) return;

    try {
      setIsApproving(true);
      await approve(
        STAKING_CONTRACT_ADDRESS,
        parseUnits(amount, Number(decimals) || 18)
      );
      await refetchAllowance();
      setIsApproving(false);
    } catch (error) {
      console.error("Approval error:", error);
      setIsApproving(false);
    }
  };

  const handleFrozenUnstake = async () => {
    if (!selectedOption || !amount) return;
    try {
      await unstakeFreeze(
        address,
        selectedOption.stakingOptionId,
        parseUnits(amount, Number(decimals) || 18)
      );
      onClose();
    } catch (error) {
      console.error("Unstake freeze error:", error);
    }
  };

  const handleStakeAction = async () => {
    if (!selectedOption || !amount) return;

    const userStake = stakingData?.find(
      (s) => s.stakingOptionId === selectedOption.stakingOptionId
    );

    const currentTime = Date.now() / 1000;
    const isLocked =
      userStake &&
      currentTime - Number(userStake.startTime) <
        Number(selectedOption.duration);

    if (tab === 1 && isLocked) {
      setConfirmDialogOpen(true);
      return;
    }

    try {
      if (tab === 0) {
        await stake(
          address,
          selectedOption.stakingOptionId,
          parseUnits(amount, Number(decimals) || 18)
        );
      } else {
        await unstake(
          address,
          selectedOption.stakingOptionId,
          parseUnits(amount, Number(decimals) || 18)
        );
      }
      onClose();
    } catch (error) {
      console.error("Staking error:", error);
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => (
    <MuiDialog
      open={confirmDialogOpen}
      onClose={() => setConfirmDialogOpen(false)}
    >
      <DialogTitle>Confirm Early Unstake</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Your tokens are still locked. Proceeding will initiate frozen
          unstaking with penalties. Do you want to proceed?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialogOpen(false)} color='primary'>
          Cancel
        </Button>
        <Button
          onClick={async () => {
            await handleFrozenUnstake();
            setConfirmDialogOpen(false);
          }}
          color='warning'
        >
          Proceed
        </Button>
      </DialogActions>
    </MuiDialog>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant='h6'>{name} Staking</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={tab} onChange={handleTabChange} variant='fullWidth'>
              <Tab label='Stake' />
              <Tab label='Unstake' />
              <Tab label='Frozen Token' />
            </Tabs>
          </Box>

          <Stack spacing={2}>
            {tab === 2 ? (
              // Frozen Token Tab
              <Box>
                <Typography variant='subtitle1' gutterBottom>
                  Frozen Token Details
                </Typography>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant='body1' gutterBottom>
                      Unfreezing Tokens:{" "}
                      {parseFloat(
                        formatUnits(
                          BigInt(freezingBalance?.toString() || "0"),
                          Number(decimals) || 18
                        )
                      ).toLocaleString()}{" "}
                      {symbol}
                    </Typography>
                    <Typography variant='body1' gutterBottom>
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
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => withdrawFrozen(address)}
                        disabled={isPending}
                        sx={{ mt: 2 }}
                      >
                        {isPending ? (
                          <CircularProgress size={24} color='inherit' />
                        ) : (
                          "Withdraw Available Tokens"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <>
                <Card sx={{ mb: 2, bgcolor: "primary.light" }}>
                  <CardContent>
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Box>
                        <Typography variant='subtitle2' color='white'>
                          Total Staked Amount
                        </Typography>
                        <Typography variant='h6' color='white'>
                          {parseFloat(stakedAmount).toLocaleString()} {symbol}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant='subtitle2' color='white'>
                          Available Balance
                        </Typography>
                        <Typography variant='h6' color='white'>
                          {Number(balance).toLocaleString()} {symbol}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Box>
                  <TextField
                    fullWidth
                    type='text'
                    label={`Amount in ${symbol}`}
                    value={amount}
                    onChange={handleAmountChange}
                    variant='outlined'
                  />
                </Box>

                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    {tab === 0
                      ? "Select Staking Option"
                      : "Select Token to Unstake"}
                  </Typography>
                  {filteredOptions?.map((option) => {
                    const userStake = stakingData?.find(
                      (stake) =>
                        stake.stakingOptionId === option.stakingOptionId
                    );
                    const stakedAmount = userStake
                      ? Number(userStake.amount)
                      : 0;
                    const potentialReward =
                      tab === 0 && amount
                        ? calculatePotentialReward(option, amount)
                        : 0;

                    // Add staking start time info for unstake tab
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
                      <Card
                        key={option.stakingOptionId}
                        sx={{
                          mb: 1,
                          cursor: "pointer",
                          border:
                            selectedOption?.stakingOptionId ===
                            option.stakingOptionId
                              ? `2px solid ${theme.palette.primary.main}`
                              : "1px solid rgba(0, 0, 0, 0.12)",
                          "&:hover": {
                            borderColor: theme.palette.primary.main,
                          },
                          opacity: option.isActive ? 1 : 0.8,
                        }}
                        onClick={() => setSelectedOption(option)}
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
                            <Typography variant='body1'>
                              Duration: {Number(option.duration) / 86400} days
                            </Typography>
                            {!option.isActive && (
                              <Chip
                                label='Inactive'
                                color='warning'
                                size='small'
                              />
                            )}
                          </Box>
                          <Typography variant='body1'>
                            APY: {Number(option.apy) / 100}%
                          </Typography>
                          {tab === 0 && amount && (
                            <Typography
                              variant='body2'
                              color='success.main'
                              sx={{ mt: 1 }}
                            >
                              Potential Reward: {potentialReward.toFixed(2)}{" "}
                              {symbol}
                            </Typography>
                          )}
                          {stakedAmount > 0 && (
                            <Typography
                              variant='body2'
                              color='primary'
                              sx={{ mt: 1 }}
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
                                  color='text.secondary'
                                >
                                  Staked on:{" "}
                                  {stakingStartTime.toLocaleDateString()}
                                </Typography>
                                {remainingDays > 0 ? (
                                  <Typography
                                    variant='body2'
                                    color='warning.main'
                                  >
                                    Locked for {remainingDays} more days
                                  </Typography>
                                ) : (
                                  <Typography
                                    variant='body2'
                                    color='success.main'
                                  >
                                    Available for unstaking
                                  </Typography>
                                )}
                              </Box>
                            )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                {tab === 0 && needsApproval ? (
                  <Button
                    fullWidth
                    variant='contained'
                    color='primary'
                    disabled={!selectedOption || !amount || isApproving}
                    onClick={handleApprove}
                  >
                    {isApproving ? (
                      <CircularProgress size={24} color='inherit' />
                    ) : (
                      `Approve ${symbol}`
                    )}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant='contained'
                    color='primary'
                    disabled={!selectedOption || !amount || isPending}
                    onClick={handleStakeAction}
                  >
                    {isPending ? (
                      <CircularProgress size={24} color='inherit' />
                    ) : (
                      `${tab === 0 ? "Stake" : "Unstake"} ${symbol}`
                    )}
                  </Button>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog />
    </>
  );
};
