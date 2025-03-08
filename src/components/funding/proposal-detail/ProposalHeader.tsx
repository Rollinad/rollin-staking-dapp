import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Grid,
  Avatar,
} from "@mui/material";
import { formatEther } from "viem";
import {
  ProposalBasic,
  ProposalToken,
  ProposalStatus,
  ContributionInfo,
  UserData,
} from "../../../types/funding";
import { usePrivy } from "@privy-io/react-auth";
import XIcon from "@mui/icons-material/X";
import { useAccount } from "wagmi";

interface ProposalHeaderProps {
  proposalBasic: ProposalBasic;
  proposalToken: ProposalToken;
  proposalStatus: ProposalStatus;
  contributionInfo: ContributionInfo | null;
  userData: UserData | null;
  isCreator: boolean;
  isFundingEnded: boolean;
  hasMetTarget: boolean;
  canReleaseFunds: boolean;
  canWithdraw: boolean;
  canTrade: boolean;
  percentComplete: number;
  handleApproveProposal: () => void;
  handleRequestToContribute: () => void;
  handleReleaseFunds: () => void;
  handleWithdraw: () => void;
  openSwapDialog: (type: "buy" | "sell") => void;
  formatTimeRemaining: (time: bigint) => string;
  formatCreationDate: (timestamp: bigint) => string;
  contributionPending: boolean;
  contributionConfirming: boolean;
  proposalPending: boolean;
  proposalConfirming: boolean;
  tradingPending: boolean;
  tradingConfirming: boolean;
  tokenBalance: bigint | null;
  setTabValue: (value: number) => void;
}

