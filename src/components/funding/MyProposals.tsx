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
  CircularProgress,
  LinearProgress,
  Divider,
  Alert,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CampaignIcon from '@mui/icons-material/Campaign';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useProposalQueries, useUserManagement } from '../../hooks/useFundingContract';
import { ProposalView } from '../../types/funding';
import { useAccount } from 'wagmi';

export const MyProposals = () => {
  const navigate = useNavigate();
  const { chain } = useAccount();
  const { userData, userDataLoading } = useUserManagement();
  
  // Get proposals created by the current user
  const { data: myProposals, isLoading: myProposalsLoading } = useProposalQueries().useProposalsByCreator();
  
  if (userDataLoading || myProposalsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is registered and is a creator
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
          You need to register to create proposals
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          To view your proposals, you must first register as a user in the DAO.
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

  if (!userData?.isCreator) {
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
          Become a Creator
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          You're registered, but you need to upgrade to creator status to create funding proposals.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/funding/become-creator')}
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(90deg, #9c27b0 0%, #673ab7 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #7b1fa2 0%, #512da8 100%)'
            }
          }}
        >
          Become a Creator
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
            My Proposals
          </Typography>
          
          <Button 
            variant="contained" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/funding/create')}
            sx={{ borderRadius: 2 }}
          >
            Create New Proposal
          </Button>
        </Box>
        
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          Manage your created funding proposals and track their progress.
        </Typography>
      </Paper>

      {(!myProposals || (myProposals as ProposalView[]).length === 0) ? (
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
          <CampaignIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
            No proposals created yet
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            You haven't created any funding proposals yet. Start by creating your first proposal!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/funding/create')}
            startIcon={<AddCircleOutlineIcon />}
            sx={{ borderRadius: 2 }}
          >
            Create First Proposal
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {(myProposals as ProposalView[]).map((proposal, index) => {
            const percentComplete = proposal.targetAmount > 0n 
              ? Number((proposal.currentAmount * 100n) / proposal.targetAmount)
              : 0;
            
            return (
              <Grid item xs={12} md={6} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={!proposal.isApproved ? 'Pending Approval' : 
                              (proposal.isClosed ? 'Closed' : 'Active')} 
                        color={!proposal.isApproved ? 'warning' : 
                              (proposal.isClosed ? 'default' : 'success')}
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
                    
                    <Divider sx={{ my: 1.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Target:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatEther(proposal.targetAmount)} {chain?.nativeCurrency.symbol}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Raised:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatEther(proposal.currentAmount)} {chain?.nativeCurrency.symbol}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                          Token Supply:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatEther(proposal.tokenSupply)}
                        </Typography>
                      </Box>
                    </Stack>
                    
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
                    
                    {!proposal.isApproved && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        This proposal is awaiting approval from DAO administrators.
                      </Alert>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate(`/funding/detail/${index}`)}
                      sx={{ borderRadius: 2, flexGrow: 1 }}
                    >
                      View Details
                    </Button>
                    
                    {proposal.isApproved && !proposal.isClosed && (
                      <Tooltip title="Release funds if target is reached">
                        <IconButton
                          color="success"
                          sx={{ ml: 1, bgcolor: 'rgba(76, 175, 80, 0.1)' }}
                          onClick={() => navigate(`/funding/detail/${index}`)}
                        >
                          <AttachMoneyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
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