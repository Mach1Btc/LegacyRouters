import { readContract, writeContract } from "@wagmi/core";
import { ERC20_ABI } from "./constants";
import BN from "bn.js";
import { web3Config } from "@/context/Web3Context";
import { Token } from "./types";
import { waitForWagmiTxReceipt } from "./tx";

export async function getERC20Balance(account: string, tokenAddress: string) {
  try {
    const result = await readContract(web3Config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account],
    });
    return new BN(result?.toString() ?? "0");
  } catch {
    return new BN(0);
  }
}

export async function getERC20Allowance(
  account: string,
  spender: string,
  tokenAddress: string
) {
  try {
    const result = await readContract(web3Config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account, spender],
    });
    return new BN(result?.toString() ?? "0");
  } catch (error) {
    console.log(error);
    return new BN(0);
  }
}

export async function importNewERC20Token(
  tokenAddress: string
): Promise<Token | null> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      readContract(web3Config, {
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "name",
      }) as Promise<string>,

      readContract(web3Config, {
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "symbol",
      }) as Promise<string>,

      readContract(web3Config, {
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "decimals",
      }) as Promise<number>,
    ]);

    return {
      address: tokenAddress.toLowerCase(),
      name,
      ticker: symbol,
      imgUrl: "/assets/icons/question-sign.svg",
      decimals: Number(decimals),
      rank: "9999",
    };
  } catch (error) {
    console.log("Error trying to import token:", error);
    return null;
  }
}

export const approveERC20Amount = async (
  spenderAddress: string,
  tokenAddress: string,
  amount: BN
): Promise<{
  success: boolean;
  txHash?: string;
  error?: unknown;
}> => {
  try {
    const txHash = await writeContract(web3Config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress, amount.toString()],
    });

    console.log("Transaction hash:", txHash);

    const receipt = await waitForWagmiTxReceipt(txHash);

    if (receipt && receipt.status === "success") {
      console.log("Transaction successful:", receipt);
      return { success: true, txHash };
    } else {
      console.error("Transaction failed:", receipt);
      return { success: false, txHash };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: error };
  }
};
