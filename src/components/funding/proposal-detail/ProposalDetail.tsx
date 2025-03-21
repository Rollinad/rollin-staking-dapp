import React, { useState } from "react";
import { Box, Button, Alert, Tabs, Tab, Paper, Skeleton } from "@mui/material";
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
import { useAccount } from "wagmi";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
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

// Create a ProposalHeaderSkeleton component
const ProposalHeaderSkeleton = () => (
  <Box sx={{ mb: 4 }}>
    <Skeleton variant='text' width='60%' height={40} sx={{ mb: 1 }} />
    <Skeleton variant='text' width='40%' height={24} sx={{ mb: 2 }} />
    <Skeleton
      variant='rectangular'
      width='100%'
      height={120}
      sx={{ borderRadius: 2, mb: 2 }}
    />
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Skeleton
        variant='rectangular'
        width='48%'
        height={60}
        sx={{ borderRadius: 1 }}
      />
      <Skeleton
        variant='rectangular'
        width='48%'
        height={60}
        sx={{ borderRadius: 1 }}
      />
    </Box>
  </Box>
);

// Create a TabContentSkeleton component
const TabContentSkeleton = () => (
  <Box>
    <Skeleton variant='text' width='70%' height={32} sx={{ mb: 2 }} />
    <Skeleton variant='text' width='90%' height={24} sx={{ mb: 1 }} />
    <Skeleton variant='text' width='80%' height={24} sx={{ mb: 2 }} />
    <Skeleton
      variant='rectangular'
      width='100%'
      height={100}
      sx={{ borderRadius: 2, mb: 3 }}
    />
    <Skeleton
      variant='rectangular'
      width='100%'
      height={80}
      sx={{ borderRadius: 2 }}
    />
  </Box>
);

