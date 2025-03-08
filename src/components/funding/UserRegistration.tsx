import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Stack,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Avatar,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import XIcon from '@mui/icons-material/X';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useUserManagement } from '../../hooks/useFundingContract';
import { useWalletSync } from '../../contexts/WalletSyncContext';

export const UserRegistration = () => {
  const [becomeCreator, setBecomeCreator] = useState(false);
  const [twitterId, setTwitterId] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const { isTwitterLinkedToAnotherWallet, unlinkTwitter } = useWalletSync();
  
  // Get user's Privy and blockchain data
  const { user, linkTwitter, login, authenticated } = usePrivy();
  const { userData, userDataLoading, registerUser, isPending, isConfirming, isConfirmed, writeError, refetchUserData } = useUserManagement();
  
  // Check if user has Twitter linked
  const hasTwitterLinked = user?.linkedAccounts?.some(account => account.type === 'twitter_oauth');

  const handleLinkTwitter = async () => {
    if (!authenticated) {
      login();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    linkTwitter();
  }
  
  // Get the Twitter ID from Privy if available
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth');
  const twitterUsername = twitterAccount?.username || twitterAccount?.subject || '';

  // Update Twitter ID when account is linked
  useEffect(() => {
    if (twitterUsername) {
      setTwitterId(twitterUsername);
    }
  }, [twitterUsername]);

  // Handle Twitter connection and move to next step
  useEffect(() => {
    if (hasTwitterLinked && activeStep === 0 && !isTwitterLinkedToAnotherWallet) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
      unlinkTwitter();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTwitterLinked, activeStep, isTwitterLinkedToAnotherWallet]);

  // Handle successful registration
  useEffect(() => {
    if (isConfirmed) {
      refetchUserData();
      const timer = setTimeout(() => {
        if (becomeCreator) {
          navigate('/funding/create');
        } else {
          navigate('/funding');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, becomeCreator, navigate, refetchUserData]);

  // Check if user is already registered or a creator
  useEffect(() => {
    if (userData) {
      if (userData.isCreator) {
        navigate('/funding/create');
      } else if (userData.isRegistered && !becomeCreator) {
        navigate('/funding');
      }
    }
  }, [userData, becomeCreator, navigate]);

  // Handle registration submission
  const handleSubmit = () => {
    if (!twitterId || isTwitterLinkedToAnotherWallet) return;
    
    if (userData?.isRegistered && becomeCreator) {
      // If already registered and wants to become creator, redirect to BecomeCreator page
      navigate('/funding/become-creator');
    } else {
      // Just register as a new user
      registerUser(twitterId);
    }
  };

  // Loading state
  if (userDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Steps definition
  const steps = ['Connect X Account', 'Choose Role', 'Complete Registration'];

  return (
    <Paper 
      elevation={3}
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
        maxWidth: 800,
        mx: 'auto',
        color: 'white'
      }}
    >
      <Typography variant="h4" align="center" gutterBottom sx={{ color: 'white' }}>
        Register for DAO Funding
      </Typography>

      <Stepper 
        activeStep={activeStep} 
        alternativeLabel
        sx={{ 
          mb: 4, 
          pt: 3,
          '& .MuiStepLabel-label': {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          '& .MuiStepLabel-active': {
            color: 'white'
          },
          '& .MuiStepIcon-root': {
            color: 'rgba(255, 255, 255, 0.3)'
          },
          '& .MuiStepIcon-active': {
            color: 'primary.main'
          },
          '& .MuiStepIcon-completed': {
            color: '#4caf50'
          }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error display */}
      {writeError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {writeError.message || 'An error occurred during registration.'}
        </Alert>
      )}

      {/* Success message */}
      {isConfirmed && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {becomeCreator 
            ? 'You have successfully registered as a creator! Redirecting...' 
            : 'You have successfully registered! Redirecting...'}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255, 255, 255, 0.1)', color: "#ffffff", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", mx: 'auto', mb: 3 }}>
              <XIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              Connect Your X Account
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
              To participate in our DAO funding platform, you need to link your X account for verification purposes.
            </Typography>
            
            {hasTwitterLinked && !isTwitterLinkedToAnotherWallet ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
                <Typography>
                  X account <strong>@{twitterUsername}</strong> connected!
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<XIcon />}
                onClick={handleLinkTwitter}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  '&:hover': { bgcolor: '#ffffff', color: '#000000' },
                  py: 1.5,
                  px: 3,
                  backdropFilter: "blur(10px)",
                }}
              >
                Connect X Account
              </Button>
            )}
            
            {hasTwitterLinked && !isTwitterLinkedToAnotherWallet && (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setActiveStep(1)}
                sx={{ mt: 3 }}
              >
                Continue
              </Button>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom align="center">
              Choose Your Role
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
              Select how you want to participate in our DAO funding platform.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: !becomeCreator ? '2px solid #9c27b0' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    }
                  }}
                  onClick={() => setBecomeCreator(false)}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(156, 39, 176, 0.2)', mx: 'auto', mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 30, color: '#9c27b0' }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      Contributor
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Participate by funding projects and earning project tokens. Browse available proposals and support the ones you believe in.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: becomeCreator ? '2px solid #9c27b0' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    }
                  }}
                  onClick={() => setBecomeCreator(true)}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(156, 39, 176, 0.2)', mx: 'auto', mb: 2 }}>
                      <XIcon sx={{ fontSize: 30, color: '#9c27b0' }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      Creator
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Create your own funding proposals and have your projects funded by the community. Launch your project with community backing.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setActiveStep(2)}
                sx={{ mt: 1 }}
              >
                Continue as {becomeCreator ? 'Creator' : 'Contributor'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom align="center">
              Confirm Registration
            </Typography>
            
            <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Stack spacing={3} sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <XIcon sx={{ color: '#1DA1F2', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1">X Account</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    @{twitterUsername}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1">Role</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {becomeCreator ? 'Creator (can create proposals)' : 'Contributor (can fund proposals)'}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
                By registering, you agree to the terms and conditions of the DAO funding platform. This registration will be recorded on the blockchain.
              </Typography>
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                disabled={isPending || isConfirming}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isPending || isConfirming}
                sx={{ minWidth: 120 }}
              >
                {isPending || isConfirming ? (
                  <CircularProgress size={24} />
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UserRegistration;