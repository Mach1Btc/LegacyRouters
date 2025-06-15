import { useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { FaChevronDown, FaCog } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader, SlippageInput, SwapInfo, TokenSearchChooser } from '@/components/shared';
import { Separator } from '@/components/ui/separator';
import { Switch } from "@/components/ui/switch"
import BN from 'bn.js';
import { defaultSlippage, explorer_url, ARENA_TRADE_ROUTER_ADDRESS, safeModeEnabledMaxSlippage, WAVAX_ADDRESS } from '@/lib/constants';
import { Token } from '@/lib/types';
import { formatBN, scaleToBN } from '@/lib/utils';
import { useUserContext } from '@/context/AuthContext';
import { approveERC20Amount, getERC20Allowance, importNewERC20Token } from '@/lib/ERC20';
import { toast } from "sonner"
import { WrapUtils } from '@/lib/WAVAX';
import { createSwapTransaction, getAmountIn, getAmountOut, getPairAddressFor } from '@/lib/ArenaTrade';


const ArenaSwapPanel = () => {

    const {
        account,
        isConnected,
        tokenList,
        update,
        refresh,
        fromToken,
        setFromToken,
        toToken,
        setToToken,
        lastFromToken,
        setLastFromToken,
        lastToToken,
        setLastToToken,
        wasFromLastChanged,
        setWasFromLastChanged } = useUserContext();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { openConnectModal } = useConnectModal();

    const [fromAmount, setFromAmount] = useState<BN>(new BN(0));
    const [fromAmountInputValue, setFromAmountInputValue] = useState<string>('');
    const [fromTokenAllowance, setFromTokenAllowance] = useState<BN>(new BN(0));
    const [fromBalance, setFromTokenBalance] = useState<BN>(new BN(0));

    const [toAmount, setToAmount] = useState<BN>(new BN(0));
    const [toAmountInputValue, setToAmountInputValue] = useState<string>('');
    const [toBalance, setToTokenBalance] = useState<BN>(new BN(0));

    const [amountOutComputed, setAmountOutComputed] = useState<BN>(new BN(0));
    const [amountInComputed, setAmountInComputed] = useState<BN>(new BN(0));

    const [isFromAmountExact, setIsFromAmountExact] = useState<boolean>(true);

    const [allowedSlippage, setAllowedSlippage] = useState<number>(defaultSlippage);
    const [safeModeEnabled, setSafeModeEnabled] = useState<boolean>(true);
    const [hasWarned, setHasWarned] = useState<boolean>(false);

    const [extraSettingsOpen, setExtraSettingsOpen] = useState<boolean>(false);
    const [supportFeeTokens, setSupportFeeTokens] = useState<boolean>(false);

    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const [pairMap, setPairMap] = useState<Map<string, string>>(new Map());
    const [currentPairExists, setCurrentPairExists] = useState<boolean>(true);
    const [currentPairAddress, setCurrentPairAddress] = useState<string>('');

    const clearPanel = () => {
        setFromAmountInputValue('');
        setToAmountInputValue('');
        setFromAmount(new BN(0));
        setToAmount(new BN(0));
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
        setFromTokenAllowance(new BN(0));
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
        if (!account.address) {
            toast.error("Please connect your wallet to swap tokens.");
            return;
        }

        if (fromAmount.isZero() && toAmount.isZero()) {
            return;
        }

        const isWrapOperation = WrapUtils.isWrapOperation(fromToken, toToken);

        const requiredAllowance = isFromAmountExact
            ? fromAmount
            : amountInComputed.mul(new BN(100 + allowedSlippage)).div(new BN(100));

        const hasEnoughAllowance = isWrapOperation || fromTokenAllowance.gte(requiredAllowance);

        setIsLoading(true);

        try {
            if (hasEnoughAllowance) {
                await executeSwap(isWrapOperation, account.address);
            } else {
                await approveTokens(requiredAllowance);
            }
        } finally {
            setIsLoading(false);
            update();
        }
    };

    // Helper function for executing the actual swap
    const executeSwap = async (isWrapOperation: boolean, accountAddress: string): Promise<void> => {
        let result: { success: boolean; txHash?: string };

        if (isWrapOperation) {
            const amount = WrapUtils.getWrapAmount(fromAmount, toAmount, isFromAmountExact);
            result = await WrapUtils.executeWrapOperation(fromToken, toToken, accountAddress, amount);
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
            ARENA_TRADE_ROUTER_ADDRESS,
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

    const generatePairKey = (tokenA: string, tokenB: string): string => {
        // Sort addresses to ensure consistent key regardless of order
        const sortedTokens = [tokenA.toLowerCase(), tokenB.toLowerCase()].sort();
        return `${sortedTokens[0]},${sortedTokens[1]}`;
    };

    const checkAndCachePairAddress = async (tokenInAddress: string, tokenOutAddress: string): Promise<void> => {
        const adjustedTokenIn = WrapUtils.normalizeAddress(tokenInAddress);
        const adjustedTokenOut = WrapUtils.normalizeAddress(tokenOutAddress);

        const pairKey = generatePairKey(adjustedTokenIn, adjustedTokenOut);

        if (pairMap.has(pairKey)) {
            const cachedAddress = pairMap.get(pairKey)!;
            setCurrentPairAddress(cachedAddress);
            setCurrentPairExists(cachedAddress !== '');
            return;
        }

        const fetchedPairAddress = await getPairAddressFor(adjustedTokenIn, adjustedTokenOut);
        const pairExists = fetchedPairAddress !== null;
        const addressToStore = pairExists ? fetchedPairAddress : '';

        setPairMap(prev => new Map(prev.set(pairKey, addressToStore)));
        setCurrentPairAddress(addressToStore);
        setCurrentPairExists(pairExists);
    };

    const getRequiredAllowance = () => {
        if (isFromAmountExact) {
            return fromAmount;
        } else {
            return amountInComputed.mul(new BN(10000 + (allowedSlippage * 100))).div(new BN(10000));
        }
    };

    const requiredAllowance = getRequiredAllowance();
    const hasEnoughAllowance = fromTokenAllowance.gte(requiredAllowance);

    const getButtonText = () => {
        if (isLoading) return <div className="flex w-full items-center justify-center"><Loader /></div>;
        if (!currentPairExists) return "Pair Not Found";
        if (!isConnected || !account.address) return "Connect";

        const exceedsBalance = (!isFromAmountExact && amountInComputed.gt(fromBalance)) ||
            (isFromAmountExact && fromAmount.gt(fromBalance));
        if (exceedsBalance) return "Exceeds Balance";

        const isWrapOperation = WrapUtils.isWrapOperation(fromToken, toToken);
        if (hasEnoughAllowance || isWrapOperation) return "Swap";

        return "Approve";
    };

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
        const getOutputAmount = async () => {
            if (WrapUtils.isWrapOperation(fromToken, toToken) && fromAmount.gt(new BN(0))) {
                setToAmountInputValue(formatBN(fromAmount, 18)); // WAVAX/AVAX always 18 decimals
                setAmountOutComputed(fromAmount);
            } else if (fromAmount.gt(new BN(0))) {
                const adjustedFromAddress = WrapUtils.normalizeAddress(fromToken.address);
                const adjustedToAddress = WrapUtils.normalizeAddress(toToken.address);

                const amountOut = await getAmountOut(adjustedFromAddress, adjustedToAddress, fromAmount);
                if (amountOut !== null) {
                    setToAmountInputValue(formatBN(amountOut, toToken.decimals));
                    setAmountOutComputed(amountOut);
                }
            } else {
                setToAmount(new BN(0));
                setToAmountInputValue('');
                setAmountOutComputed(new BN(0));
                setIsLoading(false);
            }
            setIsLoading(false);
        };

        if (isFromAmountExact) {
            getOutputAmount();
        }
    }, [fromAmount, toToken, fromToken]);

    useEffect(() => {
        const getInAmount = async () => {
            if (WrapUtils.isWrapOperation(fromToken, toToken) && toAmount.gt(new BN(0))) {
                setFromAmountInputValue(formatBN(toAmount, 18)); // WAVAX/AVAX always 18 decimals
                setAmountInComputed(toAmount);
            } else if (toAmount.gt(new BN(0))) {
                const adjustedFromAddress = WrapUtils.normalizeAddress(fromToken.address);
                const adjustedToAddress = WrapUtils.normalizeAddress(toToken.address);

                const amountIn = await getAmountIn(adjustedFromAddress, adjustedToAddress, toAmount);
                if (amountIn !== null) {
                    setFromAmountInputValue(formatBN(amountIn, fromToken.decimals));
                    setAmountInComputed(amountIn);
                }
            } else {
                setFromAmount(new BN(0));
                setFromAmountInputValue('');
                setAmountInComputed(new BN(0));
                setIsLoading(false);
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

            const needsAllowanceCheck = fromAmount.gt(new BN(0)) || amountInComputed.gt(new BN(0));

            if (WrapUtils.needsAllowance(fromToken.address) && needsAllowanceCheck) {
                const allowance = await getERC20Allowance(account.address, ARENA_TRADE_ROUTER_ADDRESS, fromToken.address);
                if (allowance !== null) {
                    setFromTokenAllowance(allowance);
                }
            } else if (!WrapUtils.needsAllowance(fromToken.address)) {
                setFromTokenAllowance(new BN("720000000000000000000000000")); // Large number for AVAX
            }
        };

        getFromTokenAllowance();
    }, [account, fromAmount, amountInComputed, fromToken, refresh]);

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

    useEffect(() => {
        if (WrapUtils.isWrapOperation(fromToken, toToken)) {
            // Wrap/unwrap operations don't need pair checking
            setCurrentPairExists(true);
            setCurrentPairAddress(WAVAX_ADDRESS);
        } else {
            checkAndCachePairAddress(fromToken.address, toToken.address);
        }
    }, [fromToken, toToken, pairMap]);

    return (
        <div className='flex flex-col gap-1 items-center justify-start'>
            <div>
                <Card className='card swap-card'>
                    <CardContent className='swap-card-content'>
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
                            <div className='flex flex-row w-full justify-between items-center'>
                                <div className="p-2 pt-0 text-xxs font-semibold hover:cursor-pointer">
                                    <p
                                        onClick={() => {
                                            setFromAmount(fromBalance);
                                            setFromAmountInputValue(formatBN(fromBalance, fromToken.decimals));
                                        }}
                                        className='ml-2'>{`wallet: ${Number(formatBN(fromBalance, fromToken.decimals)).toLocaleString()}`}</p>
                                </div>
                                <div></div>
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
                            <div className='flex flex-row w-full justify-between items-center'>
                                <div className="p-2 pt-0 text-xxs font-semibold">
                                    <p className='ml-2'>{`wallet: ${Number(formatBN(toBalance, toToken.decimals)).toLocaleString()}`}</p>
                                </div>
                                <div></div>
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
                                    disabled={isConnected && (isLoading ||
                                        (fromAmount.isZero() && toAmount.isZero()) ||
                                        (!isFromAmountExact && amountInComputed.gt(fromBalance)) ||
                                        (isFromAmountExact && fromAmount.gt(fromBalance)) || !currentPairExists)
                                    }
                                    className="arena-swap-button"
                                    onClick={() => {
                                        if (isConnected) {
                                            handleSwapButtonClick();
                                        } else if (openConnectModal) {
                                            openConnectModal();
                                        }
                                    }}
                                >
                                    {getButtonText()}
                                </Button>
                                <SwapInfo routerAddress={ARENA_TRADE_ROUTER_ADDRESS} pairAddress={currentPairExists ? currentPairAddress : undefined} />
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </div>

        </div >
    )
};

export default ArenaSwapPanel;