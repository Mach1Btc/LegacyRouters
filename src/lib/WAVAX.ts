import { writeContract } from "@wagmi/core";
import { WAVAX_ABI, WAVAX_ADDRESS } from "./constants";
import { web3Config } from "@/context/Web3Context";
import BN from "bn.js";
import { waitForWagmiTxReceipt } from "@/lib//tx";
import { Token } from "./types";

export async function createWrapAvaxTransaction(account: string, amount: BN) {
  try {
    const txHash = await writeContract(web3Config, {
      address: WAVAX_ADDRESS as `0x${string}`,
      abi: WAVAX_ABI,
      functionName: "deposit",
      account: account as `0x${string}`,
      value: BigInt(amount.toString()),
    });

    const receipt = await waitForWagmiTxReceipt(txHash);

    return { success: receipt.status === "success", txHash };
  } catch (error) {
    console.error("Wrap AVAX failed:", error);
    return { success: false, error };
  }
}

export async function createUnwrapAvaxTransaction(account: string, amount: BN) {
  try {
    const txHash = await writeContract(web3Config, {
      address: WAVAX_ADDRESS as `0x${string}`,
      abi: WAVAX_ABI,
      functionName: "withdraw",
      args: [BigInt(amount.toString())],
      account: account as `0x${string}`,
    });

    const receipt = await waitForWagmiTxReceipt(txHash);

    return { success: receipt.status === "success", txHash };
  } catch (error) {
    console.error("Unwrap AVAX failed:", error);
    return { success: false, error };
  }
}

export const WrapUtils = {
  // Helper to normalize token addresses (convert AVAX to WAVAX for comparisons)
  normalizeAddress: (address: string): string => {
    return address === "0xAVAX" ? WAVAX_ADDRESS : address;
  },

  // Check if operation is wrapping AVAX -> WAVAX
  isWrapping: (fromToken: Token, toToken: Token): boolean => {
    return fromToken.address === "0xAVAX" && toToken.address === WAVAX_ADDRESS;
  },

  // Check if operation is unwrapping WAVAX -> AVAX
  isUnwrapping: (fromToken: Token, toToken: Token): boolean => {
    return fromToken.address === WAVAX_ADDRESS && toToken.address === "0xAVAX";
  },

  // Check if operation is any wrap operation (wrap or unwrap)
  isWrapOperation: (fromToken: Token, toToken: Token): boolean => {
    return (
      WrapUtils.isWrapping(fromToken, toToken) ||
      WrapUtils.isUnwrapping(fromToken, toToken)
    );
  },

  // Get the amount to use for wrap operations (both use same decimals - 18)
  getWrapAmount: (
    fromAmount: BN,
    toAmount: BN,
    isFromAmountExact: boolean
  ): BN => {
    return isFromAmountExact ? fromAmount : toAmount;
  },

  // Handle wrap operation execution
  executeWrapOperation: async (
    fromToken: Token,
    toToken: Token,
    accountAddress: string,
    amount: BN
  ): Promise<{ success: boolean; txHash?: string }> => {
    if (WrapUtils.isWrapping(fromToken, toToken)) {
      return await createWrapAvaxTransaction(accountAddress, amount);
    } else if (WrapUtils.isUnwrapping(fromToken, toToken)) {
      return await createUnwrapAvaxTransaction(accountAddress, amount);
    }
    throw new Error("Not a wrap operation");
  },

  // Check if token needs allowance (AVAX doesn't need allowance)
  needsAllowance: (tokenAddress: string): boolean => {
    return tokenAddress !== "0xAVAX";
  },
};
