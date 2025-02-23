import { useState, useEffect } from "react";

export interface Token {
  address: string;
  name: string;
  logoURI: string;
  symbol: string;
  decimal: number;
  verified: boolean;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // This will fetch from your public directory
        const response = await fetch("/tokens.json");
        if (!response.ok) {
          throw new Error("Failed to fetch tokens");
        }
        const data = await response.json();
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tokens");
        console.error("Error loading tokens:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, loading, error };
};
