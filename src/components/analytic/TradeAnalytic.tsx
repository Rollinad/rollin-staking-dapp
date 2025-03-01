import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Grid,
  alpha,
} from "@mui/material";
// Add the missing imports for date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  OpenInNew as OpenInNewIcon,
  SwapVert,
  Refresh as RefreshIcon,
  TrendingUp,
  LocalAtm,
  LocalGasStation,
} from "@mui/icons-material";
import { useAccount } from "wagmi";
import { cardStyle } from "../swapping/styles";
import { Trade, useTradeAnalytics } from "../../hooks/useTradeAnalytic";
import { formatDate } from "../../utils/date";
import { DetailedTradeModal } from "./DetailedTradeModal";

// Status chip component
export const StatusChip = ({ status }: { status: string }) => {
  const getColor = () => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'pending':
      case 'submitted':
        return '#FFD700'; // Gold
      case 'failed':
        return '#f44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      size="small"
      sx={{
        backgroundColor: `${getColor()}20`,
        color: getColor(),
        fontWeight: 'bold',
      }}
    />
  );
};

// Helper function to truncate addresses and hashes
const truncateHash = (hash: string): string => {
  if (!hash) return '';
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
};

// Helper function to get blockchain explorer URL
export const getExplorerUrl = (chainId: number, address: string, isAddress = true): string => {
  let baseUrl = '';
  switch (chainId) {
    case 1:
      baseUrl = 'https://etherscan.io';
      break;
    case 137:
      baseUrl = 'https://polygonscan.com';
      break;
    case 56:
      baseUrl = 'https://bscscan.com';
      break;
    case 42161:
      baseUrl = 'https://arbiscan.io';
      break;
    case 10:
      baseUrl = 'https://optimistic.etherscan.io';
      break;
    default:
      baseUrl = 'https://etherscan.io';
  }
  return `${baseUrl}/${isAddress ? 'address' : 'tx'}/${address}`;
};

