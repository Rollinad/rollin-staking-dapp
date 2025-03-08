import { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useUserManagement } from '../hooks/useFundingContract';
import XIcon from '@mui/icons-material/X';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';

export const BecomeCreator = () => {
  const navigate = useNavigate();
  const { user } = usePrivy();
  const { userData, userDataLoading, updateToCreator, isPending, isConfirming, isConfirmed, writeError, refetchUserData } = useUserManagement();
  
  // Check if user has Twitter linked
  const hasTwitterLinked = user?.linkedAccounts?.some(account => account.type === 'twitter_oauth');
  
  // Get the Twitter ID from Privy if available
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth');
  const twitterUsername = twitterAccount?.username || twitterAccount?.subject || '';

  // Handle successful upgrade
  useEffect(() => {
    if (isConfirmed) {
      refetchUserData();
      const timer = setTimeout(() => {
        navigate('/funding/create');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, navigate, refetchUserData]);

  // Check if user is already a creator or not registered
  useEffect(() => {
    if (userData) {
      if (userData.isCreator) {
        navigate('/funding/create');
      } else if (!userData.isRegistered) {
        navigate('/funding/register');
      }
    }
  }, [userData, navigate]);

  // Handle opening the Twitter connection modal
  const handleConnectTwitter = () => {
    document.dispatchEvent(new Event('openAccountModal'));
  };

  // Handle become creator submission
  const handleSubmit = () => {
    if (!twitterUsername) return;
    updateToCreator(twitterUsername);
  };

  // Loading state
  if (userDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

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
        Become a Creator
      </Typography>
      
      <Typography variant="body1" align="center" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
        Upgrade your account to create funding proposals and launch your projects with community backing.
      </Typography>

      <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {/* Error display */}
      {writeError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {writeError.message || 'An error occurred during the upgrade process.'}
        </Alert>
      )}

      {/* Success message */}
      {isConfirmed && (
        <Alert severity="success" sx={{ mb: 3 }}>
          You have successfully become a creator! Redirecting to the create proposal page...
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(156, 39, 176, 0.2)', mb: 3 }}>
          <StarIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
        </Avatar>
        
        <Typography variant="h5" gutterBottom>
          Creator Privileges
        </Typography>
        
        <Box sx={{ 
          maxWidth: 600, 
          width: '100%', 
          bgcolor: 'rgba(255, 255, 255, 0.05)', 
          p: 3, 
          borderRadius: 2,
          mb: 4 
        }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            As a creator, you'll be able to:
          </Typography>
          <ul style={{ paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Create funding proposals for your projects</li>
            <li>Receive funding from community contributors</li>
            <li>Launch your project tokens with automatic liquidity pools</li>
            <li>Manage contributor applications to your proposals</li>
            <li>Build a reputation in the DAO ecosystem</li>
          </ul>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Twitter Verification Required
        </Typography>
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column' }}>
          {hasTwitterLinked ? (
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
              <Typography>
                X account <strong>@{twitterUsername}</strong> connected!
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, textAlign: 'center' }}>
                To become a creator, you need to link your X account for verification purposes.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<XIcon />}
                onClick={handleConnectTwitter}
                sx={{ 
                  bgcolor: '#1DA1F2', 
                  '&:hover': { bgcolor: '#0c8bd9' },
                  py: 1.5,
                  px: 3
                }}
              >
                Connect X Account
              </Button>
            </>
          )}
        </Box>
        
        <Button
          variant="contained"
          size="large"
          color="primary"
          disabled={!hasTwitterLinked || isPending || isConfirming}
          onClick={handleSubmit}
          sx={{ 
            py: 1.5, 
            px: 4, 
            minWidth: 200,
            fontSize: '1.1rem'
          }}
        >
          {isPending || isConfirming ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Upgrade to Creator'
          )}
        </Button>
        
        <Button
          variant="text"
          color="inherit"
          onClick={() => navigate('/funding')}
          sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Return to Proposals
        </Button>
      </Box>
    </Paper>
  );
};

export default BecomeCreator;