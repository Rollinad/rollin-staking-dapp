import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Stack,
} from "@mui/material";
import { formatEther } from "viem";
import { ProposalBasic, ProposalToken } from "../../../types/funding";

interface OverviewTabProps {
  proposalBasic: ProposalBasic;
  proposalToken: ProposalToken;
  isFundingEnded: boolean;
  hasMetTarget: boolean;
  tokenPrice: bigint | null;
  tokenBalance: bigint | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  proposalBasic,
  proposalToken,
  isFundingEnded,
  hasMetTarget,
  tokenPrice,
  tokenBalance,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
          Project Details
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant='body1'
            sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 2 }}
          >
            This is a funding proposal for the {proposalToken.tokenName}{" "}
            project. The creator is seeking{" "}
            {formatEther(proposalBasic.targetAmount)} ETH in funding.
          </Typography>

          <Typography
            variant='body1'
            sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 2 }}
          >
            Contributors will receive {proposalToken.tokenSymbol} tokens
            proportional to their contribution amount.
          </Typography>

          {proposalBasic.isClosed ? (
            <Alert
              severity={hasMetTarget ? "success" : "warning"}
              sx={{ mb: 2 }}
            >
              {hasMetTarget
                ? "This proposal has been successfully funded and closed. Trading is now available."
                : "This proposal did not reach its funding goal and has been closed."}
            </Alert>
          ) : isFundingEnded && hasMetTarget ? (
            <Alert severity='info' sx={{ mb: 2 }}>
              Funding period has ended and the target amount has been reached.
              The creator can now release funds.
            </Alert>
          ) : isFundingEnded ? (
            <Alert severity='warning' sx={{ mb: 2 }}>
              Funding period has ended without reaching the target. Contributors
              can withdraw their funds.
            </Alert>
          ) : null}
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            height: "100%",
          }}
        >
          <CardContent>
            <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
              Token Details
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Token Name
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {proposalToken.tokenName}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Token Symbol
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {proposalToken.tokenSymbol}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  variant='body2'
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Total Supply
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {formatEther(proposalToken.tokenSupply)}
                </Typography>
              </Box>

              {tokenPrice && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography
                    variant='body2'
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    Current Price
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {formatEther(tokenPrice)} ETH
                  </Typography>
                </Box>
              )}

              {tokenBalance && tokenBalance > 0n && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography
                    variant='body2'
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    Your Balance
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {formatEther(tokenBalance)} {proposalToken.tokenSymbol}
                  </Typography>
                </Box>
              )}

              {proposalBasic.tokensDeployed && (
                <>
                  <Divider sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }} />
                  <Box>
                    <Typography
                      variant='body2'
                      sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 1 }}
                    >
                      Token Contract
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: "white", wordBreak: "break-all" }}
                    >
                      {proposalToken.tokenAddress}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
