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
  Alert,
  AlertTitle,
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useERC20 } from "../hooks/useERC20";
import { useStakingContract } from "../hooks/useStakingContract";
import { parseUnits } from "viem";
import { StakingOption } from "../types/staking";
import { STAKING_CONTRACT_ADDRESS } from "../constants";

interface StakingDialogProps {
    open: boolean;
    onClose: () => void;
    address: `0x${string}`;
    stakingOptions?: StakingOption[];
    defaultOption?: StakingOption | null;
  }

export const StakingDialog: React.FC<StakingDialogProps> = ({
  open,
  onClose,
  address,
  stakingOptions,
  defaultOption,
}) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(
    defaultOption || null
  );
  const [showWarning, setShowWarning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  console.log(`needsApproval ${needsApproval}`);

  const {
    name,
    symbol,
    decimals,
    balance,
    allowance,
    approve,
    refetchAllowance,
  } = useERC20(address);

  const { stakingData, stake, unstake, unstakeFreeze, isPending } =
    useStakingContract();

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (!amount || tab === 1) {
      // Don't check for unstaking
      setNeedsApproval(false);
      return;
    }
    const amountBn = parseFloat(amount);
    const allowanceBn = parseFloat(allowance);
    setNeedsApproval(amountBn > allowanceBn);
  }, [amount, allowance, tab]);

  console.log(`allowance ${allowance}`)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setSelectedOption(null);
    setAmount("");
    setShowWarning(false);
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

  const handleStakeAction = async () => {
    if (!selectedOption || !amount) return;

    const userStake = stakingData?.find(
      (s) => s.stakingOptionId === selectedOption.stakingOptionId
    );

    const isLocked =
      userStake &&
      Date.now() / 1000 - Number(userStake.startTime) <
        Number(selectedOption.duration);

    if (tab === 1 && isLocked) {
      if (!showWarning) {
        setShowWarning(true);
        return;
      }
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

  return (
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
          </Tabs>
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Available Balance: {Number(balance).toLocaleString()} {symbol}
            </Typography>
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
              Select Staking Option
            </Typography>
            {stakingOptions?.map((option) => (
              <Card
                key={option.stakingOptionId}
                sx={{
                  mb: 1,
                  cursor: "pointer",
                  border:
                    selectedOption?.stakingOptionId === option.stakingOptionId
                      ? `2px solid ${theme.palette.primary.main}`
                      : "1px solid rgba(0, 0, 0, 0.12)",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                  },
                }}
                onClick={() => setSelectedOption(option)}
              >
                <CardContent>
                  <Typography variant='body1'>
                    Duration: {Number(option.duration) / 86400} days
                  </Typography>
                  <Typography variant='body1'>
                    APY: {Number(option.apy) / 100}%
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {showWarning && (
            <Alert
              severity='warning'
              action={
                <Button
                  color='warning'
                  size='small'
                  onClick={() => setShowWarning(false)}
                >
                  I understand
                </Button>
              }
            >
              <AlertTitle>Warning</AlertTitle>
              Your tokens are still locked. Proceeding will initiate frozen
              unstaking with penalties.
            </Alert>
          )}

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
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
