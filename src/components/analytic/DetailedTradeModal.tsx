import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Paper, Typography } from "@mui/material";
import { Trade } from "../../hooks/useTradeAnalytic";
import { getExplorerUrl, StatusChip } from "./TradeAnalytic";
import { Close, OpenInNew } from "@mui/icons-material";
import { formatDate } from "../../utils/date";

export const DetailedTradeModal = ({
  open,
  onClose,
  trade,
  chainId,
}: {
  open: boolean;
  onClose: () => void;
  trade: Trade | null;
  chainId: number;
}) => {
  if (!trade) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#111",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))",
          color: "#fff",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant='h6'>Trade Details</Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Transaction Time
          </Typography>
          <Typography variant='body1'>{formatDate(trade.timestamp)}</Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: "rgba(255, 0, 0, 0.05)",
                borderRadius: 2,
              }}
            >
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Sold
              </Typography>
              <Typography variant='h6'>
                {trade.sellToken.amount} {trade.sellToken.symbol}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant='body2' sx={{ mr: 1 }}>
                  Contract:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                >
                  {`${trade.sellToken.address.substring(
                    0,
                    8
                  )}...${trade.sellToken.address.substring(
                    trade.sellToken.address.length - 6
                  )}`}
                </Typography>
                <IconButton
                  size='small'
                  onClick={() =>
                    window.open(
                      getExplorerUrl(chainId, trade.sellToken.address),
                      "_blank"
                    )
                  }
                >
                  <OpenInNew fontSize='small' />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: "rgba(0, 255, 0, 0.05)",
                borderRadius: 2,
              }}
            >
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Received
              </Typography>
              <Typography variant='h6'>
                {trade.buyToken.amount} {trade.buyToken.symbol}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                <Typography variant='body2' sx={{ mr: 1 }}>
                  Contract:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                >
                  {`${trade.buyToken.address.substring(
                    0,
                    8
                  )}...${trade.buyToken.address.substring(
                    trade.buyToken.address.length - 6
                  )}`}
                </Typography>
                <IconButton
                  size='small'
                  onClick={() =>
                    window.open(
                      getExplorerUrl(chainId, trade.buyToken.address),
                      "_blank"
                    )
                  }
                >
                  <OpenInNew fontSize='small' />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Status
          </Typography>
          <StatusChip status={trade.status} />
        </Box>

        {trade.txHash && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Transaction Hash
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant='body1'
                sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                {trade.txHash}
              </Typography>
              <IconButton
                size='small'
                onClick={() =>
                  window.open(
                    getExplorerUrl(chainId, trade?.txHash ?? "", false),
                    "_blank"
                  )
                }
                sx={{ ml: 1 }}
              >
                <OpenInNew />
              </IconButton>
            </Box>
          </Box>
        )}

        {trade.gasUsed && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Gas Used
            </Typography>
            <Typography variant='body1'>{trade.gasUsed}</Typography>
          </Box>
        )}

        {trade.gasPrice && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Gas Price
            </Typography>
            <Typography variant='body1'>{trade.gasPrice} Gwei</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button
          onClick={onClose}
          variant='contained'
          color='primary'
          sx={{
            backgroundColor: "#9c27b0",
            "&:hover": { backgroundColor: "#7b1fa2" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
