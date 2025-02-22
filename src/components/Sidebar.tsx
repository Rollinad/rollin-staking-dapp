// Sidebar.tsx
import { useState } from 'react';
import { Box, List, ListItemIcon, ListItemText, Collapse, ListItemButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useLocation, useNavigate } from 'react-router-dom';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 240,
  background: 'linear-gradient(180deg, rgba(156, 39, 176, 0.3) 0%, rgba(103, 58, 183, 0.3) 100%)',
  backdropFilter: 'blur(20px)',
  color: '#ffffff',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 1200,
  paddingTop: theme.spacing(8),
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const StyledListItemButton = styled(ListItemButton)(() => ({
  margin: '4px 8px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  '&.Mui-selected': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
}));

const StyledSubListItemButton = styled(ListItemButton)(() => ({
  margin: '2px 8px 2px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&.Mui-selected': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
}));

const StyledListItemIcon = styled(ListItemIcon)({
  color: '#ffffff',
  minWidth: '40px',
});

const StyledListItemText = styled(ListItemText)({
  '& .MuiListItemText-primary': {
    fontSize: '0.95rem',
    fontWeight: 500,
  },
});

export const Sidebar = () => {
  const [stakeOpen, setStakeOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleStakeClick = () => {
    setStakeOpen(!stakeOpen);
  };

  const isCurrentRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <SidebarContainer>
      <List sx={{ px: 1 }}>
        <StyledListItemButton 
          onClick={handleStakeClick}
          selected={location.pathname.startsWith('/stake')}
        >
          <StyledListItemIcon>
            <AccountBalanceWalletIcon />
          </StyledListItemIcon>
          <StyledListItemText primary="Stake" />
          {stakeOpen ? <ExpandLess /> : <ExpandMore />}
        </StyledListItemButton>
        <Collapse in={stakeOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <StyledSubListItemButton
              selected={isCurrentRoute('/stake')}
              onClick={() => navigate('/stake')}
            >
              <StyledListItemText primary="Pools List" />
            </StyledSubListItemButton>
            <StyledSubListItemButton
              selected={isCurrentRoute('/stake/create-pool')}
              onClick={() => navigate('/stake/create-pool')}
            >
              <StyledListItemText primary="Create Pool" />
            </StyledSubListItemButton>
            <StyledSubListItemButton
              selected={isCurrentRoute('/stake/create-option')}
              onClick={() => navigate('/stake/create-option')}
            >
              <StyledListItemText primary="Create Staking Option" />
            </StyledSubListItemButton>
          </List>
        </Collapse>
        <StyledListItemButton disabled>
          <StyledListItemIcon>
            <SwapHorizIcon />
          </StyledListItemIcon>
          <StyledListItemText 
            primary="Swap" 
            secondary="Coming Soon"
            sx={{
              '& .MuiListItemText-secondary': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
              },
            }}
          />
        </StyledListItemButton>
      </List>
    </SidebarContainer>
  );
};