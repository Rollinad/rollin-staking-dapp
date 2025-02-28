import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMediaQuery } from "@mui/material";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
} from "@mui/material";
import { usePrivy } from "@privy-io/react-auth";
import TwitterIcon from "@mui/icons-material/Twitter";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";

export const CustomConnectButton = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { user, linkTwitter } = usePrivy();
  const [twitterModalOpen, setTwitterModalOpen] = useState(false);

  // Check if user has Twitter linked
  const hasTwitterLinked = user?.linkedAccounts?.some(
    (account) => account.type === "twitter_oauth"
  );

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
      <Dialog
        open={twitterModalOpen}
        onClose={() => setTwitterModalOpen(false)}
        PaperProps={{
          style: {
            borderRadius: "16px",
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "#fff",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.16)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <IconButton
            aria-label='close'
            onClick={() => setTwitterModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(0, 0, 0, 0.54)",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.08)",
              },
            }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>

          <Avatar sx={{ width: 80, height: 80, bgcolor: "#1DA1F2", mb: 3 }}>
            <TwitterIcon sx={{ fontSize: 40 }} />
          </Avatar>

          <Typography variant='h5' gutterBottom>
            Connect Twitter Account
          </Typography>

          <Typography variant='body1' sx={{ mb: 4, textAlign: "center" }}>
            Connect your Twitter account to participate in DAO funding features.
          </Typography>

          {hasTwitterLinked ? (
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Chip
                icon={<TwitterIcon style={{ color: "#1DA1F2" }} />}
                label='Twitter Connected'
                color='primary'
                variant='outlined'
                sx={{
                  borderColor: "#1DA1F2",
                  color: "#1DA1F2",
                }}
              />
            </Box>
          ) : (
            <Button
              variant='contained'
              size='large'
              startIcon={<TwitterIcon />}
              onClick={linkTwitter}
              sx={{
                bgcolor: "#1DA1F2",
                "&:hover": { bgcolor: "#0c8bd9" },
                py: 1.5,
                px: 3,
              }}
            >
              Connect Twitter Account
            </Button>
          )}
        </Box>
      </Dialog>

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
                        padding: isMobile ? "8px" : "12px 20px", // Smaller padding on mobile
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
