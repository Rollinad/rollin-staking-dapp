import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  LinearProgress,
  Divider,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { useProposalQueries, useProposalManagement } from '../../hooks/useFundingContract';
import { stringToColor } from '../../utils/stringToColor';
import { ProposalView } from '../../types/funding';
import { useSnackbar } from '../../contexts/SnackbarContext';

export const AdminProposalReview = () => {
  const { address: walletAddress, chain } = useAccount();
  const { showSnackbar } = useSnackbar();
  const [isApproving, setIsApproving] = useState<{ [key: number]: boolean }>({});
  
  // Get total proposal count
  const { data: totalProposalsData } = useProposalQueries().useTotalProposals();
  const totalProposalsCount = totalProposalsData ? totalProposalsData as bigint : 100n;
  
  // Get all proposals regardless of status
  const { data: allProposalsData, isLoading, refetch } = useProposalQueries().useProposalsPaginated(
    0n, // Start from the first proposal
    totalProposalsCount // Get all proposals up to the total count
  );
  
  // Safely extract proposals array with type checking
  const extractProposals = (): ProposalView[] => {
    if (!allProposalsData) return [];
    
    // Contract returns tuple [ProposalView[], bigint]
    const proposalsData = allProposalsData as any;
    if (Array.isArray(proposalsData) && proposalsData.length > 0 && Array.isArray(proposalsData[0])) {
      return proposalsData[0] as ProposalView[];
    }
    return [];
  };
  
  // Get proposals and add ID
  const allProposals = extractProposals().map((proposal, index) => ({
    ...proposal,
    proposalId: index // The index in the array corresponds to the proposalId
  }));
  
  // Filter to get only non-approved proposals
  const unapprovedProposals = allProposals.filter(proposal => !proposal.isApproved);

  const { approveProposal } = useProposalManagement();

  const handleApproveProposal = async (proposalId: number) => {
    if (!walletAddress) {
      showSnackbar('Please connect your wallet first', 'error');
      return;
    }

    try {
      setIsApproving(prev => ({ ...prev, [proposalId]: true }));
      
      await approveProposal(BigInt(proposalId));

      showSnackbar('Proposal approved successfully', 'success');
      // Refresh the proposal list
      await refetch();
    } catch (error) {
      console.error('Error approving proposal:', error);
      showSnackbar('Failed to approve proposal', 'error');
    } finally {
      setIsApproving(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Paper 
        elevation={3}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading proposals...
        </Typography>
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
        <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 3 }}>
          Admin Proposal Review
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          As a contract owner, you can review and approve new project proposals here.
        </Alert>
      </Paper>

      {unapprovedProposals.length === 0 ? (
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
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            No pending proposals
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            There are no proposals waiting for approval at the moment.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {unapprovedProposals.map((proposal, index) => {
            const percentComplete = proposal.targetAmount > 0n 
              ? Number((proposal.currentAmount * 100n) / proposal.targetAmount)
              : 0;
            
            // Get the proposalId from the proposal object
            const proposalId = proposal.proposalId as number;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label="Pending Approval" 
                        color="warning"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Chip 
                        label={`${proposal.tokenSymbol}`} 
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                      {proposal.tokenName}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
                        ID: {proposalId}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          mr: 1, 
                          bgcolor: stringToColor(proposal.creator) 
                        }}
                      >
                        {proposal.creator.substring(2, 4).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.6)">
                        {proposal.creatorXAccountId || proposal.creator.substring(0, 6) + '...' + proposal.creator.substring(38)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                      Target: {formatEther(proposal.targetAmount)} {chain?.nativeCurrency.symbol}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                      Token Supply: {Number(formatEther(proposal.tokenSupply)).toLocaleString()} {proposal.tokenSymbol}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                      Token Price: {Number(proposal.tokenPrice) / 10**18} {chain?.nativeCurrency.symbol}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(percentComplete, 100)} 
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                      <Typography variant="body2" align="right" sx={{ mt: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}>
                        {percentComplete.toFixed(1)}%
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      color="success"
                      onClick={() => handleApproveProposal(proposalId)}
                      disabled={isApproving[proposalId]}
                      sx={{ borderRadius: 2 }}
                    >
                      {isApproving[proposalId] ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                          Approving...
                        </>
                      ) : (
                        'Approve Proposal'
                      )}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};