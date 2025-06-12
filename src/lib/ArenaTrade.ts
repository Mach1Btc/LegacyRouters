import { readContract, writeContract } from "@wagmi/core";
import BN from "bn.js";
import {
  ARENA_TRADE_ROUTER_ADDRESS,
  ARENA_TRADE_ROUTER_ABI,
  ARENA_TRADE_FACTORY_ADDRESS,
  ARENA_TRADE_FACTORY_ABI,
  ARENA_TRADE_PAIR_ABI,
  WAVAX_ADDRESS,
} from "@/lib/constants";
import { web3Config } from "@/context/Web3Context";
import { waitForWagmiTxReceipt } from "./tx";

const DEADLINE_SECONDS = 300;

export async function createSwapTransaction(
  accountAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  isFromExact: boolean,
  amountIn: BN,
  amountOut: BN,
  slippage: number,
  supportFee: boolean
): Promise<{
  success: boolean;
  txHash?: string;
  error?: unknown;
}> {
  const now = Math.floor(Date.now() / 1000);
  const deadline = now + DEADLINE_SECONDS;

  try {
    let method: string;
    let args: any[];
    let value = undefined;

    if (isFromExact) {
      const amountOutMin = amountOut.muln(100 - slippage).divn(100);

      if (tokenInAddress === "0xAVAX") {
        method = supportFee
          ? "swapExactAVAXForTokensSupportingFeeOnTransferTokens"
          : "swapExactAVAXForTokens";
        args = [
          amountOutMin.toString(),
          [WAVAX_ADDRESS, tokenOutAddress],
          accountAddress,
          deadline,
        ];
        value = amountIn.toString();
      } else if (tokenOutAddress === "0xAVAX") {
        method = supportFee
          ? "swapExactTokensForAVAXSupportingFeeOnTransferTokens"
          : "swapExactTokensForAVAX";
        args = [
          amountIn.toString(),
          "0",
          [tokenInAddress, WAVAX_ADDRESS],
          accountAddress,
          deadline,
        ];
      } else {
        method = supportFee
          ? "swapExactTokensForTokensSupportingFeeOnTransferTokens"
          : "swapExactTokensForTokens";
        args = [
          amountIn.toString(),
          amountOutMin.toString(),
          [tokenInAddress, tokenOutAddress],
          accountAddress,
          deadline,
        ];
      }
    } else {
      const amountInMax = amountIn.muln(100 + slippage).divn(100);

      if (tokenInAddress === "0xAVAX") {
        method = "swapAVAXForExactTokens";
        args = [
          amountOut.toString(),
          [WAVAX_ADDRESS, tokenOutAddress],
          accountAddress,
          deadline,
        ];
        value = amountInMax.toString();
      } else if (tokenOutAddress === "0xAVAX") {
        method = "swapTokensForExactAVAX";
        args = [
          amountOut.toString(),
          amountInMax.toString(),
          [tokenInAddress, WAVAX_ADDRESS],
          accountAddress,
          deadline,
        ];
      } else {
        method = "swapTokensForExactTokens";
        args = [
          amountOut.toString(),
          amountInMax.toString(),
          [tokenInAddress, tokenOutAddress],
          accountAddress,
          deadline,
        ];
      }
    }

    const txHash = await writeContract(web3Config, {
      address: ARENA_TRADE_ROUTER_ADDRESS,
      abi: ARENA_TRADE_ROUTER_ABI,
      functionName: method,
      args,
      ...(value ? { value: BigInt(value) } : {}),
    });

    const receipt = await waitForWagmiTxReceipt(txHash);

    if (receipt.status === "success") {
      return { success: true, txHash };
    } else {
      return { success: false, txHash };
    }
  } catch (error) {
    console.error("Swap transaction error:", error);
    return { success: false, error };
  }
}

