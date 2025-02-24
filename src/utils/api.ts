import type { NextApiResponse } from "next";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, 0x-api-key",
};

export const zeroXHeaders = {
  "Content-Type": "application/json",
  "0x-api-key": process.env.VITE_0X_API_KEY!,
  "0x-version": "v2",
};

export type SwapRequestBody = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
  chainId: string;
};

export function setCorsHeaders(res: NextApiResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export function handleOptionsRequest(res: NextApiResponse) {
  setCorsHeaders(res);
  return res.status(200).end();
}