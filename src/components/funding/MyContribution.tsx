import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  CircularProgress,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatEther, Address } from 'viem';
import { stringToColor } from '../../utils/stringToColor';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { 
  useUserManagement, 
  useProposalQueries,
} from '../../hooks/useFundingContract';
import { useAccount, usePublicClient } from 'wagmi';
import { DAO_VIEW_CONTRACT_ADDRESS } from '../../constants';
import { DAOViewABI } from '../../constants/funding/abi';

// Define an interface for proposal view
interface ProposalView {
  creator: Address;
  tokenName: string;
  tokenSymbol: string;
  creatorXAccountId: string;
  targetAmount: bigint;
  currentAmount: bigint;
  hasMetTarget: boolean;
  isActive: boolean;
  isApproved: boolean;
  isClosed: boolean;
  tokensDeployed: boolean;
}

// Define an interface for contribution data
interface ContributionData {
  proposalId: number;
  proposal: ProposalView;
  contribution: {
    limit: bigint;
    currentContribution: bigint;
    tokenAllocation: bigint;
    isApproved: boolean;
    hasRequested: boolean;
  };
}

// Create a special hook to check if a proposal is relevant to the user
const useRelevantProposals = (proposalIds: bigint[] | undefined) => {
  return useCallback((proposalId: number) => {
    // If the user is the creator of this proposal, it's relevant
    if (proposalIds && proposalIds.some(id => Number(id) === proposalId)) {
      return true;
    }
    
    // For simplicity, let's also check the first 10 proposals for all users
    if (proposalId < 10) {
      return true;
    }
    
    return false;
  }, [proposalIds]);
};

