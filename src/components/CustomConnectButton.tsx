import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Tooltip, useMediaQuery } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
  Card,
  CardContent,
  styled,
  alpha,
} from "@mui/material";
import { usePrivy } from "@privy-io/react-auth";
import TwitterIcon from "@mui/icons-material/Twitter";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState, useEffect } from "react";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
  "& .MuiDialogTitle-root": {
    color: "white",
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
  },
}));

const StyledCard = styled(Card)(() => ({
  background: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(5px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "12px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.2)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  },
}));

const StyledInfoCard = styled(StyledCard)(() => ({
  background: `linear-gradient(135deg, ${alpha("#1DA1F2", 0.4)} 0%, ${alpha(
    "#0c8bd9",
    0.4
  )} 100%)`,
  backdropFilter: "blur(10px)",
}));

const StyledButton = styled(Button)(() => ({
  background: "linear-gradient(45deg, #1DA1F2 30%, #0c8bd9 90%)",
  border: 0,
  borderRadius: "8px",
  boxShadow: "0 3px 5px 2px rgba(29, 161, 242, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(45deg, #0c8bd9 30%, #0a7bbf 90%)",
    boxShadow: "0 4px 10px 2px rgba(29, 161, 242, .4)",
  },
  "&.Mui-disabled": {
    background: "rgba(255, 255, 255, 0.12)",
    color: "rgba(255, 255, 255, 0.3)",
  },
}));

export const CustomConnectButton = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { user, linkTwitter } = usePrivy();
  const [twitterModalOpen, setTwitterModalOpen] = useState(false);

  // Check if user has Twitter linked
  const hasTwitterLinked = user?.linkedAccounts?.some(
    (account) => account.type === "twitter_oauth"
  );
  
  // Get Twitter profile information
  const twitterAccount = user?.linkedAccounts?.find(account => account.type === "twitter_oauth");
  const twitterUsername = twitterAccount?.username || '';
  const twitterAvatarUrl = twitterAccount?.profilePictureUrl || '';

  // Add event listener to open Twitter modal from other components
  useEffect(() => {
    const handleOpenTwitterModal = () => {
      setTwitterModalOpen(true);
    };
    document.addEventListener("openAccountModal", handleOpenTwitterModal);
    return () => {
      document.removeEventListener("openAccountModal", handleOpenTwitterModal);
    };
  }, []);

  return (
    <>
      {/* Twitter Connection Modal */}
      <StyledDialog open={twitterModalOpen} onClose={() => setTwitterModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            {hasTwitterLinked ? "Twitter Account Connected" : "Connect Twitter Account"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {hasTwitterLinked ? (
              <>
                <StyledInfoCard>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {twitterAvatarUrl ? (
                        <Avatar
                          src={twitterAvatarUrl}
                          alt={twitterUsername}
                          sx={{ 
                            width: 60, 
                            height: 60,
                            border: '2px solid #1DA1F2'
                          }}
                        />
                      ) : (
                        <Avatar sx={{ width: 60, height: 60, bgcolor: "#1DA1F2" }}>
                          <TwitterIcon sx={{ fontSize: 30 }} />
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="h6" sx={{ color: "white" }}>
                          @{twitterUsername}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <CheckCircleIcon fontSize="small" sx={{ color: "#4CAF50", mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: "#4CAF50" }}>
                            Verified
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </StyledInfoCard>

                <StyledCard>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: "white", mb: 1 }}>
                      Twitter Account Benefits
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      Your Twitter account is connected and can be used for DAO funding features.
                      This helps build trust with other community members and enhances your
                      reputation within the platform.
                    </Typography>
                  </CardContent>
                </StyledCard>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Chip
                    icon={<TwitterIcon style={{ color: "#1DA1F2" }} />}
                    label="Twitter Connected"
                    sx={{
                      bgcolor: "rgba(29, 161, 242, 0.2)",
                      color: "#1DA1F2",
                      borderRadius: "8px",
                      py: 1,
                      px: 1,
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setTwitterModalOpen(false)}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      '&:hover': {
                        borderColor: "white",
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                      }
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <StyledInfoCard>
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Avatar sx={{ 
                      width: 70, 
                      height: 70, 
                      bgcolor: "#1DA1F2", 
                      margin: "0 auto",
                      mb: 2 
                    }}>
                      <TwitterIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    
                    <Typography variant="h5" sx={{ color: "white", mb: 1 }}>
                      Connect Your Twitter
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                      Link your Twitter account to enhance your DAO experience
                    </Typography>
                  </CardContent>
                </StyledInfoCard>

                <StyledCard>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: "white", mb: 1.5 }}>
                      Benefits of Connecting Twitter
                    </Typography>
                    
                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "#4CAF50", mr: 1 }} />
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          Establish a recognizable identity in the DAO
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "#4CAF50", mr: 1 }} />
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          Gain higher trust scores for funding proposals
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleIcon fontSize="small" sx={{ color: "#4CAF50", mr: 1 }} />
                        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          Connect with other members easily
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </StyledCard>

                <StyledButton
                  fullWidth
                  startIcon={<TwitterIcon />}
                  onClick={linkTwitter}
                >
                  Connect Twitter Account
                </StyledButton>
              </>
            )}
          </Stack>
        </DialogContent>
      </StyledDialog>

      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const commonButtonStyles = {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(5px)",
            color: "#ffffff",
            padding: isMobile ? "8px 12px" : "12px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            cursor: "pointer",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          };

          return (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!mounted || !account || !chain) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type='button'
                      style={commonButtonStyles}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.2)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                    >
                      Connect Wallet
                    </button>
                  );
                }

                return (
                  <div
                    style={{ display: "flex", gap: isMobile ? "6px" : "12px" }}
                  >
                    <button
                      onClick={openChainModal}
                      type='button'
                      style={{
                        ...commonButtonStyles,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: "fit-content",
                        padding: isMobile ? "8px" : "12px 20px",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.2)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: isMobile ? "20px" : "24px",
                            height: isMobile ? "20px" : "24px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: "100%", height: "100%" }}
                            />
                          )}
                        </div>
                      )}
                      {!isMobile && chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type='button'
                      style={{
                        ...commonButtonStyles,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: "fit-content",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.2)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }}
                    >
                      {!isMobile && (
                        <span style={{ whiteSpace: "nowrap" }}>
                          {account.displayBalance ?? 0}
                        </span>
                      )}
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: isMobile
                            ? "100px"
                            : isTablet
                            ? "120px"
                            : "140px",
                        }}
                      >
                        {account.displayName}
                      </span>
                      
                      {/* Show Twitter profile if linked */}
                      {hasTwitterLinked && (
                        <Tooltip title={`@${twitterUsername}`}>
                          <Avatar
                            src={twitterAvatarUrl}
                            alt={twitterUsername}
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              ml: 1,
                              border: '1px solid #1DA1F2',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTwitterModalOpen(true);
                            }}
                          />
                        </Tooltip>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};