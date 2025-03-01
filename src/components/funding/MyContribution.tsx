// src/components/funding/MyContributions.tsx
import React, { useState, useEffect } from 'react';
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
import { formatEther } from 'viem';
import { stringToColor } from '../../utils/stringToColor';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useContributionManagement, useProposalQueries, useUserManagement } from '../../hooks/useFundingContract';
import { ProposalView } from '../../types/funding';

// Define an interface for contribution data
interface ContributionData {
  proposalId: number;
  proposal: any; // You can replace this with your actual ProposalView interface
  contribution: {
    limit: bigint;
    currentContribution: bigint;
    tokenAllocation: bigint;
    isApproved: boolean;
    hasRequested: boolean;
  };
}

// Type for contribution info from the hook
type ContributionInfoTuple = [bigint, bigint, bigint, boolean, boolean];

export const MyContributions = () => {
  const navigate = useNavigate();
  const { userData, userDataLoading } = useUserManagement();
  
  // State to track the current proposal we're checking
  const [currentProposalIndex, setCurrentProposalIndex] = useState<number | null>(null);
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get all proposals first
  const { data: allProposals, isLoading: proposalsLoading } = useProposalQueries().useFilteredProposals(false, false);
  
  // Now use the contribution hook for the current proposal we're checking
  const { useContributionInfo } = useContributionManagement();
  const { data: contributionInfo, isLoading: contributionLoading } = useContributionInfo(
    currentProposalIndex !== null ? BigInt(currentProposalIndex) : undefined
  );
  
  // Process proposals one by one
  useEffect(() => {
    if (!userData?.isRegistered || !allProposals || proposalsLoading) {
      return;
    }
    
    // If we haven't started checking yet, start with the first proposal
    if (currentProposalIndex === null && (allProposals as ProposalView[]).length > 0) {
      setLoading(true);
      setCurrentProposalIndex(0);
      return;
    }
    
    // If we're done checking all proposals, finish
    if (currentProposalIndex !== null && currentProposalIndex >= (allProposals as ProposalView[]).length) {
      setLoading(false);
      setCurrentProposalIndex(null);
      return;
    }
  }, [currentProposalIndex, allProposals, proposalsLoading, userData]);
  
  // Process the current contribution when data is loaded
  useEffect(() => {
    if (currentProposalIndex === null || contributionLoading || !contributionInfo || !allProposals) {
      return;
    }
    
    // Safely cast the contribution info to the expected tuple type
    const infoTuple = contributionInfo as unknown as ContributionInfoTuple;
    
    // Format the contribution data
    const formattedInfo = {
      limit: infoTuple[0],
      currentContribution: infoTuple[1],
      tokenAllocation: infoTuple[2],
      isApproved: infoTuple[3],
      hasRequested: infoTuple[4]
    };
    
    // Add to contributions if there's an actual contribution
    if (formattedInfo.currentContribution > 0n) {
      setContributions(prev => [...prev, {
        proposalId: currentProposalIndex,
        proposal: (allProposals as ProposalView[])[currentProposalIndex],
        contribution: formattedInfo
      }]);
    }
    
    // Move to the next proposal
    setCurrentProposalIndex(prev => prev !== null ? prev + 1 : null);
  }, [contributionInfo, contributionLoading, currentProposalIndex, allProposals]);
  
  if (userDataLoading || proposalsLoading || loading) {
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
                      {formatEther(contribution.currentContribution)} ETH
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
                  ).toFixed(4)} ETH
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