export const ProposalHeader: React.FC<ProposalHeaderProps> = ({
  proposalBasic,
  proposalToken,
  proposalStatus,
  contributionInfo,
  userData,
  isFundingEnded,
  hasMetTarget,
  canReleaseFunds,
  canWithdraw,
  canTrade,
  percentComplete,
  handleApproveProposal,
  handleRequestToContribute,
  handleReleaseFunds,
  handleWithdraw,
  openSwapDialog,
  formatTimeRemaining,
  formatCreationDate,
  contributionPending,
  contributionConfirming,
  proposalPending,
  proposalConfirming,
  tradingPending,
  tradingConfirming,
  tokenBalance,
  setTabValue,
}) => {
  const { user } = usePrivy();
  const { chain } = useAccount();

  const twitterAccount = user?.linkedAccounts?.find(
    (account) => account.type === "twitter_oauth"
  );
  const twitterUsername = twitterAccount?.username || "";
  const twitterAvatarUrl = twitterAccount?.profilePictureUrl || "";

  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 2,
        p: 3,
        mb: 3,
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Chip
              label={
                !proposalBasic.isApproved
                  ? "Pending Approval"
                  : proposalBasic.isClosed
                  ? "Closed"
                  : "Active"
              }
              color={
                !proposalBasic.isApproved
                  ? "warning"
                  : proposalBasic.isClosed
                  ? "default"
                  : "success"
              }
              size='small'
            />

            <Chip
              label={`${proposalToken.tokenSymbol}`}
              color='primary'
              size='small'
            />

            {hasMetTarget && (
              <Chip label='Target Reached' color='success' size='small' />
            )}
            {isFundingEnded && !hasMetTarget && (
              <Chip label='Funding Failed' color='error' size='small' />
            )}
          </Box>

          <Typography
            variant='h4'
            component='h1'
            sx={{ color: "white", mb: 2 }}
          >
            {proposalToken.tokenName}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Stack direction='column' spacing={0.4}>
              <Typography
                variant='body2'
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Created by
              </Typography>
              <Stack direction='row' spacing={1}>
                {twitterAvatarUrl ? (
                  <Avatar
                    src={twitterAvatarUrl}
                    alt={twitterUsername}
                    sx={{
                      width: 30,
                      height: 30,
                      border: "2px solid #1DA1F2",
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 30, height: 30, bgcolor: "#ffffff" }}>
                    <XIcon sx={{ fontSize: '18px' }} />
                  </Avatar>
                )}
                <Typography variant='body1' sx={{ color: "white" }}>
                  {proposalToken.creatorXAccountId ?  `@${proposalToken.creatorXAccountId}` :
                    proposalBasic.creator.substring(0, 8) +
                      "..." +
                      proposalBasic.creator.substring(36)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Typography
            variant='body2'
            sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 2 }}
          >
            Created {formatCreationDate(proposalBasic.createdAt)}
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant='h5'
              align='center'
              sx={{ color: "white", mb: 1 }}
            >
              {formatEther(proposalBasic.currentAmount)} {chain?.nativeCurrency.symbol}
            </Typography>

            <Typography
              variant='body1'
              align='center'
              sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
            >
              of {formatEther(proposalBasic.targetAmount)} {chain?.nativeCurrency.symbol} target
            </Typography>

            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant='determinate'
                value={Math.min(percentComplete, 100)}
                sx={{ height: 8, borderRadius: 5 }}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 0.5,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  {percentComplete.toFixed(1)}%
                </Typography>
                {proposalStatus.timeRemaining > 0n && (
                  <Typography
                    variant='body2'
                    sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    {formatTimeRemaining(proposalStatus.timeRemaining)}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Action buttons */}
            {!proposalBasic.isApproved && userData?.isRegistered && (
              <Button
                variant='contained'
                color='warning'
                onClick={handleApproveProposal}
                disabled={
                  proposalPending || proposalConfirming || !userData?.isCreator
                }
                fullWidth
                sx={{ mt: 2 }}
              >
                {proposalPending || proposalConfirming ? (
                  <CircularProgress size={24} />
                ) : (
                  "Approve Proposal"
                )}
              </Button>
            )}

            {proposalBasic.isApproved &&
              !proposalBasic.isClosed &&
              userData?.isRegistered &&
              (contributionInfo?.isApproved ? (
                <Button
                  variant='contained'
                  color='primary'
                  disabled={
                    contributionPending ||
                    contributionConfirming ||
                    isFundingEnded
                  }
                  onClick={() => setTabValue(1)} // Switch to contribute tab
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Contribute Now
                </Button>
              ) : contributionInfo?.hasRequested ? (
                <Button
                  variant='outlined'
                  disabled
                  fullWidth
                  sx={{
                    mt: 2,
                    color: "white",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  Request Pending
                </Button>
              ) : (
                <Button
                  variant='outlined'
                  onClick={handleRequestToContribute}
                  disabled={contributionPending || contributionConfirming}
                  fullWidth
                  sx={{
                    mt: 2,
                    color: "white",
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {contributionPending || contributionConfirming ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Request to Contribute"
                  )}
                </Button>
              ))}

            {canReleaseFunds && (
              <Button
                variant='contained'
                color='success'
                onClick={handleReleaseFunds}
                disabled={contributionPending || contributionConfirming}
                fullWidth
                sx={{ mt: 2 }}
              >
                {contributionPending || contributionConfirming ? (
                  <CircularProgress size={24} />
                ) : (
                  "Release Funds"
                )}
              </Button>
            )}

            {canWithdraw && (
              <Button
                variant='outlined'
                color='error'
                onClick={handleWithdraw}
                disabled={contributionPending || contributionConfirming}
                fullWidth
                sx={{ mt: 2 }}
              >
                {contributionPending || contributionConfirming ? (
                  <CircularProgress size={24} />
                ) : (
                  "Withdraw Contribution"
                )}
              </Button>
            )}

            {canTrade && (
              <Stack spacing={1} direction='row' sx={{ mt: 2 }}>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => openSwapDialog("buy")}
                  disabled={tradingPending || tradingConfirming}
                  fullWidth
                >
                  Buy Tokens
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => openSwapDialog("sell")}
                  disabled={
                    tradingPending ||
                    tradingConfirming ||
                    !tokenBalance ||
                    tokenBalance === 0n
                  }
                  fullWidth
                  sx={{
                    color: "white",
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Sell Tokens
                </Button>
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
