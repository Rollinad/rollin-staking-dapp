import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
} from "@mui/material";
import { useReadContract } from "wagmi";
import { useERC20 } from "../hooks/useERC20";
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from "../constants";
import { formatUnits } from "viem";
import { useStakingToken } from "../hooks/useStakingToken";
import { StakingDialog } from "./StakingDialog";

interface PoolItemProps {
  index: number;
  address: `0x${string}`;
}

const PoolItem = ({ index, address }: PoolItemProps) => {
  const [isStakingOpen, setIsStakingOpen] = useState(false);
  const { name, symbol, decimals } = useERC20(address);
  const { tvl } = useStakingToken(address);

  const formattedTVL = tvl
    ? formatUnits(BigInt(tvl), Number(decimals) || 18)
    : "0";

  return (
    <>
      <TableRow sx={{
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      }}>
        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{index + 1}</TableCell>
        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{name || "Unknown Token"}</TableCell>
        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{symbol || "???"}</TableCell>
        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {Number(formattedTVL).toLocaleString()} {symbol}
        </TableCell>
        <TableCell>
          <Button
            variant='contained'
            size='small'
            onClick={() => setIsStakingOpen(true)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(5px)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            Stake/Unstake
          </Button>
        </TableCell>
      </TableRow>

      <StakingDialog
        open={isStakingOpen}
        onClose={() => setIsStakingOpen(false)}
        address={address}
      />
    </>
  );
};

export const PoolsList = () => {
  const { data: pools, isLoading } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getRegisteredContracts",
  }) as { data: `0x${string}`[] | undefined; isLoading: boolean };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  if (isLoading) {
    return (
      <Card sx={cardStyle}>
        <CardContent>
          <Typography sx={{ color: '#fff' }}>Loading pools...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!pools?.length) {
    return (
      <Card sx={cardStyle}>
        <CardContent>
          <Typography sx={{ color: '#fff' }}>No pools found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Typography 
          variant='h5' 
          gutterBottom 
          sx={{ 
            color: '#fff',
            fontWeight: 'bold',
            mb: 3,
          }}
        >
          Staking Pools
        </Typography>
        <TableContainer 
          component={Paper} 
          sx={{
            backgroundColor: 'transparent',
            '& .MuiPaper-root': {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                }}>#</TableCell>
                <TableCell sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                }}>Token Name</TableCell>
                <TableCell sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                }}>Token Symbol</TableCell>
                <TableCell sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                }}>TVL</TableCell>
                <TableCell sx={{ 
                  color: '#fff', 
                  fontWeight: 'bold',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pools.map((poolAddress, index) => (
                <PoolItem
                  key={poolAddress}
                  address={poolAddress}
                  index={index}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};