import { useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { FaChevronDown, FaCog } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader, SlippageInput, TokenSearchChooser } from '@/components/shared';
import { Separator } from '@/components/ui/separator';
import { Switch } from "@/components/ui/switch"
import BN from 'bn.js';
import { defaultSlippage, explorer_url, LFJ_ROUTER_ADDRESS, safeModeEnabledMaxSlippage, sample_token_list, WAVAX_ADDRESS } from '@/lib/constants';
import { Token, TokenList } from '@/lib/types';
import { formatBN, scaleToBN } from '@/lib/utils';
import { useUserContext } from '@/context/AuthContext';
import { approveERC20Amount, getERC20Allowance, importNewERC20Token } from '@/lib/ERC20';
import { toast } from "sonner"
import { createUnwrapAvaxTransaction, createWrapAvaxTransaction } from '@/lib/WAVAX';
import { createSwapTransaction, getAmountIn, getAmountOut } from '@/lib/LFJ';


const LFJSwapPanel = () => {

    const { account, isConnected, update, refresh } = useUserContext();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [tokenList,] = useState<TokenList>(sample_token_list);

    const { openConnectModal } = useConnectModal();

    const [fromToken, setFromToken] = useState<Token>(tokenList["0xAVAX"]);
    const [lastFromToken, setLastFromToken] = useState<Token>(fromToken);
    const [fromAmount, setFromAmount] = useState<BN>(new BN(0));
    const [fromAmountInputValue, setFromAmountInputValue] = useState<string>('');
    const [fromTokenAllowance, setFromTokenAllowance] = useState<BN>(new BN(0));
    const [fromBalance, setFromTokenBalance] = useState<BN>(new BN(0));

    const [toToken, setToToken] = useState<Token>(tokenList["0x152b9d0FdC40C096757F570A51E494bd4b943E50"]);
    const [lastToToken, setLastToToken] = useState<Token>(toToken);
    const [toAmount, setToAmount] = useState<BN>(new BN(0));
    const [toAmountInputValue, setToAmountInputValue] = useState<string>('');
    const [toBalance, setToTokenBalance] = useState<BN>(new BN(0));

    const [amountOutComputed, setAmountOutComputed] = useState<BN>(new BN(0));
    const [amountInComputed, setAmountInComputed] = useState<BN>(new BN(0));

    const [wasFromLastChanged, setWasFromLastChanged] = useState<boolean>(true);

    const [isFromAmountExact, setIsFromAmountExact] = useState<boolean>(true);

    const [allowedSlippage, setAllowedSlippage] = useState<number>(defaultSlippage);
    const [safeModeEnabled, setSafeModeEnabled] = useState<boolean>(true);
    const [hasWarned, setHasWarned] = useState<boolean>(false);

    const [extraSettingsOpen, setExtraSettingsOpen] = useState<boolean>(false);
    const [supportFeeTokens, setSupportFeeTokens] = useState<boolean>(false);

    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    //const [pairExists, setPairExists] = useState<boolean>(true);

    const clearPanel = () => {
        setFromAmountInputValue('');
        setToAmountInputValue('');
    }

    const handleFromInputChange = (value: string) => {
        setIsLoading(true);
        setToAmount(new BN(0));
        if (!isNaN(Number(value)) || value === '') {
            setFromAmountInputValue(value);
            if (value === '') {
                setFromAmount(new BN(0));
                setToAmountInputValue('');
                setIsLoading(false);
                return;
            }
            setIsFromAmountExact(true);
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        const newTimer = setTimeout(async () => {
            if (!isNaN(Number(value)) && value !== '') {
                setFromAmount(scaleToBN(value, fromToken.decimals));
            }
        }, 1000);

        setDebounceTimer(newTimer);
    };

    const handleToInputChange = (value: string) => {
        setIsLoading(true);
        setFromAmount(new BN(0));
        if (!isNaN(Number(value)) || value === '') {
            setToAmountInputValue(value);
            if (value === '') {
                setToAmount(new BN(0));
                setFromAmountInputValue('');
                setIsLoading(false);
                return;
            }
            setIsFromAmountExact(false);
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        const newTimer = setTimeout(async () => {
            if (!isNaN(Number(value)) && value !== '') {
                setToAmount(scaleToBN(value, toToken.decimals));
            }
        }, 1000);

        setDebounceTimer(newTimer);
    };


    const switchToAndFrom = () => {
        const tempToToken = toToken;
        const tempLastToToken = lastToToken;
        setToToken(fromToken);
        setLastToToken(lastFromToken);
        setFromToken(tempToToken);
        setLastFromToken(tempLastToToken);
    };

    const onFromTokenChange = (value: Token) => {
        setLastFromToken(fromToken);
        setFromToken(value);
        setWasFromLastChanged(true);
    }

    const onToTokenChange = (value: Token) => {
        setLastToToken(toToken);
        setToToken(value);
        setWasFromLastChanged(false);
    };

    const handleSwapButtonClick = async (): Promise<void> => {
        // Early return if wallet not connected
        if (!account.address) {
            toast.error("Please connect your wallet to swap tokens.");
            return;
        }

        // Early return if no amounts to swap
        if (fromAmount.isZero() && toAmount.isZero()) {
            return;
        }

        const isUnwrapping = fromToken.address === WAVAX_ADDRESS && toToken.address === "0xAVAX";
        const isWrapping = fromToken.address === "0xAVAX" && toToken.address === WAVAX_ADDRESS;
        const isWrapOperation = isWrapping || isUnwrapping;

        // Calculate required allowance for approval check
        const requiredAllowance = isFromAmountExact
            ? fromAmount
            : amountInComputed.mul(new BN(100 + allowedSlippage)).div(new BN(100));

        const hasEnoughAllowance = isWrapOperation || fromTokenAllowance.gte(requiredAllowance);

        setIsLoading(true);

        try {
            if (hasEnoughAllowance) {
                await executeSwap(isWrapping, isUnwrapping, account.address);
            } else {
                await approveTokens(requiredAllowance);
            }
        } finally {
            setIsLoading(false);
            update();
        }
    };

    // Helper function for executing the actual swap
    const executeSwap = async (isWrapping: boolean, isUnwrapping: boolean, accountAddress: string): Promise<void> => {
        let result: { success: boolean; txHash?: string };

        if (isWrapping) {
            result = await createWrapAvaxTransaction(accountAddress, fromAmount);
        } else if (isUnwrapping) {
            result = await createUnwrapAvaxTransaction(accountAddress, fromAmount);
        } else if (isFromAmountExact) {
            result = await createSwapTransaction(
                accountAddress,
                fromToken.address,
                toToken.address,
                true,
                fromAmount,
                amountOutComputed,
                allowedSlippage,
                supportFeeTokens
            );
        } else {
            result = await createSwapTransaction(
                accountAddress,
                fromToken.address,
                toToken.address,
                false,
                amountInComputed,
                toAmount,
                allowedSlippage,
                supportFeeTokens
            );
        }

        handleTransactionResult(result, "Swap");
    };

    // Helper function for token approval
    const approveTokens = async (requiredAllowance: any): Promise<void> => {
        const result = await approveERC20Amount(
            LFJ_ROUTER_ADDRESS,
            fromToken.address,
            requiredAllowance
        );

        if (result.success) {
            setFromTokenAllowance(requiredAllowance);
        }

        handleTransactionResult(result, "Token approval");
    };

    // Helper function for consistent transaction result handling
    const handleTransactionResult = (
        result: { success: boolean; txHash?: string },
        operation: "Swap" | "Token approval"
    ): void => {
        const createExplorerLink = (txHash: string) => (
            <a
                href={`${explorer_url}/tx/${txHash}`}
                target="_blank"
                style={{ textDecoration: "underline" }}
            >
                View on Snowtrace
            </a>
        );

        if (result.success) {
            const message = operation === "Swap" ? "Swap executed" : "Approved tokens for swap";
            const explorerLink = result.txHash ? createExplorerLink(result.txHash) : null;

            toast.success(
                <span>
                    {message} {explorerLink}
                </span>
            );

            if (operation === "Swap") {
                clearPanel();
            }
        } else {
            const message = operation === "Swap" ? "Swap failed" : "Failed to approve tokens";
            const explorerLink = result.txHash ? createExplorerLink(result.txHash) : null;

            toast.error(
                <span>
                    {message}
                    {explorerLink && (
                        <>
                            {" "}
                            {explorerLink}
                        </>
                    )}
                </span>
            );
        }
    };

    const handleTokenImport = async (address: string) => {
        console.log("Import Token: ", address);
        const retrivedToken = await importNewERC20Token(address);
        return retrivedToken;
    }

    useEffect(() => {
        // if to or from token changed to same token, force update using last token
        if (fromToken === toToken) {
            if (wasFromLastChanged) {
                setLastToToken(toToken);
                setToToken(lastFromToken);
            } else {
                setLastFromToken(fromToken);
                setFromToken(lastToToken);
            }
        }
    }, [fromToken, toToken]);

    useEffect(() => {
        if (safeModeEnabled) {
            if (allowedSlippage > safeModeEnabledMaxSlippage) {
                setAllowedSlippage(safeModeEnabledMaxSlippage);
            }
        }
    }, [safeModeEnabled]);

    useEffect(() => {
        const isWrapping = fromToken.address === "0xAVAX" && toToken.address === WAVAX_ADDRESS;
        const isUnwrapping = toToken.address === "0xAVAX" && fromToken.address === WAVAX_ADDRESS;
        const getOutputAmount = async () => {
            if ((isWrapping || isUnwrapping) && fromAmount.gt(new BN(0))) {
                setToAmountInputValue(formatBN(fromAmount, 18)); // always 18 for WAVAX or AVAX
                setAmountOutComputed(fromAmount);
            } else if (fromAmount.gt(new BN(0))) {
                const amountOut = await getAmountOut(fromToken.address === "0xAVAX" ? WAVAX_ADDRESS.toString() : fromToken.address, toToken.address === "0xAVAX" ? WAVAX_ADDRESS.toString() : toToken.address, fromAmount);
                if (amountOut !== null) {
                    setToAmountInputValue(formatBN(amountOut, toToken.decimals));
                    setAmountOutComputed(amountOut);
                }
            } else {
                setToAmount(new BN(0));
                return;
            }
            setIsLoading(false);
        };
        if (isFromAmountExact) {
            getOutputAmount();
        }
    }, [fromAmount, toToken, fromToken]);

    useEffect(() => {
        const isWrapping = fromToken.address === "0xAVAX" && toToken.address === WAVAX_ADDRESS;
        const isUnwrapping = toToken.address === "0xAVAX" && fromToken.address === WAVAX_ADDRESS;
        const getInAmount = async () => {
            if ((isWrapping || isUnwrapping) && toAmount.gt(new BN(0))) {
                setFromAmountInputValue(formatBN(toAmount, 18)); // always 18 for WAVAX or AVAX
                setAmountInComputed(toAmount);
            } else if (toAmount.gt(new BN(0))) {
                const amountIn = await getAmountIn(fromToken.address === "0xAVAX" ? WAVAX_ADDRESS.toString() : fromToken.address, toToken.address === "0xAVAX" ? WAVAX_ADDRESS.toString() : toToken.address, toAmount);
                if (amountIn !== null) {
                    setFromAmountInputValue(formatBN(amountIn, fromToken.decimals));
                    setAmountInComputed(amountIn);
                }
            } else {
                setFromAmount(new BN(0));
                return;
            }
            setIsLoading(false);
        };
        if (!isFromAmountExact) {
            getInAmount();
        }
    }, [toAmount, toToken, fromToken]);

    useEffect(() => {
        const getFromTokenAllowance = async () => {
            if (!account.address) return;
            if (fromToken.address !== "0xAVAX" && fromAmount.gt(new BN(0))) {
                const allowance = await getERC20Allowance(account.address, LFJ_ROUTER_ADDRESS, fromToken.address);
                if (allowance !== null) {
                    setFromTokenAllowance(allowance);
                }
            } else if (fromToken.address === "0xAVAX") {
                setFromTokenAllowance(new BN("720000000000000000000000000"));
            }
        };
        getFromTokenAllowance();
    }, [account, fromAmount, fromToken, refresh]);

    useEffect(() => {
        if (account.balances) {
            if (account.balances[fromToken.address.toLowerCase()]) {
                setFromTokenBalance(account.balances[fromToken.address.toLowerCase()]);
            }
        }
    }, [fromToken, account.balances]);

    useEffect(() => {
        if (account.balances) {
            if (account.balances[toToken.address.toLowerCase()]) {
                setToTokenBalance(account.balances[toToken.address.toLowerCase()]);
            }
        }
    }, [toToken, account.balances]);

    useEffect(() => {
        if (!safeModeEnabled && !hasWarned) {
            toast.warning("Safe Mode is disabled. Please use with caution.");
            setHasWarned(true);
        }
    }, [safeModeEnabled]);

    return (
        <div className='flex flex-col gap-1 items-center justify-start'>
            <div>
                <Card className='card w-[540px] shadow-2xl mb-10'>
                    <CardContent className='p-4'>
                        <div className='flex-1 flex flex-col px-3'>
                            <div className='flex-1 flex flex-row p-2 pb-0 items-center'>
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    className='bg-white no-arrows mr-2 border-0 text-2xl'
                                    autoComplete="off"
                                    value={fromAmountInputValue}
                                    onChange={(e) => handleFromInputChange(e.target.value)}
                                />
                                <TokenSearchChooser startSelected={fromToken} available={tokenList} onSelection={onFromTokenChange} onImport={handleTokenImport} />
                            </div>
                            <div className="p-2 pt-0 text-xxs font-semibold hover:cursor-pointer">
                                <p
                                    onClick={() => {
                                        setFromAmount(fromBalance);
                                        setFromAmountInputValue(formatBN(fromBalance, fromToken.decimals));
                                    }}
                                    className='ml-2'>{`wallet: ${Number(formatBN(fromBalance, fromToken.decimals)).toLocaleString()}`}</p>
                            </div>
                            <div className='relative'>
                                <Separator className='my-4 seperator' />
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer"
                                    onClick={switchToAndFrom}
                                >
                                    <FaChevronDown className="text-gray-400 text-xl pt-1" />
                                </div>
                            </div>
                            <div className='flex-1 flex flex-row p-2 items-center'>
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    className='bg-white no-arrows mr-2 border-0 text-2xl'
                                    autoComplete="off"
                                    value={toAmountInputValue}
                                    onChange={(e) => handleToInputChange(e.target.value)}
                                />
                                <TokenSearchChooser startSelected={toToken} available={tokenList} onSelection={onToTokenChange} onImport={handleTokenImport} />
                            </div>
                            <div className="p-2 pt-0 text-xxs font-semibold">
                                <p className='ml-2'>{`wallet: ${Number(formatBN(toBalance, toToken.decimals)).toLocaleString()}`}</p>
                            </div>
                            <div className='w-full p-2 flex flex-row justify-between'>
                                <div className='flex flex-row items-center'>
                                    <Popover open={extraSettingsOpen} onOpenChange={setExtraSettingsOpen}>
                                        <PopoverTrigger asChild>
                                            <FaCog className='text-gray-400 text-sm ml-1 hover:cursor-pointer' />
                                        </PopoverTrigger>
                                        <PopoverContent align='start' alignOffset={-10} side='bottom' sideOffset={14} className='bg-white border-0 shadow-lg duration-300'>
                                            <div className='flex flex-col gap-2 bg-white items-center justify-center'>
                                                <div className='flex flex-row gap-2 items-center justify-between'>
                                                    <Switch
                                                        className={supportFeeTokens ? "bg-cash-green" : "bg-error-red"}
                                                        checked={supportFeeTokens}
                                                        onCheckedChange={setSupportFeeTokens} />
                                                    <span> Support Fee/Reflection Tokens</span>
                                                </div>

                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <div className='flex safemode-toggle items-center justify-center mx-1'>Safe Mode </div>
                                    <Switch
                                        className={safeModeEnabled ? "bg-cash-green" : "bg-error-red"}
                                        checked={safeModeEnabled}
                                        onCheckedChange={setSafeModeEnabled} />
                                </div>
                                <div className='flex flex-row justify-center items-center'>
                                    <div className='flex slippage-input items-center justify-center mr-1'>Slippage </div>
                                    <SlippageInput allowedSlippage={allowedSlippage} setAllowedSlippage={setAllowedSlippage} safeModeEnabled={safeModeEnabled} />
                                </div>
                            </div>
                            <div className='w-full p-2'>
                                <Button
                                    disabled={isLoading || fromAmount.isZero() || fromAmount.gt(fromBalance)}
                                    className="swap-button"
                                    onClick={() => {
                                        if (isConnected) {
                                            handleSwapButtonClick();
                                        } else if (openConnectModal) {
                                            openConnectModal();
                                        }
                                    }}
                                >
                                    {isLoading ? (
                                        <div className="flex w-full items-center justify-center">
                                            <Loader />
                                        </div>

                                    ) : isConnected && account.address ? fromAmount.gt(fromBalance) ? ("Exceeds Balance") : (
                                        (fromTokenAllowance.gte(fromAmount) && isFromAmountExact) ||
                                            (fromTokenAllowance.gte(amountInComputed.mul(new BN(10000 + (allowedSlippage * 100))).div(new BN(10000))) && !isFromAmountExact) ? (
                                            "Swap"
                                        ) : (
                                            "Approve"
                                        )
                                    ) : (
                                        "Connect"
                                    )}
                                </Button>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </div>

        </div >
    )
}

export default LFJSwapPanel