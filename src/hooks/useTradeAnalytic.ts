import { useState, useCallback } from "react";
import { useAccount } from "wagmi";

// Define types for trade analytics
export interface Trade {
  id: string;
  timestamp: number;
  sellToken: {
    symbol: string;
    amount: string;
    address: string;
  };
  buyToken: {
    symbol: string;
    amount: string;
    address: string;
  };
  status: string;
  txHash?: string;
  gasUsed?: string;
  gasPrice?: string;
}

interface TradeAnalyticsResponse {
  trades: Trade[];
  nextCursor: string | null;
  zid: string;
}

interface TradeAnalyticsOptions {
  startTimestamp?: number;
  endTimestamp?: number;
  cursor?: string;
}

export const useTradeAnalytics = () => {
  const { isConnected } = useAccount();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [gaslessTrades, setGaslessTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [gaslessNextCursor, setGaslessNextCursor] = useState<string | null>(
    null
  );

  // Fetch regular swap trades
  const fetchTrades = useCallback(
    async (options: TradeAnalyticsOptions = {}) => {
      if (!isConnected) {
        setError("Wallet not connected");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.startTimestamp) {
          params.append("startTimestamp", options.startTimestamp.toString());
        }
        if (options.endTimestamp) {
          params.append("endTimestamp", options.endTimestamp.toString());
        }
        if (options.cursor) {
          params.append("cursor", options.cursor);
        }

        const response = await fetch(
          `/api/rollin-protocol/trade-analytics/swap?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.reason || "Failed to fetch trade analytics"
          );
        }

        const data: TradeAnalyticsResponse = await response.json();

        if (options.cursor) {
          // Append trades if using cursor for pagination
          setTrades((prev) => [...prev, ...data.trades]);
        } else {
          // Replace trades if it's a new query
          setTrades(data.trades);
        }

        setNextCursor(data.nextCursor);
        return data;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Error fetching trades";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected]
  );

  // Fetch gasless trades
  const fetchGaslessTrades = useCallback(
    async (options: TradeAnalyticsOptions = {}) => {
      if (!isConnected) {
        setError("Wallet not connected");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.startTimestamp) {
          params.append("startTimestamp", options.startTimestamp.toString());
        }
        if (options.endTimestamp) {
          params.append("endTimestamp", options.endTimestamp.toString());
        }
        if (options.cursor) {
          params.append("cursor", options.cursor);
        }

        const response = await fetch(
          `/api/rollin-protocol/trade-analytics/gasless?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.reason || "Failed to fetch gasless trade analytics"
          );
        }

        const data: TradeAnalyticsResponse = await response.json();

        if (options.cursor) {
          // Append trades if using cursor for pagination
          setGaslessTrades((prev) => [...prev, ...data.trades]);
        } else {
          // Replace trades if it's a new query
          setGaslessTrades(data.trades);
        }

        setGaslessNextCursor(data.nextCursor);
        return data;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Error fetching gasless trades";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected]
  );

  // Load more trades (pagination)
  const loadMoreTrades = useCallback(() => {
    if (nextCursor) {
      return fetchTrades({ cursor: nextCursor });
    }
    return null;
  }, [nextCursor, fetchTrades]);

  // Load more gasless trades (pagination)
  const loadMoreGaslessTrades = useCallback(() => {
    if (gaslessNextCursor) {
      return fetchGaslessTrades({ cursor: gaslessNextCursor });
    }
    return null;
  }, [gaslessNextCursor, fetchGaslessTrades]);

  // Reset all data
  const resetTradeData = useCallback(() => {
    setTrades([]);
    setGaslessTrades([]);
    setNextCursor(null);
    setGaslessNextCursor(null);
    setError(null);
  }, []);

  return {
    trades,
    gaslessTrades,
    isLoading,
    error,
    hasMoreTrades: !!nextCursor,
    hasMoreGaslessTrades: !!gaslessNextCursor,
    fetchTrades,
    fetchGaslessTrades,
    loadMoreTrades,
    loadMoreGaslessTrades,
    resetTradeData,
  };
};
