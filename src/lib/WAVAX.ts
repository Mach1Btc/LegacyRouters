import { writeContract } from "@wagmi/core";
import { WAVAX_ABI, WAVAX_ADDRESS } from "./constants";
import { web3Config } from "@/context/Web3Context";
import BN from "bn.js";
import { waitForWagmiTxReceipt } from "@/lib//tx";

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
