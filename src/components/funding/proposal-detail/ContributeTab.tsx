import React from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from "@mui/material";
import { formatEther } from "viem";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PendingIcon from "@mui/icons-material/Pending";
import TwitterIcon from "@mui/icons-material/Twitter";
import { usePrivy } from "@privy-io/react-auth";
import {
  ProposalBasic,
  ProposalToken,
  ContributionInfo,
  UserData,
} from "../../../types/funding";

interface ContributeTabProps {
  proposalBasic: ProposalBasic;
  proposalToken: ProposalToken;
  contributionInfo: ContributionInfo | null;
  userData: UserData | null;
  isFundingEnded: boolean;
  canWithdraw: boolean;
  contributionAmount: string;
  handleContributionAmountChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleContribute: () => void;
  handleRequestToContribute: () => void;
  handleWithdraw: () => void;
  contributionPending: boolean;
  contributionConfirming: boolean;
  contributionError: Error | null;
  canContribute?: boolean;
}

export const ContributeTab: React.FC<ContributeTabProps> = ({
  proposalBasic,
  proposalToken,
  contributionInfo,
  userData,
  isFundingEnded,
  canWithdraw,
  contributionAmount,
  handleContributionAmountChange,
  handleContribute,
  handleRequestToContribute,
  handleWithdraw,
  contributionPending,
  contributionConfirming,
  contributionError,
  canContribute: canContributeProp,
}) => {
  // Check if Twitter is linked
  const { user } = usePrivy();
  const hasTwitterLinked = user?.linkedAccounts?.some(account => account.type === 'twitter');
  
  // Derived state
  const isLoading = contributionPending || contributionConfirming;
  const hasContributed =
    contributionInfo && contributionInfo.currentContribution > 0n;
  const canContribute =
    canContributeProp !== undefined
      ? canContributeProp
      : proposalBasic.isApproved &&
        !proposalBasic.isClosed &&
        contributionInfo &&
        contributionInfo.isApproved &&
        !isFundingEnded &&
        hasTwitterLinked; // Add Twitter check
  const isRequestPending =
    userData?.isRegistered &&
    !contributionInfo?.isApproved &&
    contributionInfo?.hasRequested;
  const needsToRequest =
    userData?.isRegistered &&
    hasTwitterLinked && // Add Twitter check
    !contributionInfo?.isApproved &&
    !contributionInfo?.hasRequested;
  const needsTwitter = !hasTwitterLinked;

  // Constants
  const PRICE_PRECISION = 1e18;

  // Calculate estimated tokens to receive
  const estimatedTokens =
    contributionAmount &&
    parseFloat(contributionAmount) > 0 &&
    proposalToken.contributionPrice > 0n
      ? (parseFloat(contributionAmount) * Number(PRICE_PRECISION)) /
        Number(proposalToken.contributionPrice)
      : 0;

  // Contribution limit check
  const remainingAllowance = contributionInfo
    ? contributionInfo.limit - contributionInfo.currentContribution
    : 0n;
  const isExceedingLimit =
    contributionInfo &&
    contributionInfo.limit !== 0n &&
    contributionAmount &&
    BigInt(Math.floor(parseFloat(contributionAmount || "0") * 1e18)) >
      remainingAllowance;

  // Render functions for code organization
  const renderStatusAlerts = () => (
    <>
      {isFundingEnded && (
        <Alert severity='warning' sx={{ mb: 3 }}>
          The funding period for this proposal has ended.
        </Alert>
      )}

      {proposalBasic.isClosed && (
        <Alert severity='info' sx={{ mb: 3 }}>
          This proposal is closed and no longer accepting contributions.
        </Alert>
      )}

      {!userData?.isRegistered && (
        <Alert severity='info' sx={{ mb: 3 }}>
          You need to register to contribute to this proposal.
        </Alert>
      )}
      
      {needsTwitter && (
        <Alert 
          severity='info' 
          sx={{ mb: 3 }}
          icon={<TwitterIcon sx={{ color: '#1DA1F2' }} />}
          action={
            <Button 
              color="info" 
              size="small"
              onClick={() => document.dispatchEvent(new Event('openAccountModal'))}
            >
              Connect
            </Button>
          }
        >
          You need to connect your Twitter account to contribute to this proposal.
        </Alert>
      )}

      {contributionError && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {contributionError.message || "An error occurred. Please try again."}
        </Alert>
      )}
    </>
  );

  const renderRequestToContributeSection = () => (
    <>
      <Typography variant='body1' sx={{ mb: 2 }}>
        To contribute to this proposal, you need to request permission from the
        creator.
      </Typography>
      <Button
        variant='contained'
        color='primary'
        fullWidth
        onClick={handleRequestToContribute}
        disabled={isLoading || proposalBasic.isClosed || isFundingEnded}
        sx={{ mt: 2 }}
      >
        {isLoading ? <CircularProgress size={24} /> : "Request to Contribute"}
      </Button>
    </>
  );

  const renderPendingRequestSection = () => (
    <Stack spacing={2} alignItems='center' sx={{ py: 3 }}>
      <PendingIcon sx={{ fontSize: 48, color: "rgba(255, 255, 255, 0.6)" }} />
      <Typography variant='h6' sx={{ textAlign: "center" }}>
        Request Pending
      </Typography>
      <Typography
        variant='body2'
        sx={{
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
          maxWidth: "80%",
        }}
      >
        Your request to contribute is pending approval from the project creator.
        You'll be notified once it's approved.
      </Typography>
    </Stack>
  );

  const renderContributeSection = () => (
    <>
      <Typography variant='body1' sx={{ mb: 3 }}>
        You are approved to contribute up to{" "}
        {formatEther(contributionInfo?.limit || 0n)} ETH to this proposal.
      </Typography>

      <TextField
        label='Contribution Amount'
        fullWidth
        value={contributionAmount}
        onChange={handleContributionAmountChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end' sx={{ color: "white" }}>
              ETH
            </InputAdornment>
          ),
        }}
        variant='outlined'
        sx={{
          mb: 2,
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

      {estimatedTokens > 0 && (
        <Typography
          variant='body2'
          sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
        >
          You will receive approximately {estimatedTokens.toFixed(6)}{" "}
          {proposalToken.tokenSymbol} tokens.
        </Typography>
      )}

      <Button
        variant='contained'
        color='primary'
        fullWidth
        onClick={handleContribute}
        disabled={
          !!isLoading ||
          !contributionAmount ||
          (!!contributionAmount && parseFloat(contributionAmount) <= 0) ||
          !!isExceedingLimit
        }
        sx={{ mt: 2 }}
      >
        {isLoading ? <CircularProgress size={24} /> : "Contribute Now"}
      </Button>

      {isExceedingLimit && (
        <Alert severity='error' sx={{ mt: 2 }}>
          Your contribution exceeds your approved limit. You can contribute up
          to {formatEther(remainingAllowance)} more ETH.
        </Alert>
      )}
    </>
  );

  const renderWithdrawSection = () => (
    <>
      <Typography variant='body1' sx={{ mb: 2 }}>
        This proposal did not reach its funding target. You can withdraw your
        contribution.
      </Typography>

      <Button
        variant='contained'
        color='error'
        fullWidth
        onClick={handleWithdraw}
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? <CircularProgress size={24} /> : "Withdraw Contribution"}
      </Button>
    </>
  );

  const renderContributionDetailsPanel = () => (
    <Paper
      sx={{
        p: 3,
        bgcolor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 2,
        color: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <List sx={{ color: "white", flexGrow: 1 }}>
        <ListItem>
          <ListItemText
            primary='Target amount'
            secondary={`${formatEther(proposalBasic.targetAmount)} ETH`}
            secondaryTypographyProps={{ color: "rgba(255, 255, 255, 0.7)" }}
          />
        </ListItem>
        <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />

        <ListItem>
          <ListItemText
            primary='Current amount raised'
            secondary={`${formatEther(proposalBasic.currentAmount)} ETH (${
              proposalBasic.targetAmount > 0n
                ? Math.min(
                    Number(
                      (proposalBasic.currentAmount * 100n) /
                        proposalBasic.targetAmount
                    ),
                    100
                  )
                : 0
            }%)`}
            secondaryTypographyProps={{ color: "rgba(255, 255, 255, 0.7)" }}
          />
        </ListItem>
        <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />

        <ListItem>
          <ListItemText
            primary='Your contribution'
            secondary={
              hasContributed
                ? `${formatEther(
                    contributionInfo?.currentContribution || 0n
                  )} ETH`
                : "You haven't contributed yet"
            }
            secondaryTypographyProps={{ color: "rgba(255, 255, 255, 0.7)" }}
          />
        </ListItem>
        <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />

        {contributionInfo?.isApproved && (
          <>
            <ListItem>
              <ListItemText
                primary='Your contribution limit'
                secondary={`${formatEther(contributionInfo.limit)} ETH`}
                secondaryTypographyProps={{
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              />
            </ListItem>
            <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />
          </>
        )}

        {hasContributed && (
          <>
            <ListItem>
              <ListItemText
                primary='Your token allocation'
                secondary={`${formatEther(
                  contributionInfo?.tokenAllocation || 0n
                )} ${proposalToken.tokenSymbol}`}
                secondaryTypographyProps={{
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              />
            </ListItem>
            <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />
          </>
        )}

        <ListItem>
          <ListItemText
            primary='Token exchange rate'
            secondary={`1 ETH = ${(
              Number(PRICE_PRECISION) / Number(proposalToken.contributionPrice)
            ).toFixed(6)} ${proposalToken.tokenSymbol}`}
            secondaryTypographyProps={{ color: "rgba(255, 255, 255, 0.7)" }}
          />
        </ListItem>
      </List>

      {hasContributed && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 3,
            p: 2,
            bgcolor: "rgba(0, 0, 0, 0.2)",
            borderRadius: 1,
          }}
        >
          <AccountBalanceWalletIcon sx={{ mr: 2, color: "primary.main" }} />
          <Box>
            <Typography
              variant='body2'
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Your contribution
            </Typography>
            <Typography variant='h6'>
              {formatEther(contributionInfo?.currentContribution || 0n)} ETH
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
          Contribute to {proposalToken.tokenName}
        </Typography>

        {renderStatusAlerts()}

        <Paper
          sx={{
            p: 3,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            color: "white",
          }}
        >
          {needsTwitter && (
            <Stack spacing={2} alignItems='center' sx={{ py: 3 }}>
              <TwitterIcon sx={{ fontSize: 48, color: '#1DA1F2' }} />
              <Typography variant='h6' sx={{ textAlign: "center" }}>
                Twitter Connection Required
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  maxWidth: "80%",
                }}
              >
                To participate in DAO funding, please connect your Twitter account for verification purposes.
              </Typography>
              <Button
                variant="contained"
                startIcon={<TwitterIcon />}
                onClick={() => document.dispatchEvent(new Event('openAccountModal'))}
                sx={{ 
                  bgcolor: '#1DA1F2', 
                  '&:hover': { bgcolor: '#0c8bd9' },
                  mt: 2
                }}
              >
                Connect Twitter
              </Button>
            </Stack>
          )}
          {!needsTwitter && needsToRequest && renderRequestToContributeSection()}
          {!needsTwitter && isRequestPending && renderPendingRequestSection()}
          {!needsTwitter && canContribute && renderContributeSection()}
          {!needsTwitter && canWithdraw && renderWithdrawSection()}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
          Contribution Details
        </Typography>
        {renderContributionDetailsPanel()}
      </Grid>
    </Grid>
  );
};
