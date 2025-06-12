import { createContext, useContext, useEffect, useState } from "react";
import { getBalance } from "@wagmi/core";
import { useAccount } from "wagmi";
import { web3Config } from "@/context/Web3Context";
import { Account, Token, TokenList } from "@/lib/types";
import BN from "bn.js";
import { default_token_list } from "@/lib/tokenList";
import { getERC20Balance } from "@/lib/ERC20";


export const INITIAL_ACCOUNT = {
    address: null,
    name: null,
    balances: {},
    allowances: {}
}

const INITIAL_STATE = {
    account: INITIAL_ACCOUNT,
    setAccount: () => { },
    isConnected: false,
    setIsConnected: () => { },
    getUserTokenBal: async () => { return null; },
    tokenList: {},
    refresh: 0,
    update: () => { },

    fromToken: default_token_list["0xAVAX"],
    setFromToken: () => { },
    toToken: default_token_list["0x152b9d0FdC40C096757F570A51E494bd4b943E50"],
    setToToken: () => { },
    lastFromToken: default_token_list["0xAVAX"],
    setLastFromToken: () => { },
    lastToToken: default_token_list["0x152b9d0FdC40C096757F570A51E494bd4b943E50"],
    setLastToToken: () => { },
    wasFromLastChanged: true,
    setWasFromLastChanged: () => { },
}

type IContextType = {
    account: Account;
    setAccount: React.Dispatch<React.SetStateAction<Account>>;
    isConnected: boolean;
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
    getUserTokenBal: (address: string) => Promise<BN | null>;
    tokenList: TokenList
    refresh: number;
    update: () => void;

    fromToken: Token;
    setFromToken: React.Dispatch<React.SetStateAction<Token>>;
    toToken: Token;
    setToToken: React.Dispatch<React.SetStateAction<Token>>;
    lastFromToken: Token;
    setLastFromToken: React.Dispatch<React.SetStateAction<Token>>;
    lastToToken: Token;
    setLastToToken: React.Dispatch<React.SetStateAction<Token>>;
    wasFromLastChanged: boolean;
    setWasFromLastChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected: connected } = useAccount();
    // const [isLoading, setIsLoading] = useState(false);
    const [account, setAccount] = useState<Account>(INITIAL_ACCOUNT);
    const [isConnected, setIsConnected] = useState(connected);
    const [tokenList,] = useState<TokenList>(default_token_list);
    const [refresh, setRefresh] = useState(0);

    const [fromToken, setFromToken] = useState<Token>(tokenList["0xAVAX"]);
    const [toToken, setToToken] = useState<Token>(tokenList["0x152b9d0FdC40C096757F570A51E494bd4b943E50"]);
    const [lastFromToken, setLastFromToken] = useState<Token>(fromToken);
    const [lastToToken, setLastToToken] = useState<Token>(toToken);

    const [wasFromLastChanged, setWasFromLastChanged] = useState<boolean>(true);

    const update = () => {
        setRefresh(prev => prev + 1);
    };

    const getUserTokenBal = async (address: string) => {
        if (account.address === null) return new BN(0);
        const result = await getERC20Balance(account.address, address);
        setAccount((prevAccount) => ({
            ...prevAccount,
            balances: {
                ...prevAccount.balances,
                [address.toLowerCase()]: result,
            },
        }));
        return result;
    };

    const getAllUserTokenBals = async () => {
        if (account.address === null) return;
        let accountAddress: string = account.address;
        const balances: { [key: string]: BN } = {};

        try {
            const nativeBalance = await getBalance(web3Config, {
                address: account.address as `0x${string}`,
            });
            balances["0xavax"] = new BN(nativeBalance.value.toString());
        } catch {
            balances["0xavax"] = new BN(0);
        }

        const balancePromises = Object.keys(tokenList)
            .filter(address => address !== "0xAVAX")
            .map(async (address) => {
                const result = await getERC20Balance(accountAddress, address);
                balances[address.toLowerCase()] = result;
            });

        await Promise.all(balancePromises);

        setAccount((prevAccount) => ({
            ...prevAccount,
            balances: {
                ...prevAccount.balances,
                ...balances,
            },
        }));
    };

    useEffect(() => {
        setIsConnected(connected);

        if (connected && address) {
            setAccount((prev) => ({
                ...prev,
                address,
            }));
        } else {
            setAccount(INITIAL_ACCOUNT);
        }
    }, [address, connected]);

    useEffect(() => {
        if (account.address) {
            getAllUserTokenBals();
        }
    }, [account.address, refresh]);

    const value = {
        account,
        setAccount,
        isConnected,
        setIsConnected,
        getUserTokenBal,
        tokenList,
        refresh,
        update,

        fromToken,
        setFromToken,
        toToken,
        setToToken,
        lastFromToken,
        setLastFromToken,
        lastToToken,
        setLastToToken,
        wasFromLastChanged,
        setWasFromLastChanged
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useUserContext = () => useContext(AuthContext);