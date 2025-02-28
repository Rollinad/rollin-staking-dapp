import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import { formatEther } from "viem";
import { stringToVibrantColor } from "../../../utils/stringToColor";
import PeopleIcon from "@mui/icons-material/People";
import { ContributorCounts, ContributorInfo } from "../../../types/funding";

interface ContributorsTabProps {
  contributorCounts: ContributorCounts | null;
  approvedContributors: [ContributorInfo[], bigint] | null;
  isCreator: boolean;
  canReleaseFunds: boolean;
  handleReleaseFunds: () => void;
  contributionPending: boolean;
  contributionConfirming: boolean;
}

export const ContributorsTab: React.FC<ContributorsTabProps> = ({
  contributorCounts,
  approvedContributors,
  isCreator,
  canReleaseFunds,
  handleReleaseFunds,
  contributionPending,
  contributionConfirming,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
          Contributors
        </Typography>

        {contributorCounts && (
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Card
              sx={{
                p: 2,
                flexGrow: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant='h4'
                sx={{ color: "white", fontWeight: "bold" }}
              >
                {contributorCounts.approvedCount.toString()}
              </Typography>
              <Typography
                variant='body2'
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Approved Contributors
              </Typography>
            </Card>

            <Card
              sx={{
                p: 2,
                flexGrow: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant='h4'
                sx={{ color: "white", fontWeight: "bold" }}
              >
                {contributorCounts.requestingCount.toString()}
              </Typography>
              <Typography
                variant='body2'
                sx={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Pending Requests
              </Typography>
            </Card>
          </Box>
        )}

        {approvedContributors &&
        approvedContributors[0] &&
        approvedContributors[0].length > 0 ? (
          <List
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
              color: "white",
            }}
          >
            {approvedContributors[0].map((contributor, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: stringToVibrantColor(
                          contributor.contributorAddress
                        ),
                      }}
                    >
                      {contributor.contributorAddress
                        .substring(2, 4)
                        .toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      contributor.contributorAddress.substring(0, 6) +
                      "..." +
                      contributor.contributorAddress.substring(38)
                    }
                    secondary={
                      <Typography
                        variant='body2'
                        sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Contributed:{" "}
                        {formatEther(contributor.currentContribution)} ETH
                      </Typography>
                    }
                  />
                </ListItem>
                {index < approvedContributors[0].length - 1 && (
                  <Divider
                    component='li'
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box
            sx={{
              p: 3,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <PeopleIcon
              sx={{ fontSize: 48, color: "rgba(255, 255, 255, 0.3)", mb: 1 }}
            />
            <Typography
              variant='body1'
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              No contributors yet
            </Typography>
          </Box>
        )}
      </Grid>

      {isCreator && (
        <Grid item xs={12} md={6}>
          <Typography variant='h6' sx={{ color: "white", mb: 2 }}>
            Contributor Management
          </Typography>

          <Paper
            sx={{
              p: 3,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
            }}
          >
            <Typography variant='body1' sx={{ color: "white", mb: 2 }}>
              As the creator of this proposal, you can:
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary='Approve pending contribution requests'
                  secondary='Allow contributors to fund your proposal'
                  sx={{
                    "& .MuiListItemText-primary": { color: "white" },
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary='Set contribution limits'
                  secondary='Control how much each contributor can fund'
                  sx={{
                    "& .MuiListItemText-primary": { color: "white" },
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary='Release funds'
                  secondary='Once funding target is reached, release funds to your wallet'
                  sx={{
                    "& .MuiListItemText-primary": { color: "white" },
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                  }}
                />
              </ListItem>
            </List>

            {canReleaseFunds && (
              <Button
                variant='contained'
                color='success'
                onClick={handleReleaseFunds}
                disabled={contributionPending || contributionConfirming}
                fullWidth
                sx={{ mt: 2 }}
              >
                {contributionPending || contributionConfirming ? (
                  <CircularProgress size={24} />
                ) : (
                  "Release Funds"
                )}
              </Button>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};
