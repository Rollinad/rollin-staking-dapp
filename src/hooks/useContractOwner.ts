import { useReadContract } from 'wagmi';
import { DAO_FUNDING_CONTRACT_ADDRESS } from '../constants';
import { useAccount } from 'wagmi';

// This is a standard ERC ownable ABI for the owner() function
const OWNABLE_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  }
];

export function useContractOwner() {
  const { address } = useAccount();
  
  const { data: ownerAddress, isLoading } = useReadContract({
    address: DAO_FUNDING_CONTRACT_ADDRESS,
    abi: OWNABLE_ABI,
    functionName: 'owner',
  });
  
  // Check if current connected wallet is the contract owner
  const isOwner = address && ownerAddress ? address.toLowerCase() === (ownerAddress as string).toLowerCase() : false;
  
  return {
    ownerAddress,
    isOwner,
    isLoading
  };
}