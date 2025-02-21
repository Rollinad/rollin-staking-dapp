import { useState } from 'react'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import { useStakingContract } from '../hooks/useStakingContract'
import { useSnackbar } from '../contexts/SnackbarContext'
import { isAddress } from 'viem'

export const CreatePool = () => {
  const [tokenAddress, setTokenAddress] = useState('')
  const { createPool, isPending, error } = useStakingContract()
  const { showSnackbar } = useSnackbar()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(tokenAddress)) {
      showSnackbar('Invalid token address', 'error')
      return
    }

    try {
      await createPool(tokenAddress)
      showSnackbar('Pool created successfully!', 'success')
      setTokenAddress('')
    } catch {
      showSnackbar(error?.message || 'Failed to create pool', 'error')
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Create Staking Pool
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Token Address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            disabled={isPending}
            margin="normal"
            required
            error={!!error}
            helperText={error?.message}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={isPending || !tokenAddress}
            sx={{ mt: 2 }}
          >
            {isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Pool'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}