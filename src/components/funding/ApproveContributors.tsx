import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Button, 
  Divider, 
  TextField, 
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  Container,
  Badge
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Address, formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { stringToColor } from '../../utils/stringToColor';
import { ContributorInfo, ProposalToken } from '../../types/funding';
import { 
  useContributionManagement, 
  useContributorQueries, 
  useProposalQueries 
} from '../../hooks/useFundingContract';

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
      id={`contributors-tabpanel-${index}`}
      aria-labelledby={`contributors-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const ApproveContributors: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = id ? BigInt(id) : undefined;
  const navigate = useNavigate();
  const { chain } = useAccount();
  
  const [tabValue, setTabValue] = useState(0);
  const [contributionLimit, setContributionLimit] = useState('');
  const [selectedRequestor, setSelectedRequestor] = useState<string | null>(null);

  // Load proposal data
  const { 
    data: tokenData, 
    isLoading: tokenLoading 
  } = useProposalQueries().useProposalTokenDetails(proposalId);
  
  // Get contributors data
  const { useContributorsCounts, useRequestingContributorsPaginated, useApprovedContributorsPaginated } = useContributorQueries();
  
  const { data: contributorCountsData, isLoading: countsLoading } = useContributorsCounts(proposalId);
  
  const { data: requestingContributorsData, isLoading: requestingLoading, refetch: refetchRequesting } = 
    useRequestingContributorsPaginated(proposalId, 0n, 100n);
  
  const { data: approvedContributorsData, isLoading: approvedLoading, refetch: refetchApproved } = 
    useApprovedContributorsPaginated(proposalId, 0n, 100n);
  
  // Access contribution management functions
  const { 
    approveContributor, 
    isPending: approvalPending, 
    isConfirming: approvalConfirming,
    isConfirmed: approvalConfirmed
  } = useContributionManagement();

  // Extract requesting contributors from the data
  const requestingContributors = requestingContributorsData ? 
    (requestingContributorsData as any)[0] as ContributorInfo[] : 
    [];
  
  // Extract approved contributors from data
  const approvedContributors = approvedContributorsData ? 
    approvedContributorsData[0] : 
    [];

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle contribution limit change
  const handleContributionLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      setContributionLimit(value);
    }
  };

  // Handle approving a contributor
  const handleApproveContributor = async (contributorAddress: string) => {
    if (!proposalId || !contributionLimit || parseFloat(contributionLimit) <= 0) {
      return;
    }

    try {
      await approveContributor(proposalId, contributorAddress as Address, contributionLimit);
      setContributionLimit('');
      setSelectedRequestor(null);
    } catch (error) {
      console.error('Error approving contributor:', error);
    }
  };

  // Select a requestor to approve
  const handleSelectRequestor = (address: string) => {
    setSelectedRequestor(address === selectedRequestor ? null : address);
    setContributionLimit('');
  };

  // Refresh data when approval completes
  useEffect(() => {
    if (approvalConfirmed) {
      refetchRequesting();
      refetchApproved();
      refetchRequesting(); // Fetch again to ensure data is up to date
    }
  }, [approvalConfirmed, refetchRequesting, refetchApproved]);

  // Show loading state
  const isLoading = tokenLoading || countsLoading || requestingLoading || approvedLoading;

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white', mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ color: 'white' }}>
            Loading...
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Handle missing data
  if (!tokenData) {
    return (
      <Container>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white', mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ color: 'white' }}>
            Proposal Not Found
          </Typography>
        </Box>
        <Alert severity="error">
          Could not load proposal data. Please try again later.
        </Alert>
      </Container>
    );
  }

  const proposalToken = tokenData as ProposalToken;

  return (
    <Container>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/funding/detail/${id}`)}
          sx={{ color: 'white', mr: 2 }}
        >
          Back to Proposal
        </Button>
        <Typography variant="h5" sx={{ color: 'white' }}>
          Manage Contributors: {proposalToken.tokenName} ({proposalToken.tokenSymbol})
        </Typography>
      </Box>

      {/* Contributor Management */}
      <Paper sx={{ 
        bgcolor: 'rgba(0, 0, 0, 0.4)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: 2,
        mb: 4
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: 'white',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Tab 
            label={
              <Badge 
                badgeContent={contributorCountsData?.requestingCount.toString() || '0'} 
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              >
                <Box sx={{ px: 1 }}>Pending Requests</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={contributorCountsData?.approvedCount.toString() || '0'} 
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
              >
                <Box sx={{ px: 1 }}>Approved Contributors</Box>
              </Badge>
            } 
          />
        </Tabs>

        {/* Pending Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
              These users have requested to contribute to your project. Set contribution limits for each user to approve them.
            </Typography>

            {requestingContributors.length === 0 ? (
              <Paper
                sx={{ 
                  p: 4, 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No pending contribution requests
                </Typography>
              </Paper>
            ) : (
              <List>
                {requestingContributors.map((contributor, index) => (
                  <React.Fragment key={contributor.contributorAddress}>
                    <ListItem 
                      sx={{ 
                        py: 2, 
                        bgcolor: selectedRequestor === contributor.contributorAddress ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                        borderRadius: 1
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ bgcolor: stringToColor(contributor.contributorAddress) }}>
                            {contributor.contributorAddress.substring(2, 4).toUpperCase()}
                          </Avatar>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <ListItemText 
                            primary={
                              <Typography sx={{ color: 'white' }}>
                                {contributor.contributorAddress.substring(0, 6)}...{contributor.contributorAddress.substring(38)}
                              </Typography>
                            } 
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip 
                                  label="Pending Approval" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ height: 24 }}
                                />
                              </Box>
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          {selectedRequestor === contributor.contributorAddress ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TextField
                                label={`Contribution Limit (${chain?.nativeCurrency.symbol})`}
                                value={contributionLimit}
                                onChange={handleContributionLimitChange}
                                variant="outlined"
                                size="small"
                                sx={{
                                  mr: 1,
                                  flexGrow: 1,
                                  input: { color: 'white' },
                                  label: { color: 'rgba(255, 255, 255, 0.7)' },
                                  '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: 'primary.main',
                                    },
                                  },
                                }}
                              />
                              <Button 
                                variant="contained" 
                                color="success"
                                size="small"
                                disabled={!contributionLimit || parseFloat(contributionLimit) <= 0 || approvalPending || approvalConfirming}
                                onClick={() => handleApproveContributor(contributor.contributorAddress)}
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                {approvalPending || approvalConfirming ? (
                                  <CircularProgress size={20} sx={{ color: 'white' }} />
                                ) : 'Approve'}
                              </Button>
                            </Box>
                          ) : (
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleSelectRequestor(contributor.contributorAddress)}
                              sx={{ 
                                color: 'white', 
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              Set Contribution Limit
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < requestingContributors.length - 1 && <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        {/* Approved Contributors Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
              These contributors have been approved to participate in the funding round.
            </Typography>

            {approvedContributors.length === 0 ? (
              <Paper
                sx={{ 
                  p: 4, 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No approved contributors yet
                </Typography>
              </Paper>
            ) : (
              <List>
                {approvedContributors.map((contributor, index) => (
                  <React.Fragment key={contributor.contributorAddress}>
                    <ListItem sx={{ py: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Avatar sx={{ bgcolor: stringToColor(contributor.contributorAddress) }}>
                            {contributor.contributorAddress.substring(2, 4).toUpperCase()}
                          </Avatar>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <ListItemText 
                            primary={
                              <Typography sx={{ color: 'white' }}>
                                {contributor.contributorAddress.substring(0, 6)}...{contributor.contributorAddress.substring(38)}
                              </Typography>
                            } 
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip 
                                  label="Approved" 
                                  size="small" 
                                  color="success" 
                                  sx={{ height: 24 }}
                                />
                              </Box>
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Contribution:
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {formatEther(contributor.currentContribution)} {chain?.nativeCurrency.symbol}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Limit:
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {formatEther(contributor.contributionLimit)} {chain?.nativeCurrency.symbol}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < approvedContributors.length - 1 && <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Help Information */}
      <Paper sx={{ 
        bgcolor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: 2,
        p: 3
      }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Managing Contributors Guide
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                Approving Contributors
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                When a user requests to contribute to your project, they'll appear in the "Pending Requests" tab.
                Set a contribution limit for each user to approve them. This limit represents the maximum amount
                they can contribute to your proposal.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                Contribution Limits
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Setting appropriate contribution limits helps ensure a diverse range of contributors.
                Approved contributors can fund your project up to their assigned limit, but not beyond it.
                You can view all approved contributors and their current contribution amounts in the "Approved Contributors" tab.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};