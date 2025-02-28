import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Stack,
  Divider,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useProposalManagement, useUserManagement } from '../../hooks/useFundingContract';

export const CreateProposal = () => {
  const [formData, setFormData] = useState({
    tokenName: '',
    tokenSymbol: '',
    targetAmount: '',
    tokenSupply: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { userData, userDataLoading } = useUserManagement();
  const { createProposal, isPending, isConfirming, isConfirmed, writeError } = useProposalManagement();

  // Check if user is a creator
  useEffect(() => {
    if (!userDataLoading && userData && !userData.isCreator) {
      navigate('/funding/register');
    }
  }, [userData, userDataLoading, navigate]);

  // Redirect on successful creation
  useEffect(() => {
    if (isConfirmed) {
      // Wait a moment then redirect to my proposals
      const timer = setTimeout(() => {
        navigate('/funding/my-proposals');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tokenName.trim()) {
      newErrors.tokenName = 'Token name is required';
    }
    
    if (!formData.tokenSymbol.trim()) {
      newErrors.tokenSymbol = 'Token symbol is required';
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.tokenSymbol)) {
      newErrors.tokenSymbol = 'Symbol should be 1-10 uppercase letters/numbers';
    }
    
    if (!formData.targetAmount.trim()) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (isNaN(Number(formData.targetAmount)) || Number(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Target amount must be a positive number';
    }
    
    if (!formData.tokenSupply.trim()) {
      newErrors.tokenSupply = 'Token supply is required';
    } else if (isNaN(Number(formData.tokenSupply)) || Number(formData.tokenSupply) <= 0) {
      newErrors.tokenSupply = 'Token supply must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    createProposal(
      formData.targetAmount,
      formData.tokenName,
      formData.tokenSymbol,
      formData.tokenSupply
    );
  };

  if (userDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const textFieldSx = {
    input: { color: 'white' },
    label: { color: 'rgba(255, 255, 255, 0.7)' },
    '& .MuiFormHelperText-root': {
      color: errors ? 'error.main' : 'rgba(255, 255, 255, 0.5)'
    },
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
  };

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
        Create Funding Proposal
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
        Create a funding proposal for your project. Once approved, contributors can fund your proposal
        and receive project tokens in return.
      </Typography>
      
      <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {writeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {writeError.message || 'An error occurred during transaction.'}
        </Alert>
      )}
      
      {isConfirmed && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Proposal created successfully! Redirecting to your proposals...
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Project Token Name"
              name="tokenName"
              placeholder="e.g. My Project Token"
              value={formData.tokenName}
              onChange={handleChange}
              fullWidth
              error={!!errors.tokenName}
              helperText={errors.tokenName}
              disabled={isPending || isConfirming}
              sx={textFieldSx}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Token Symbol"
              name="tokenSymbol"
              placeholder="e.g. MPT"
              value={formData.tokenSymbol}
              onChange={handleChange}
              fullWidth
              error={!!errors.tokenSymbol}
              helperText={errors.tokenSymbol}
              disabled={isPending || isConfirming}
              sx={textFieldSx}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Funding Target Amount"
              name="targetAmount"
              placeholder="e.g. 10"
              value={formData.targetAmount}
              onChange={handleChange}
              fullWidth
              error={!!errors.targetAmount}
              helperText={errors.targetAmount}
              disabled={isPending || isConfirming}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ color: 'white' }}>
                    ETH
                    <Tooltip title="The amount of ETH you want to raise for your project">
                      <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)', p: 0.5, ml: 0.5 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Token Supply"
              name="tokenSupply"
              placeholder="e.g. 1000000"
              value={formData.tokenSupply}
              onChange={handleChange}
              fullWidth
              error={!!errors.tokenSupply}
              helperText={errors.tokenSupply || "Total number of tokens to be created"}
              disabled={isPending || isConfirming}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ color: 'white' }}>
                    Tokens
                    <Tooltip title="Total number of tokens to mint for your project. 80% will be distributed to contributors, 20% will be used for liquidity.">
                      <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)', p: 0.5, ml: 0.5 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormHelperText sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              Once your proposal is created, it will need to be approved by the DAO admin before it can receive funding.
              After approval, your proposal will be visible to potential contributors.
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                size="large"
                disabled={isPending || isConfirming}
                sx={{ py: 1.5, px: 4, minWidth: 200 }}
              >
                {isPending || isConfirming ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Create Proposal'
                )}
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate('/funding')}
                disabled={isPending || isConfirming}
                sx={{ py: 1.5, color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
              >
                Cancel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};