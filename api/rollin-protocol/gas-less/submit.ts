import type { NextApiRequest, NextApiResponse } from "next";

// Shared types and utilities
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, 0x-api-key",
};

const zeroXHeaders = {
  "Content-Type": "application/json",
  "0x-api-key": process.env.VITE_0X_API_KEY!,
  "0x-version": "v2",
};

type SubmitRequestBody = {
  trade: any;
  chainId: string;
  approval?: any;
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

// API Handler
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

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const data = req.body as SubmitRequestBody;

    // Validate required fields
    if (!data.trade || !data.chainId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Forward the request to 0x API
    const response = await fetch("https://api.0x.org/gasless/submit", {
      method: "POST",
      headers: zeroXHeaders,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to submit gasless swap",
        reason: responseData.reason || JSON.stringify(responseData),
      });
    }

    return res.status(200).json(responseData);
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