export const getAmountOut = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  tokenInAmount: BN
): Promise<BN | null> => {
  let amountOut: BN | null = null;
  const tokens = [tokenInAddress, tokenOutAddress].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  try {
    // Get pair address from factory
    const pairContractAddress = await readContract(web3Config, {
      address: ARENA_TRADE_FACTORY_ADDRESS as `0x${string}`,
      abi: ARENA_TRADE_FACTORY_ABI,
      functionName: "getPair",
      args: [tokenInAddress, tokenOutAddress],
    });

    if (
      !pairContractAddress ||
      pairContractAddress === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Error: getAmountOut() could not retrieve pair address!");
    }

    const pairAddress = pairContractAddress.toString();

    // Get reserves from pair contract
    const reserveResult = await readContract(web3Config, {
      address: pairAddress as `0x${string}`,
      abi: ARENA_TRADE_PAIR_ABI,
      functionName: "getReserves",
    });

    if (
      !reserveResult ||
      !Array.isArray(reserveResult) ||
      reserveResult.length < 3
    ) {
      throw new Error(
        "Error: getAmountOut() could not retrieve pair reserves!"
      );
    }

    const reserve0 = new BN(reserveResult[0].toString());
    const reserve1 = new BN(reserveResult[1].toString());
    //const last = Number(reserveResult[2]);

    // Determine which reserve is for which token
    let reserveIn: BN, reserveOut: BN;
    if (tokens[0].toLowerCase() === tokenInAddress.toLowerCase()) {
      reserveIn = reserve0;
      reserveOut = reserve1;
    } else {
      reserveIn = reserve1;
      reserveOut = reserve0;
    }

    // Get quote from router
    const quoteResult = await readContract(web3Config, {
      address: ARENA_TRADE_ROUTER_ADDRESS as `0x${string}`,
      abi: ARENA_TRADE_ROUTER_ABI,
      functionName: "getAmountOut",
      args: [
        tokenInAmount.toString(),
        reserveIn.toString(),
        reserveOut.toString(),
      ],
    });

    if (quoteResult) {
      amountOut = new BN(quoteResult.toString());
    } else {
      throw new Error("Error: getAmountOut() could not retrieve quote!");
    }
  } catch (error) {
    console.log(error);
  }

  return amountOut;
};

export const getAmountIn = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  tokenOutAmount: BN
): Promise<BN | null> => {
  let amountIn: BN | null = null;
  const tokens = [tokenInAddress, tokenOutAddress].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  try {
    // Get pair address from factory
    const pairContractAddress = await readContract(web3Config, {
      address: ARENA_TRADE_FACTORY_ADDRESS as `0x${string}`,
      abi: ARENA_TRADE_FACTORY_ABI,
      functionName: "getPair",
      args: [tokenInAddress, tokenOutAddress],
    });

    if (
      !pairContractAddress ||
      pairContractAddress === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error("Error: getAmountIn() could not retrieve pair address!");
    }

    const pairAddress = pairContractAddress.toString();

    // Get reserves from pair contract
    const reserveResult = await readContract(web3Config, {
      address: pairAddress as `0x${string}`,
      abi: ARENA_TRADE_PAIR_ABI,
      functionName: "getReserves",
    });

    if (
      !reserveResult ||
      !Array.isArray(reserveResult) ||
      reserveResult.length < 3
    ) {
      throw new Error("Error: getAmountIn() could not retrieve pair reserves!");
    }

    const reserve0 = new BN(reserveResult[0].toString());
    const reserve1 = new BN(reserveResult[1].toString());
    //const last = Number(reserveResult[2]);

    // Determine which reserve is for which token
    let reserveIn: BN, reserveOut: BN;
    if (tokens[0].toLowerCase() === tokenInAddress.toLowerCase()) {
      reserveIn = reserve0;
      reserveOut = reserve1;
    } else {
      reserveIn = reserve1;
      reserveOut = reserve0;
    }

    // Get quote from router
    const quoteResult = await readContract(web3Config, {
      address: ARENA_TRADE_ROUTER_ADDRESS as `0x${string}`,
      abi: ARENA_TRADE_ROUTER_ABI,
      functionName: "getAmountIn",
      args: [
        tokenOutAmount.toString(),
        reserveIn.toString(),
        reserveOut.toString(),
      ],
    });

    if (quoteResult) {
      amountIn = new BN(quoteResult.toString());
    } else {
      throw new Error("Error: getAmountIn() could not retrieve quote!");
    }
  } catch (error) {
    console.log(error);
  }

  return amountIn;
};

export const getPairAddressFor = async (
  tokenInAddress: string,
  tokenOutAddress: string
): Promise<string | null> => {
  try {
    // Get pair address from factory
    const pairContractAddress = await readContract(web3Config, {
      address: ARENA_TRADE_FACTORY_ADDRESS as `0x${string}`,
      abi: ARENA_TRADE_FACTORY_ABI,
      functionName: "getPair",
      args: [tokenInAddress, tokenOutAddress],
    });

    if (
      !pairContractAddress ||
      pairContractAddress === "0x0000000000000000000000000000000000000000"
    ) {
      return null;
    }

    return pairContractAddress.toString();
  } catch (error) {
    console.error("Error getting pair address:", error);
    return null;
  }
};