export const MyContributions = () => {
  const navigate = useNavigate();
  const { address, chain } = useAccount();
  const { userData, userDataLoading } = useUserManagement();
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();
  const [fetched, setFetched] = useState(false);
  
  // Use a much smaller limit to reduce request load
  const { useProposalsPaginated } = useProposalQueries();
  const { data: allProposalsResult, isLoading: allProposalsLoading } = useProposalsPaginated(0n, 10n);
  
  // Define a type for the tuple return from the contract
  type ProposalResultTuple = [ProposalView[], bigint];
  
  // Create our relevance checking hook
  const isProposalRelevant = useRelevantProposals(
    userData?.proposalIds
  );
  
  // Create a memoized function for checking contributions
  const checkContribution = useCallback(async (proposalId: number | undefined) => {
    if (!address || !publicClient) return null;
    
    try {
      const result = await publicClient.readContract({
        address: DAO_VIEW_CONTRACT_ADDRESS as Address,
        abi: DAOViewABI,
        functionName: "getContributionInfo",
        args: [BigInt(proposalId ?? 0), address]
      }) as [bigint, bigint, bigint, boolean, boolean];
      
      // Destructure the contribution info
      const [limit, currentContribution, tokenAllocation, isApproved, hasRequested] = result;

      console.log(`result ${result}`)
      
      // Only return if there's an actual contribution
      if (currentContribution <= 0n) return null;
      
      return {
        limit,
        currentContribution,
        tokenAllocation,
        isApproved,
        hasRequested
      };
    } catch (error) {
      console.error(`Error checking contribution for proposal ${proposalId}:`, error);
      return null;
    }
  }, [address, publicClient]);
  
  // Main effect to load user contributions
  useEffect(() => {
    // Exit early if data is still loading or user isn't registered
    if (userDataLoading || allProposalsLoading) {
      return;
    }
    
    // If user not registered or no proposals, stop loading
    if (!userData || !userData.isRegistered || !allProposalsResult) {
      setLoading(false);
      return;
    }
    
    // Only proceed if we have proposals data in the expected format
    if (!allProposalsResult || !Array.isArray(allProposalsResult) || allProposalsResult.length < 1) {
      setLoading(false);
      return;
    }
    
    // Format proposals data from the tuple
    const allProposals = (allProposalsResult as ProposalResultTuple)[0];
    
    const getUserContributions = async () => {
      try {
        if (fetched) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const userContributions: ContributionData[] = [];
        
        // Track which proposals we've checked to avoid duplicates
        const checkedProposals = new Set();
        
        // Process proposals with delays to avoid rate limiting
        for (let i = 0; i < allProposals.length; i++) {
          // Check if we've already processed this proposal
          if (checkedProposals.has(i)) continue;
          
          // Check if this proposal is relevant to the user
          if (!isProposalRelevant(i)) continue;
          
          // Mark as checked
          checkedProposals.add(i);
          
          // Add a delay between requests
          if (i > 0 && i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Get the current proposal
          const proposal = allProposals[i];
          
          // Check for user contribution
          const contributionInfo = await checkContribution(i);
          
          // Add to list if a contribution exists
          if (contributionInfo) {
            userContributions.push({
              proposalId: i,
              proposal,
              contribution: contributionInfo
            });
          }
          if (i === allProposals.length - 1) {
            setFetched(true)
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 2000)
          })
        }
        
        setContributions(userContributions);
      } catch (error) {
        console.error("Error fetching user contributions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getUserContributions();
  }, [userData, userDataLoading, allProposalsResult, allProposalsLoading, address, isProposalRelevant, checkContribution, fetched]);
  
  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 8 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ color: 'white', mt: 2 }}>
          Loading your contributions...
        </Typography>
      </Box>
    );
  }
  
  // Check if user is registered
  if (!userData?.isRegistered) {
    return (
      <Paper 
        elevation={3}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          You need to register to view your contributions
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          To view your contributions, you must first register as a user in the DAO.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/funding/register')}
          sx={{ borderRadius: 2 }}
        >
          Register Now
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper 
        elevation={3}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 3,
          mb: 4
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
            My Contributions
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/funding')}
            sx={{ borderRadius: 2 }}
          >
            Explore Proposals
          </Button>
        </Box>
        
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          Track all your contributions across different funding proposals.
        </Typography>
      </Paper>

      {contributions.length === 0 ? (
        <Paper 
          elevation={3}
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 6,
            textAlign: 'center'
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
            No contributions yet
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            You haven't contributed to any funding proposals yet.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/funding')}
            sx={{ borderRadius: 2 }}
          >
            Explore Proposals
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { color: 'white', fontWeight: 'bold', borderColor: 'rgba(255, 255, 255, 0.1)' } }}>
                <TableCell>Proposal</TableCell>
                <TableCell>Token</TableCell>
                <TableCell align="right">Contribution</TableCell>
                <TableCell align="right">Token Allocation</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((item) => {
                const { proposalId, proposal, contribution } = item;
                // Determine if the user can withdraw funds (if funding failed)
                const canWithdraw = !proposal.isClosed && !proposal.isActive && !proposal.hasMetTarget;
                // Determine if the user can trade tokens (if funding succeeded and tokens deployed)
                const canTrade = proposal.isClosed && proposal.tokensDeployed;
                
                return (
                  <TableRow
                    key={proposalId}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '& .MuiTableCell-body': { color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1, 
                            bgcolor: stringToColor(proposal.creator) 
                          }}
                        >
                          {proposal.creator.substring(2, 4).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {proposal.tokenName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            by {proposal.creatorXAccountId || proposal.creator.substring(0, 6) + '...'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={proposal.tokenSymbol} 
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatEther(contribution.currentContribution)} {chain?.nativeCurrency.symbol}
                    </TableCell>
                    <TableCell align="right">
                      {formatEther(contribution.tokenAllocation)} {proposal.tokenSymbol}
                    </TableCell>
                    <TableCell align="center">
                      {proposal.isClosed ? (
                        <Chip 
                          label={proposal.hasMetTarget ? "Succeeded" : "Failed"} 
                          color={proposal.hasMetTarget ? "success" : "error"}
                          size="small"
                        />
                      ) : proposal.isApproved ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Pending" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/funding/detail/${proposalId}`)}
                            sx={{ color: 'white' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canWithdraw && (
                          <Tooltip title="Withdraw Contribution">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => navigate(`/funding/detail/${proposalId}`)}
                            >
                              <AccountBalanceWalletIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canTrade && (
                          <Tooltip title="Trade Tokens">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/funding/detail/${proposalId}`)}
                            >
                              <SwapHorizIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Summary Cards */}
      {contributions.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Contributed
                </Typography>
                <Typography variant="h4">
                  {contributions.reduce((total, item) => 
                    total + parseFloat(formatEther(item.contribution.currentContribution)), 0
                  ).toFixed(4)} {chain?.nativeCurrency.symbol}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Projects Backed
                </Typography>
                <Typography variant="h4">
                  {contributions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Successful Projects
                </Typography>
                <Typography variant="h4">
                  {contributions.filter(item => 
                    item.proposal.isClosed && item.proposal.hasMetTarget
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              color: 'white'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Contributions
                </Typography>
                <Typography variant="h4">
                  {contributions.filter(item => 
                    !item.proposal.isClosed && item.proposal.isApproved
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};