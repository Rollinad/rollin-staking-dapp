// src/pages/api/rollin-protocol.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorMessage } from "../src/types/staking";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // In production, replace with your actual domain
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, 0x-api-key",
};

// 0x API headers
const zeroXHeaders = {
  "Content-Type": "application/json",
  "0x-api-key": process.env.ZEROX_API_KEY!,
  "0x-version": "v2",
};

type PriceRequestBody = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, 0x-api-key");
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, ...data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    switch (type) {
      case "price":
        return handlePriceRequest(data as PriceRequestBody, res);
      case "quote":
        return handleQuoteRequest(data as PriceRequestBody, res);
      default:
        return res.status(400).json({ error: "Invalid request type" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handlePriceRequest(
  data: PriceRequestBody,
  res: NextApiResponse
) {
  try {
    const params = new URLSearchParams({
      sellToken: data.sellToken,
      buyToken: data.buyToken,
      sellAmount: data.sellAmount,
      takerAddress: data.takerAddress,
    });

    const response = await fetch(
      `https://api.0x.org/swap/permit2/price?${params}`,
      { headers: zeroXHeaders }
    );

    const quote = await response.json();

    if (!response.ok) {
      throw new Error(quote.reason || "Failed to fetch price");
    }

    return res.status(200).json(quote);
  } catch (err) {
    const error = err as ErrorMessage;
    return res.status(400).json({ error: error.message });
  }
}

async function handleQuoteRequest(
  data: PriceRequestBody,
  res: NextApiResponse
) {
  try {
    const params = new URLSearchParams({
      sellToken: data.sellToken,
      buyToken: data.buyToken,
      sellAmount: data.sellAmount,
      takerAddress: data.takerAddress,
    });

    const response = await fetch(
      `https://api.0x.org/swap/permit2/quote?${params}`,
      { headers: zeroXHeaders }
    );

    const quote = await response.json();

    if (!response.ok) {
      throw new Error(quote.reason || "Failed to fetch quote");
    }

    return res.status(200).json(quote);
  } catch (err) {
    const error = err as ErrorMessage;
    return res.status(400).json({ error: error.message });
  }
}

// Disable body parsing, as we want it as a stream
export const config = {
  api: {
    bodyParser: true,
  },
};