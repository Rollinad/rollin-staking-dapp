import { Hex } from "viem";

export enum SignatureType {
  EIP712 = 2,
}

export interface SplitSignature {
  r: string;
  s: string;
  v: string;
}

/**
 * Splits a signature into its components: r, s, v
 * @param signature The full signature hex string
 * @returns The split signature object
 */
export function splitSignature(signature: Hex): SplitSignature {
  // Remove 0x prefix if present
  const sigHex = signature.startsWith("0x")
    ? signature.substring(2)
    : signature;

  // Signature is 65 bytes: r (32 bytes) + s (32 bytes) + v (1 byte)
  const r = "0x" + sigHex.substring(0, 64);
  const s = "0x" + sigHex.substring(64, 128);
  const v = "0x" + sigHex.substring(128, 130);

  return { r, s, v };
}
