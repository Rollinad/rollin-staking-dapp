import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  IconButton,
  Collapse,
  Button,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useReadContract } from 'wagmi'
import { useERC20 } from '../hooks/useERC20'
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from '../constants'
import { formatUnits } from 'viem'
import { StakingOption } from '@/types/staking'
import { useStakingPoolTVL } from '@/hooks/useStakingPoolTVL'
import { StakingDialog } from './StakingDialog'

interface PoolItemProps {
  address: `0x${string}`
  isLast: boolean
}

const PoolItem = ({ address, isLast }: PoolItemProps) => {
  const [open, setOpen] = useState(false)
  const [isStakingOpen, setIsStakingOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null)
  const { name, symbol, decimals } = useERC20(address)
  
  const { tvl } = useStakingPoolTVL(address)

  const { data: stakingOptions } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'getStakingOptions',
    args: [address],
  }) as { data: StakingOption[] | undefined }

  const formattedTVL = tvl ? formatUnits(BigInt(tvl), Number(decimals) || 18) : '0'

  const handleStakingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsStakingOpen(true)
  }

  return (
    <>
      <ListItem
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          py: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <ListItemText
            primary={
              <Typography variant="h6" component="div">
                {name || 'Unknown Token'} ({symbol || '???'})
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                {address}
              </Typography>
            }
          />
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={`TVL: ${Number(formattedTVL).toLocaleString()} ${symbol}`}
              color="primary"
            />
            {stakingOptions && (
              <>
                <Chip
                  label={`${stakingOptions.length} Staking Options`}
                  color="secondary"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleStakingClick}
                >
                  Stake/Unstake
                </Button>
              </>
            )}
          </Box>
        </Box>
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{ mt: { xs: 1, md: 0 } }}
        >
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </ListItem>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Staking Options
          </Typography>
          {stakingOptions?.map((option: StakingOption) => (
            <Card 
              key={option.stakingOptionId} 
              sx={{ 
                mb: 1, 
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                },
              }}
              onClick={() => {
                setSelectedOption(option)
                setIsStakingOpen(true)
              }}
            >
              <CardContent>
                <Typography variant="body1">
                  Duration: {Number(option.duration) / 86400} days
                </Typography>
                <Typography variant="body1">
                  APY: {Number(option.apy) / 100}%
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Collapse>

      <StakingDialog
        open={isStakingOpen}
        onClose={() => {
          setIsStakingOpen(false)
          setSelectedOption(null)
        }}
        address={address}
        stakingOptions={stakingOptions}
        defaultOption={selectedOption}
      />

      {!isLast && <Divider />}
    </>
  )
}

export const PoolsList = () => {
  const { data: pools, isLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'getRegisteredContracts',
  }) as { data: `0x${string}`[] | undefined, isLoading: boolean }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading pools...</Typography>
        </CardContent>
      </Card>
    )
  }

  if (!pools?.length) {
    return (
      <Card>
        <CardContent>
          <Typography>No pools found</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Staking Pools
        </Typography>
        <List>
          {pools.map((poolAddress, index) => (
            <PoolItem
              key={poolAddress}
              address={poolAddress}
              isLast={index === pools.length - 1}
            />
          ))}
        </List>
      </CardContent>
    </Card>
  )
}