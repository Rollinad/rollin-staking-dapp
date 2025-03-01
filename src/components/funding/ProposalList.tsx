import React, { useState } from 'react';
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
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  FormControlLabel,
  Switch,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { useProposalQueries, useUserManagement } from '../../hooks/useFundingContract';
import { stringToColor } from '../../utils/stringToColor';
import { ProposalView } from '../../types/funding';

export const ProposalList = () => {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [page, setPage] = useState(1);
  const [showApprovedOnly, setShowApprovedOnly] = useState(true);
  const itemsPerPage = 6;
  const navigate = useNavigate();
  
  const { userData } = useUserManagement();
  
  // Get proposals with filters
  const { data: filteredProposals, isLoading: isFilteredLoading } = useProposalQueries().useFilteredProposals(
    filter === 'active' || filter === 'all', // onlyActive
    showApprovedOnly // onlyApproved
  );

  // Calculate the total number of pages
  const totalPages = filteredProposals ? Math.ceil((filteredProposals as ProposalView[]).length / itemsPerPage) : 1;
  
  // Get the current page's proposals
  const currentProposals = filteredProposals 
    ? (filteredProposals as ProposalView[]).slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : [];

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: string,
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  return (
    <Box>
      {/* Always show this Paper regardless of loading state */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'white' }}>
            Funding Proposals
          </Typography>
          
          <Stack direction="row" spacing={2}>
            {userData?.isRegistered && (
              <>
                {userData?.isCreator ? (
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/funding/create')}
                    sx={{ borderRadius: 2 }}
                  >
                    Create Proposal
                  </Button>
                ) : (
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
                )}
              </>
            )}
            
            {!userData?.isRegistered && (
              <Button 
                variant="contained" 
                onClick={() => navigate('/funding/register')}
                sx={{ borderRadius: 2 }}
              >
                Register to Participate
              </Button>
            )}
          </Stack>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            aria-label="filter proposals"
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                  bgcolor: 'rgba(103, 58, 183, 0.5)',
                }
              }
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="completed">Completed</ToggleButton>
          </ToggleButtonGroup>
          
          <FormControlLabel
            control={
              <Switch
                checked={showApprovedOnly}
                onChange={(e) => setShowApprovedOnly(e.target.checked)}
                color="primary"
              />
            }
            label="Approved Only"
            sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
          />
        </Box>
      </Paper>

      {/* Show loading state or content depending on isFilteredLoading */}
      {isFilteredLoading ? (
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
      ) : currentProposals.length === 0 ? (
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
            No proposals found
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {filter === 'all' 
              ? 'There are no proposals available at the moment.' 
              : `There are no ${filter} proposals available.`}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {currentProposals.map((proposal, index) => {
              const percentComplete = proposal.targetAmount > 0n 
                ? Number((proposal.currentAmount * 100n) / proposal.targetAmount)
                : 0;
              
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
                          label={proposal.isClosed ? 'Closed' : (proposal.isApproved ? 'Active' : 'Pending')} 
                          color={proposal.isClosed ? 'default' : (proposal.isApproved ? 'success' : 'warning')}
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
                        Target: {formatEther(proposal.targetAmount)} ETH
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                        Raised: {formatEther(proposal.currentAmount)} ETH
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
                        onClick={() => navigate(`/funding/detail/${index}`)}
                        sx={{ borderRadius: 2 }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'white',
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(103, 58, 183, 0.5) !important',
                }
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};