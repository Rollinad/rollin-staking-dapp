import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Components
import { ProposalHeader } from "./ProposalHeader";
import { OverviewTab } from "./OverviewTab";
import { ContributeTab } from "./ContributeTab";
import { ContributorsTab } from "./ContributorsTab";
import { TradeTab } from "./TradeTab";
import { SwapDialog } from "./SwapDialog";

// Hooks
import {
  useContributionManagement,
  useContributorQueries,
  useProposalManagement,
  useProposalQueries,
  useTokenBalances,
  useUserManagement,
  useTokenTrading,
} from "../../../hooks/useFundingContract";

// Types
import {
  ContributionInfo,
  ProposalBasic,
  ProposalStatus,
  ProposalToken,
  ContributorCounts,
  ContributorInfo,
} from "../../../types/funding";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`proposal-tabpanel-${index}`}
      aria-labelledby={`proposal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, px: 0 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `proposal-tab-${index}`,
    "aria-controls": `proposal-tabpanel-${index}`,
  };
};

export const ProposalDetail: React.FC = () => {
  // Router hooks
  const { id } = useParams<{ id: string }>();
  const proposalId = id ? BigInt(id) : undefined;
  const navigate = useNavigate();

  // Local state
  const [tabValue, setTabValue] = useState<number>(0);
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState<boolean>(false);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");

  // Load user data
  const { userData, userDataLoading } = useUserManagement();

  // Load proposal data with proper typing
  const { data: proposalBasicData, isLoading: basicLoading } =
    useProposalQueries().useProposalBasicDetails(proposalId);
  const { data: proposalTokenData, isLoading: tokenLoading } =
    useProposalQueries().useProposalTokenDetails(proposalId);
  const { data: proposalStatusData, isLoading: statusLoading } =
    useProposalQueries().useProposalStatus(proposalId);

  // Load contribution data
  const { data: contributionInfoData, isLoading: contributionLoading } =
    useContributionManagement().useContributionInfo(proposalId);

  // Load token data
  const { data: tokenBalanceData, isLoading: balanceLoading } =
    useTokenBalances().useTokenBalance(proposalId);
  const { data: tokenPriceData, isLoading: priceLoading } =
    useTokenBalances().useCurrentTokenPrice(proposalId);

  // Load contributors with proper type assertions
  const { data: contributorCountsData, isLoading: countsLoading } =
    useContributorQueries().useContributorsCounts(proposalId) as {
      data: ContributorCounts | null;
      isLoading: boolean;
    };
  
  const { data: approvedContributorsData, isLoading: approvedLoading } =
    useContributorQueries().useApprovedContributorsPaginated(
      proposalId,
      0n,
      5n
    ) as {
      data: [ContributorInfo[], bigint] | null;
      isLoading: boolean;
    };

  // Hooks for actions
  const {
    requestToContribute,
    contribute,
    withdrawContribution,
    releaseFunds,
    isPending: contributionPending,
    isConfirming: contributionConfirming,
    writeError: contributionError,
  } = useContributionManagement();

  const {
    approveProposal,
    isPending: proposalPending,
    isConfirming: proposalConfirming,
    // writeError: proposalError,
  } = useProposalManagement();

  const {
    swapETHForTokens,
    swapTokensForETH,
    isPending: tradingPending,
    isConfirming: tradingConfirming,
    writeError: tradingError,
  } = useTokenTrading();

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate loading state
  const isLoading =
    userDataLoading ||
    basicLoading ||
    tokenLoading ||
    statusLoading ||
    contributionLoading ||
    balanceLoading ||
    priceLoading ||
    countsLoading ||
    approvedLoading;

  // Handle contribution amount changes
  const handleContributionAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      setContributionAmount(value);
    }
  };

  // Handle swap amount changes
  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      setSwapAmount(value);
    }
  };

  // Handle contribution submission
  const handleContribute = () => {
    if (
      !proposalId ||
      !contributionAmount ||
      parseFloat(contributionAmount) <= 0
    )
      return;
    contribute(proposalId, contributionAmount);
    setContributionAmount("");
  };

  // Handle contribution request
  const handleRequestToContribute = () => {
    if (!proposalId) return;
    requestToContribute(proposalId);
  };

  // Handle withdrawal
  const handleWithdraw = () => {
    if (!proposalId) return;
    withdrawContribution(proposalId);
  };

  // Handle fund release by creator
  const handleReleaseFunds = () => {
    if (!proposalId) return;
    releaseFunds(proposalId);
  };

  // Handle proposal approval by admin
  const handleApproveProposal = () => {
    if (!proposalId) return;
    approveProposal(proposalId);
  };

  // Handle token swap
  const handleSwap = () => {
    if (!proposalId || !swapAmount || parseFloat(swapAmount) <= 0) return;

    if (swapType === "buy") {
      swapETHForTokens(proposalId, swapAmount);
    } else {
      swapTokensForETH(proposalId, swapAmount);
    }

    setSwapAmount("");
    setIsSwapDialogOpen(false);
  };

  // Open swap dialog
  const openSwapDialog = (type: "buy" | "sell") => {
    setSwapType(type);
    setSwapAmount("");
    setIsSwapDialogOpen(true);
  };

  // Format time remaining
  const formatTimeRemaining = (timeRemaining: bigint) => {
    const seconds = Number(timeRemaining);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      return "Less than a minute remaining";
    }
  };

  // Format creation date
  const formatCreationDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle errors if data is missing
  if (!proposalBasicData || !proposalTokenData || !proposalStatusData) {
    return (
      <Alert severity="error">
        Failed to load proposal data. Please try again later.
      </Alert>
    );
  }

  // Type assertions for clarity
  const basicData = proposalBasicData as ProposalBasic;
  const tokenData = proposalTokenData as ProposalToken;
  const statusData = proposalStatusData as ProposalStatus;
  const contributionData = contributionInfoData as ContributionInfo | null;
  const contributorCounts = contributorCountsData as ContributorCounts | null;
  const approvedContributors = approvedContributorsData as [ContributorInfo[], bigint] | null;
  const tokenBalance = tokenBalanceData as bigint | null;
  const tokenPrice = tokenPriceData as bigint | null;

  // Calculate progress percentage
  const percentComplete =
    basicData.targetAmount > 0n
      ? Number((basicData.currentAmount * 100n) / basicData.targetAmount)
      : 0;

  // Determine if this is the user's own proposal
  const isCreator =
    basicData.creator.toLowerCase() === userData?.xAccountId?.toLowerCase();

  // Determine if funding period has ended
  const isFundingEnded = statusData.timeRemaining === 0n;

  // Determine if target has been met
  const hasMetTarget = statusData.hasMetTarget;

  // Determine if user can contribute
  const canContribute =
    basicData.isApproved &&
    !basicData.isClosed &&
    contributionData &&
    contributionData.isApproved &&
    !isFundingEnded;

  // Determine if user can withdraw
  const canWithdraw =
    !basicData.isClosed &&
    isFundingEnded &&
    !hasMetTarget &&
    contributionData &&
    contributionData.currentContribution > 0n;

  // Determine if creator can release funds
  const canReleaseFunds =
    isCreator &&
    basicData.isApproved &&
    !basicData.isClosed &&
    isFundingEnded &&
    hasMetTarget;

  // Determine if trading is available
  const canTrade = basicData.isClosed && basicData.tokensDeployed;

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: "white" }}
      >
        Back to Proposals
      </Button>

      {/* Proposal Header */}
      <ProposalHeader
        proposalBasic={basicData}
        proposalToken={tokenData}
        proposalStatus={statusData}
        contributionInfo={contributionData}
        userData={userData}
        isCreator={isCreator}
        isFundingEnded={isFundingEnded}
        hasMetTarget={hasMetTarget}
        canReleaseFunds={canReleaseFunds}
        canWithdraw={canWithdraw ?? false}
        canTrade={canTrade}
        percentComplete={percentComplete}
        handleApproveProposal={handleApproveProposal}
        handleRequestToContribute={handleRequestToContribute}
        handleReleaseFunds={handleReleaseFunds}
        handleWithdraw={handleWithdraw}
        openSwapDialog={openSwapDialog}
        formatTimeRemaining={formatTimeRemaining}
        formatCreationDate={formatCreationDate}
        contributionPending={contributionPending}
        contributionConfirming={contributionConfirming}
        proposalPending={proposalPending}
        proposalConfirming={proposalConfirming}
        tradingPending={tradingPending}
        tradingConfirming={tradingConfirming}
        tokenBalance={tokenBalance}
        setTabValue={setTabValue}
      />

      {/* Tabs and Content */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="proposal tabs"
          sx={{
            borderBottom: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            "& .MuiTab-root": {
              color: "rgba(255, 255, 255, 0.7)",
              "&.Mui-selected": {
                color: "white",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
            },
          }}
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Contribute" {...a11yProps(1)} />
          <Tab label="Contributors" {...a11yProps(2)} />
          {canTrade && <Tab label="Trade" {...a11yProps(3)} />}
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <OverviewTab
            proposalBasic={basicData}
            proposalToken={tokenData}
            isFundingEnded={isFundingEnded}
            hasMetTarget={hasMetTarget}
            tokenPrice={tokenPrice}
            tokenBalance={tokenBalance}
          />
        </TabPanel>

        {/* Contribute Tab */}
        <TabPanel value={tabValue} index={1}>
          <ContributeTab
            proposalBasic={basicData}
            proposalToken={tokenData}
            contributionInfo={contributionData}
            userData={userData}
            isFundingEnded={isFundingEnded}
            canWithdraw={canWithdraw ?? false}
            contributionAmount={contributionAmount}
            handleContributionAmountChange={handleContributionAmountChange}
            handleContribute={handleContribute}
            handleRequestToContribute={handleRequestToContribute}
            handleWithdraw={handleWithdraw}
            contributionPending={contributionPending}
            contributionConfirming={contributionConfirming}
            contributionError={contributionError}
            canContribute={canContribute ?? undefined}
          />
        </TabPanel>

        {/* Contributors Tab */}
        <TabPanel value={tabValue} index={2}>
          <ContributorsTab
            contributorCounts={contributorCounts}
            approvedContributors={approvedContributors}
            isCreator={isCreator}
            canReleaseFunds={canReleaseFunds}
            handleReleaseFunds={handleReleaseFunds}
            contributionPending={contributionPending}
            contributionConfirming={contributionConfirming}
          />
        </TabPanel>

        {/* Trade Tab */}
        {canTrade && (
          <TabPanel value={tabValue} index={3}>
            <TradeTab
              proposalToken={tokenData}
              tokenPrice={tokenPrice}
              tokenBalance={tokenBalance}
              openSwapDialog={openSwapDialog}
              tradingPending={tradingPending}
              tradingConfirming={tradingConfirming}
              tradingError={tradingError}
            />
          </TabPanel>
        )}
      </Paper>

      {/* Swap Dialog */}
      <SwapDialog
        isOpen={isSwapDialogOpen}
        swapType={swapType}
        swapAmount={swapAmount}
        proposalToken={tokenData}
        tokenPrice={tokenPrice}
        handleSwapAmountChange={handleSwapAmountChange}
        handleSwap={handleSwap}
        handleClose={() => setIsSwapDialogOpen(false)}
        tradingPending={tradingPending}
        tradingConfirming={tradingConfirming}
        tradingError={tradingError}
      />
    </Box>
  );
};