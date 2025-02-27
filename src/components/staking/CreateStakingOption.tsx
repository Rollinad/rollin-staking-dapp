import { useState } from 'react'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormHelperText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { useStakingContract } from '../../hooks/useStakingContract'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { isAddress } from 'viem'

interface ErrorMessage {
  message: string;
}

export const CreateStakingOption = () => {
  const [tokenAddress, setTokenAddress] = useState('')
  const [duration, setDuration] = useState('')
  const [durationUnit, setDurationUnit] = useState('days')
  const [apy, setApy] = useState('')
  
  const { registeredContracts, createStakingOption, isPending, error } = useStakingContract()
  const { showSnackbar } = useSnackbar()

  const resetForm = () => {
    setTokenAddress('')
    setDuration('')
    setDurationUnit('days')
    setApy('')
  }

  const calculateDurationInSeconds = (value: string, unit: string): bigint => {
    const durationNumber = Number(value)
    switch (unit) {
      case 'days':
        return BigInt(durationNumber * 24 * 60 * 60)
      case 'months':
        return BigInt(durationNumber * 30 * 24 * 60 * 60)
      case 'years':
        return BigInt(durationNumber * 365 * 24 * 60 * 60)
      default:
        return BigInt(durationNumber * 24 * 60 * 60)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAddress(tokenAddress)) {
      showSnackbar('Invalid token address', 'error')
      return
    }

    if (!duration || Number(duration) <= 0) {
      showSnackbar('Invalid duration', 'error')
      return
    }

    if (!apy || Number(apy) <= 0 || Number(apy) > 500) {
      showSnackbar('APY must be between 0 and 500%', 'error')
      return
    }

    try {
      const durationInSeconds = calculateDurationInSeconds(duration, durationUnit)
      const apyInBasisPoints = BigInt(Number(apy) * 100) // Convert percentage to basis points

      await createStakingOption(
        tokenAddress as `0x${string}`,
        durationInSeconds,
        apyInBasisPoints
      )
      
      showSnackbar('Transaction submitted successfully', 'info')
      resetForm()
    } catch (err) {
      const error = err as ErrorMessage;
      showSnackbar(error?.message || 'Failed to create staking option', 'error')
    }
  }

  const commonInputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#9C27B0',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#9C27B0',
      },
    },
    '& .MuiInputBase-input': {
      color: '#ffffff',
    },
    '& .MuiFormHelperText-root': {
      color: 'rgba(255, 255, 255, 0.5)',
    },
  };

  const selectStyles = {
    ...commonInputStyles,
    '& .MuiSelect-icon': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  };

  return (
    <Card sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <CardContent>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            color: '#ffffff',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            mb: 3,
          }}
        >
          Create Staking Option
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" sx={selectStyles}>
            <InputLabel>Select Token</InputLabel>
            <Select
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              disabled={isPending}
              required
              sx={{
                '& .MuiSelect-select': {
                  color: '#ffffff',
                },
              }}
            >
              {(registeredContracts as string[])?.map(pool => (
                <MenuItem 
                  key={pool} 
                  value={pool}
                  sx={{
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.3)',
                      },
                    },
                  }}
                >
                  {pool}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              sx={{ ...commonInputStyles, flex: 2 }}
              label="Duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isPending}
              inputProps={{ min: "1" }}
              required
            />
            <FormControl sx={{ ...selectStyles, flex: 1 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                disabled={isPending}
                label="Unit"
              >
                {['days', 'months', 'years'].map(unit => (
                  <MenuItem 
                    key={unit} 
                    value={unit}
                    sx={{
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(156, 39, 176, 0.3)',
                        },
                      },
                    }}
                  >
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="APY (%)"
            type="number"
            value={apy}
            onChange={(e) => setApy(e.target.value)}
            disabled={isPending}
            margin="normal"
            required
            inputProps={{ 
              min: "0",
              max: "500",
              step: "0.01"
            }}
            helperText="APY must be between 0% and 500%"
            sx={commonInputStyles}
          />

          <Button
            variant="contained"
            type="submit"
            disabled={isPending || !tokenAddress || !duration || !apy}
            sx={{ 
              mt: 3,
              backgroundColor: 'rgba(156, 39, 176, 0.8)',
              backdropFilter: 'blur(5px)',
              '&:hover': {
                backgroundColor: 'rgba(156, 39, 176, 0.9)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            fullWidth
          >
            {isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Staking Option'
            )}
          </Button>

          {error && (
            <FormHelperText 
              error 
              sx={{ 
                mt: 1,
                color: '#ff6b6b',
                fontSize: '0.875rem',
              }}
            >
              {error.message}
            </FormHelperText>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}