// Summary Card Component for Analytics Dashboard
const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  loading, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  loading: boolean; 
  color: string;
}) => {
  return (
    <Paper
      sx={{
        p: 2,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 2,
        border: `1px solid ${color}20`,
        height: "100%",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          {title}
        </Typography>
        <Box sx={{ 
          backgroundColor: `${color}20`, 
          p: 0.5, 
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center" 
        }}>
          {icon}
        </Box>
      </Box>
      {loading ? (
        <Box sx={{ height: 40, backgroundColor: "rgba(255, 255, 255, 0.1)", width: "70%", borderRadius: 1 }} />
      ) : (
        <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
          {value}
        </Typography>
      )}
    </Paper>
  );
};

// Main TradeAnalytics Component
export const TradeAnalytics = () => {
  const theme = useTheme();
  const { isConnected, chainId } = useAccount();
  const [tabIndex, setTabIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use the custom hook for trade analytics
  const {
    trades,
    gaslessTrades,
    isLoading,
    error,
    hasMoreTrades,
    hasMoreGaslessTrades,
    fetchTrades,
    fetchGaslessTrades,
    loadMoreTrades,
    loadMoreGaslessTrades,
    resetTradeData,
  } = useTradeAnalytics();

  // Fetch trades on component mount
  useEffect(() => {
    if (isConnected) {
      fetchTradeData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Fetch both regular and gasless trades
  const fetchTradeData = async () => {
    const options = {
      startTimestamp: startDate ? Math.floor(startDate.getTime() / 1000) : undefined,
      endTimestamp: endDate ? Math.floor(endDate.getTime() / 1000) : undefined,
    };
    
    try {
      await Promise.all([
        fetchTrades(options),
        fetchGaslessTrades(options)
      ]);
    } catch (error) {
      console.error("Error fetching trade data:", error);
    }
  };

  // Load more trades
  const handleLoadMore = async () => {
    if (tabIndex === 0) {
      await loadMoreTrades();
    } else if (tabIndex === 1) {
      await loadMoreGaslessTrades();
    }
  };

  // Apply filters and refresh data
  const handleApplyFilters = () => {
    resetTradeData();
    fetchTradeData();
  };

  // Reset data and refresh
  const handleRefresh = () => {
    resetTradeData();
    setSearchQuery("");
    fetchTradeData();
  };

  // Open trade details modal
  const handleOpenDetails = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailModalOpen(true);
  };

  // Close trade details modal
  const handleCloseDetails = () => {
    setDetailModalOpen(false);
    setSelectedTrade(null);
  };
  
  // Calculate metrics for analytics cards
  const totalTradeVolume = useMemo(() => {
    return trades.reduce(
      (acc, trade) => acc + parseFloat(trade.sellToken.amount), 
      0
    ).toFixed(2);
  }, [trades]);
  
  const totalGaslessTrades = gaslessTrades.length;
  
  const estimatedGasSavings = useMemo(() => {
    return (totalGaslessTrades * 0.005).toFixed(4);
  }, [totalGaslessTrades]);
  
  const totalTrades = trades.length + gaslessTrades.length;

  // Filter trades based on search query
  const filteredTrades = useMemo(() => {
    const activeTradesList = tabIndex === 0 ? trades : gaslessTrades;
    
    if (!searchQuery) return activeTradesList;
    
    const query = searchQuery.toLowerCase();
    return activeTradesList.filter(trade => 
      trade.sellToken.symbol.toLowerCase().includes(query) || 
      trade.buyToken.symbol.toLowerCase().includes(query) || 
      (trade.txHash && trade.txHash.toLowerCase().includes(query))
    );
  }, [tabIndex, trades, gaslessTrades, searchQuery]);

  return (
    <Card sx={cardStyle}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SwapVert sx={{ color: theme.palette.primary.main }} />
            <Typography
              variant="h5"
              sx={{
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Trade Analytics
            </Typography>
          </Box>
          <IconButton
            onClick={handleRefresh}
            sx={{ color: "#fff" }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Total Trades"
              value={totalTrades}
              icon={<SwapVert sx={{ color: theme.palette.primary.main }} />}
              loading={isLoading && !trades.length && !gaslessTrades.length}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Total Volume"
              value={`$${totalTradeVolume}`}
              icon={<TrendingUp sx={{ color: "#4CAF50" }} />}
              loading={isLoading && !trades.length}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Gasless Trades"
              value={totalGaslessTrades}
              icon={<LocalAtm sx={{ color: "#FF9800" }} />}
              loading={isLoading && !gaslessTrades.length}
              color="#FF9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Gas Saved (ETH)"
              value={estimatedGasSavings}
              icon={<LocalGasStation sx={{ color: "#2196F3" }} />}
              loading={isLoading && !gaslessTrades.length}
              color="#2196F3"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="trade analytics tabs"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          >
            <Tab
              label="Regular Swaps"
              sx={{
                color: "#fff",
                "&.Mui-selected": { color: theme.palette.primary.main },
              }}
            />
            <Tab
              label="Gasless Swaps"
              sx={{
                color: "#fff",
                "&.Mui-selected": { color: theme.palette.primary.main },
              }}
            />
          </Tabs>
        </Box>

        {/* Controls: Search & Filters */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, justifyContent: "space-between" }}>
          <TextField
            placeholder="Search by token or tx hash"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                </InputAdornment>
              ),
              sx: {
                color: "#fff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.1)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              },
            }}
            sx={{ flexGrow: 1, maxWidth: { xs: "100%", md: "50%" } }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.3)",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.5)",
              },
            }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </Box>

        {/* Date Filters */}
        <Accordion
          expanded={showFilters}
          disableGutters
          elevation={0}
          sx={{
            mb: 3,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
            "&:before": {
              display: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
            sx={{ display: "none" }}
          >
            <Typography>Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue: Date | null) => setStartDate(newValue)}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                  }}
                />
                <DateTimePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue: Date | null) => setEndDate(newValue)}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                  }}
                />
              </LocalizationProvider>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.8),
                  },
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Error Message */}
        {error && (
          <Typography
            color="error"
            sx={{
              mb: 3,
              color: "#ff6b6b",
              backgroundColor: "rgba(255, 107, 107, 0.1)",
              p: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Typography>
        )}

        {/* Loading State */}
        {isLoading && !filteredTrades.length && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* No Trades Message */}
        {!isLoading && !filteredTrades.length && (
          <Paper
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
            }}
          >
            <HistoryIcon sx={{ fontSize: 48, color: "rgba(255, 255, 255, 0.3)", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
              No trade history found
            </Typography>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              {searchQuery 
                ? "No results match your search criteria." 
                : tabIndex === 0
                  ? "Your regular swap transactions will appear here."
                  : "Your gasless swap transactions will appear here."}
            </Typography>
          </Paper>
        )}

        {/* Trades Table */}
        {filteredTrades.length > 0 && (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 2,
              mb: 2,
              maxHeight: 600,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      backgroundColor: "rgba(0, 0, 0, 0.6)" 
                    }}
                  >
                    Date/Time
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      backgroundColor: "rgba(0, 0, 0, 0.6)" 
                    }}
                  >
                    Trade
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      backgroundColor: "rgba(0, 0, 0, 0.6)" 
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      backgroundColor: "rgba(0, 0, 0, 0.6)" 
                    }}
                  >
                    Transaction
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      width: "80px"
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      cursor: "pointer",
                    }}
                    onClick={() => handleOpenDetails(trade)}
                  >
                    <TableCell sx={{ color: "#fff" }}>
                      {formatDate(trade.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title={`${trade.sellToken.amount} ${trade.sellToken.symbol}`}>
                          <Box sx={{ display: "flex", alignItems: "center", color: "#ff6b6b" }}>
                            <CallMadeIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography>
                              {parseFloat(trade.sellToken.amount).toFixed(6)} {trade.sellToken.symbol}
                            </Typography>
                          </Box>
                        </Tooltip>
                        <SwapVert fontSize="small" sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                        <Tooltip title={`${trade.buyToken.amount} ${trade.buyToken.symbol}`}>
                          <Box sx={{ display: "flex", alignItems: "center", color: "#4CAF50" }}>
                            <CallReceivedIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography>
                              {parseFloat(trade.buyToken.amount).toFixed(6)} {trade.buyToken.symbol}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={trade.status} />
                    </TableCell>
                    <TableCell>
                      {trade.txHash ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography sx={{ color: "#fff", mr: 1 }}>
                            {truncateHash(trade.txHash)}
                          </Typography>
                          <Tooltip title="View on Explorer">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getExplorerUrl(chainId || 1, trade?.txHash ?? "", false), "_blank");
                              }}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(trade);
                          }}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <ExpandMoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Load More Button */}
        {((tabIndex === 0 && hasMoreTrades) || (tabIndex === 1 && hasMoreGaslessTrades)) && filteredTrades.length > 0 && !searchQuery && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={isLoading}
              sx={{
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Load More"
              )}
            </Button>
          </Box>
        )}

        {/* Detailed Trade Modal */}
        <DetailedTradeModal
          open={detailModalOpen}
          onClose={handleCloseDetails}
          trade={selectedTrade}
          chainId={chainId || 1}
        />
      </CardContent>
    </Card>
  );
};