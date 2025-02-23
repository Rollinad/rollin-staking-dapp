import { Routes, Route, Navigate } from 'react-router-dom'
import { PoolsList } from '../components/staking/PoolsList'
import { CreatePool } from '../components/staking/CreatePool'
import { CreateStakingOption } from '../components/staking/CreateStakingOption'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PoolsList />} />
      <Route path="/create-pool" element={<CreatePool />} />
      <Route path="/create-option" element={<CreateStakingOption />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}