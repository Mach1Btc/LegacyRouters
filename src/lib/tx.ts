import { waitForTransactionReceipt } from "@wagmi/core";
import { web3Config } from "@/context/Web3Context";

export const waitForWagmiTxReceipt = async (txHash: `0x${string}`) => {
  try {
    const receipt = await waitForTransactionReceipt(web3Config, {
      hash: txHash,
      confirmations: 1,
    });

    return receipt;
  } catch (error) {
    try {
      const receipt = await waitForTransactionReceipt(web3Config, {
        hash: txHash,
        confirmations: 1,
      });

      return receipt;
    } catch (error) {
      console.error("Failed to wait for receipt:", error);
      throw error;
    }
  }
};
