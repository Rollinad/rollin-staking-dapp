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
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{name || "Unknown Token"}</TableCell>
        <TableCell>{symbol || "???"}</TableCell>
        <TableCell>
          {Number(formattedTVL).toLocaleString()} {symbol}
        </TableCell>
        <TableCell>
          <Button
            variant='contained'
            size='small'
            onClick={() => setIsStakingOpen(true)}
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

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading pools...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!pools?.length) {
    return (
      <Card>
        <CardContent>
          <Typography>No pools found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' gutterBottom>
          Staking Pools
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Token Name</TableCell>
                <TableCell>Token Symbol</TableCell>
                <TableCell>TVL</TableCell>
                <TableCell>Action</TableCell>
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
