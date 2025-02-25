import React from 'react';
import { Button, Box, Typography, CircularProgress, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

// Style the button with your app's theme
const ConnectButton = styled(Button)(() => ({
  background: 'linear-gradient(45deg, #7b3fe4 30%, #9370DB 90%)',
  border: 0,
  borderRadius: 12,
  boxShadow: '0 3px 5px 2px rgba(123, 63, 228, 0.3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  '&:hover': {
    background: 'linear-gradient(45deg, #6935c2 30%, #8360c9 90%)',
  },
}));

export const CustomConnectButton: React.FC = () => {
  const { login, user, authenticated, ready, logout } = usePrivy();
  const { wallets } = useWallets();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle menu open
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <Button variant="contained" disabled>
        <CircularProgress size={24} color="inherit" />
      </Button>
    );
  }

  // If user is not authenticated, show login button
  if (!authenticated || !user) {
    return (
      <ConnectButton 
        variant="contained" 
        onClick={() => login()}
        startIcon={<AccountBalanceWalletIcon />}
      >
        Connect Wallet
      </ConnectButton>
    );
  }

  // Get the first wallet to display (if any)
  const activeWallet = wallets.length > 0 ? wallets[0] : null;
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <>
      <ConnectButton
        id="wallet-button"
        aria-controls={open ? 'wallet-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<AccountBalanceWalletIcon />}
      >
        {activeWallet ? formatAddress(activeWallet.address) : 'Connected'}
      </ConnectButton>
      
      <Menu
        id="wallet-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'wallet-button',
        }}
        PaperProps={{
          style: {
            backgroundColor: '#2a2a3a',
            color: 'white',
            borderRadius: '12px',
            minWidth: '200px',
          }
        }}
      >
        {user && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Account
            </Typography>
            {user.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                <PersonIcon fontSize="small" />
                <Typography>{user.email.address}</Typography>
              </Box>
            )}
          </Box>
        )}
        
        {wallets.map((wallet) => (
          <MenuItem key={wallet.address} onClick={handleClose}>
            <Typography>{formatAddress(wallet.address)}</Typography>
          </MenuItem>
        ))}
        
        <MenuItem onClick={handleLogout}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LogoutIcon fontSize="small" />
            <Typography>Disconnect</Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CustomConnectButton;