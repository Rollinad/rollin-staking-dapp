import type { NextApiRequest, NextApiResponse } from "next";

// Shared headers and configs
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, 0x-api-key",
};

const zeroXHeaders = {
  "Content-Type": "application/json",
  "0x-api-key": process.env.VITE_0X_API_KEY!,
  "0x-version": "v2",
};

function setCorsHeaders(res: NextApiResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function handleOptionsRequest(res: NextApiResponse) {
  setCorsHeaders(res);
  return res.status(200).end();
}

// API Handler for gasless trades
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return handleOptionsRequest(res);
    }

    // Set CORS headers for all responses
    setCorsHeaders(res);

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { cursor, startTimestamp, endTimestamp } = req.query;

    // Build the query params
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor.toString());
    if (startTimestamp)
      params.append("startTimestamp", startTimestamp.toString());
    if (endTimestamp) params.append("endTimestamp", endTimestamp.toString());

    // Call the 0x API
    const response = await fetch(
      `https://api.0x.org/trade-analytics/gasless?${params.toString()}`,
      {
        headers: zeroXHeaders,
        method: "GET",
      }
    );

    console.log(`response ${JSON.stringify(response)}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`0x API Error: ${JSON.stringify(data)}`);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("API Error:", err);
    const error = err as Error;
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
