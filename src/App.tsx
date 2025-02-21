import { Box, Container, Typography } from '@mui/material'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PoolsList } from './components/PoolsList'
import { CreatePool } from './components/CreatePool'
import { CreateStakingOption } from './components/CreateStakingOption'
import { Navigation } from './components/Navigation'

export const App = () => {
  const { isConnected } = useAccount()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <ConnectButton />
      </Box>
      {isConnected ? (
        <>
          <Navigation />
          <Box sx={{ mt: 3 }}>
            <Routes>
              <Route path="/" element={<PoolsList />} />
              <Route path="/create-pool" element={<CreatePool />} />
              <Route path="/create-option" element={<CreateStakingOption />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </>
      ) : (
        <Typography variant="h6" textAlign="center">
          Please connect your wallet to continue
        </Typography>
      )}
    </Container>
  )
}

export default App