export const ProposalDetail: React.FC = () => {
  // Router hooks
  const { id } = useParams<{ id: string }>();
  const proposalId = id ? BigInt(id) : undefined;
  const navigate = useNavigate();
  const { address } = useAccount();

  // Local state
  const [tabValue, setTabValue] = useState<number>(0);
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState<boolean>(false);
  const [swapType, setSwapType] = useState<"buy" | "sell">("buy");

  // Load user data
  const { userData, userDataLoading } = useUserManagement();

  // Load proposal data with proper typing
  const {
    data: proposalBasicData,
    isLoading: basicLoading,
    refetch: refetchBasicData,
  } = useProposalQueries().useProposalBasicDetails(proposalId);
  const {
    data: proposalTokenData,
    isLoading: tokenLoading,
    refetch: refetchTokenData,
  } = useProposalQueries().useProposalTokenDetails(proposalId);
  const {
    data: proposalStatusData,
    isLoading: statusLoading,
    refetch: refetchStatusData,
  } = useProposalQueries().useProposalStatus(proposalId);

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

    const approvedContributorsResult = useContributorQueries().useApprovedContributorsPaginated(
      proposalId,
      0n,
      5n
    );
    
    // Then apply type assertion to the whole result
    const approvedContributorsTyped = approvedContributorsResult as unknown as {
      data: [ContributorInfo[], bigint] | null;
      isLoading: boolean;
    };
    
    // And destructure from that
    const { data: approvedContributorsData, isLoading: approvedLoading } = approvedContributorsTyped;

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
    isPending: proposalPending,
    isConfirming: proposalConfirming,
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

  const refetchAll = () => {
    refetchBasicData();
    refetchStatusData();
    refetchTokenData();
  }

  // Check if critical data is loading - this affects if we can determine the structure of tabs
  const isCriticalDataLoading = basicLoading || tokenLoading || statusLoading;

  // Check if user-specific data is loading - this doesn't affect layout structure
  const isDetailDataLoading =
    userDataLoading ||
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
      proposalId === undefined ||
      !contributionAmount ||
      parseFloat(contributionAmount) <= 0
    )
      return;
    contribute(proposalId, contributionAmount);
    setContributionAmount("");
  };

  // Handle contribution request
  const handleRequestToContribute = () => {
    if (proposalId === undefined) return;
    requestToContribute(proposalId);
    setTimeout(() => {
      refetchAll()
    }, 1000);
  };

  // Handle withdrawal
  const handleWithdraw = () => {
    if (proposalId === undefined) return;
    withdrawContribution(proposalId);
    setTimeout(() => {
      refetchAll()
    }, 1000);
  };

  // Handle fund release by creator
  const handleReleaseFunds = () => {
    if (proposalId === undefined) return;
    releaseFunds(proposalId);
    setTimeout(() => {
      refetchAll()
    }, 1000);
  };

  // Handle token swap
  const handleSwap = () => {
    if (proposalId === undefined || !swapAmount || parseFloat(swapAmount) <= 0) {
      console.log("Swap validation failed:", { 
        hasProposalId: !!proposalId, 
        hasSwapAmount: !!swapAmount, 
        isAmountPositive: swapAmount ? parseFloat(swapAmount) > 0 : false 
      });
      return;
    }

    try {
      console.log("Executing swap...");
      if (swapType === "buy") {
        console.log("Buying tokens with ETH:", { proposalId: proposalId.toString(), amount: swapAmount });
        swapETHForTokens(proposalId, swapAmount);
      } else {
        console.log("Selling tokens for ETH:", { proposalId: proposalId.toString(), amount: swapAmount });
        swapTokensForETH(proposalId, swapAmount);
      }
      
      console.log("Swap function executed");
      setSwapAmount("");
      setIsSwapDialogOpen(false);
    } catch (error) {
      console.error("Error executing swap:", error);
    } finally {
      setTimeout(() => {
        refetchAll()
      }, 1000);
    }
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

  // Try to reload data if we have an ID but no data
  React.useEffect(() => {
    if (proposalId && !proposalBasicData && !basicLoading) {
      refetchBasicData();
    }
    if (proposalId && !proposalTokenData && !tokenLoading) {
      refetchTokenData();
    }
    if (proposalId && !proposalStatusData && !statusLoading) {
      refetchStatusData();
    }
  }, [
    proposalId,
    proposalBasicData,
    basicLoading,
    refetchBasicData,
    proposalTokenData,
    tokenLoading,
    refetchTokenData,
    proposalStatusData,
    statusLoading,
    refetchStatusData,
  ]);

  // Check for data errors (after loading is complete)
  const hasDataError =
    !isCriticalDataLoading &&
    (!proposalBasicData || !proposalTokenData || !proposalStatusData);

  // Show error state if data failed to load
  if (hasDataError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/funding")}
          sx={{ mb: 3, color: "white" }}
        >
          Back to Proposals
        </Button>

        <Alert severity='error' sx={{ mb: 2 }}>
          Failed to load proposal data. Please try again later.
        </Alert>

        <Button
          variant='contained'
          onClick={() => {
            refetchBasicData();
            refetchTokenData();
            refetchStatusData();
          }}
        >
          Retry Loading Data
        </Button>
      </Box>
    );
  }

  let isCreatorValue = false;
  if (proposalBasicData) {
    const basicData = proposalBasicData as ProposalBasic;
    isCreatorValue = basicData.creator.toLowerCase() === address?.toLowerCase();
  }

  // If critical data is loaded, proceed with rendering the real UI
  if (!isCriticalDataLoading) {
    // Type assertions for clarity
    const basicData = proposalBasicData as ProposalBasic;
    const tokenData = proposalTokenData as ProposalToken;
    const statusData = proposalStatusData as ProposalStatus;
    const contributionData = contributionInfoData as ContributionInfo | null;
    const contributorCounts = contributorCountsData as ContributorCounts | null;
    const approvedContributors = approvedContributorsData as
      | [ContributorInfo[], bigint]
      | null;
    const tokenBalance = tokenBalanceData as bigint | null;
    const tokenPrice = tokenPriceData as bigint | null;

    // Calculate progress percentage
    const percentComplete =
      basicData.targetAmount > 0n
        ? Number((basicData.currentAmount * 100n) / basicData.targetAmount)
        : 0;

    // Use the calculated isCreator value
    const isCreator = isCreatorValue;

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

        {/* Proposal Header - Show skeleton if detail data is loading */}
        {isDetailDataLoading ? (
          <ProposalHeaderSkeleton />
        ) : (
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
        )}

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
            aria-label='proposal tabs'
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
            <Tab label='Overview' {...a11yProps(0)} />
            <Tab label='Contribute' {...a11yProps(1)} />
            <Tab label='Contributors' {...a11yProps(2)} />
            {canTrade && <Tab label='Trade' {...a11yProps(3)} />}
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            {isDetailDataLoading ? (
              <TabContentSkeleton />
            ) : (
              <OverviewTab
                proposalBasic={basicData}
                proposalToken={tokenData}
                isFundingEnded={isFundingEnded}
                hasMetTarget={hasMetTarget}
                tokenPrice={tokenPrice}
                tokenBalance={tokenBalance}
              />
            )}
          </TabPanel>

          {/* Contribute Tab */}
          <TabPanel value={tabValue} index={1}>
            {isDetailDataLoading ? (
              <TabContentSkeleton />
            ) : (
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
            )}
          </TabPanel>

          {/* Contributors Tab */}
          <TabPanel value={tabValue} index={2}>
            {isDetailDataLoading ? (
              <TabContentSkeleton />
            ) : (
              <ContributorsTab
                contributorCounts={contributorCounts}
                approvedContributors={approvedContributors}
                isCreator={isCreator}
                canReleaseFunds={canReleaseFunds}
                proposalId={proposalId}
                handleReleaseFunds={handleReleaseFunds}
                contributionPending={contributionPending}
                contributionConfirming={contributionConfirming}
              />
            )}
          </TabPanel>

          {/* Trade Tab */}
          {canTrade && (
            <TabPanel value={tabValue} index={3}>
              {isDetailDataLoading ? (
                <TabContentSkeleton />
              ) : (
                <TradeTab
                  proposalToken={tokenData}
                  tokenPrice={tokenPrice}
                  tokenBalance={tokenBalance}
                  openSwapDialog={openSwapDialog}
                  tradingPending={tradingPending}
                  tradingConfirming={tradingConfirming}
                  tradingError={tradingError}
                  balanceLoading={balanceLoading}
                />
              )}
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
  }

  // If critical data is still loading, show tabs with skeleton content for better UX
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

      {/* Skeleton Header */}
      <ProposalHeaderSkeleton />

      {/* Skeleton Tabs */}
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
          aria-label='proposal tabs'
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
          <Tab label='Overview' {...a11yProps(0)} />
          <Tab label='Contribute' {...a11yProps(1)} />
          <Tab label='Contributors' {...a11yProps(2)} />
        </Tabs>

        {/* Skeleton Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <TabContentSkeleton />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TabContentSkeleton />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <TabContentSkeleton />
        </TabPanel>
      </Paper>
    </Box>
  );
};
