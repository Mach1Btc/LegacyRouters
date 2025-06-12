import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    RainbowKitProvider,
    getDefaultConfig,
    lightTheme,
    darkTheme
} from "@rainbow-me/rainbowkit";
import {
    rainbowWallet,
    metaMaskWallet,
    coinbaseWallet,
    trustWallet,
    ledgerWallet,
    coreWallet,
    rabbyWallet,
    braveWallet
} from "@rainbow-me/rainbowkit/wallets";
import { avalanche } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    createStorage,
    WagmiProvider,
    Config,
    createConfig,
    http,
} from "wagmi";

interface BaseStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export const noopStorage: BaseStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};

export const storage =
    typeof window !== "undefined" && window.localStorage
        ? createStorage({
            key: `avaxLegacyRouters-43114`,
            storage: window.localStorage,
        })
        : null;

export const web3Config = createConfig({
    chains: [avalanche],
    transports: {
        [avalanche.id]: http(),
    },
    storage,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<Config | null>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const config = getDefaultConfig({
            appName: "Avalanche Legacy Routers",
            projectId: "ALR-43114",
            wallets: [
                {
                    groupName: "Most used",
                    wallets: [rabbyWallet, coreWallet, metaMaskWallet],
                },
                {
                    groupName: "Other",
                    wallets: [
                        braveWallet,
                        coinbaseWallet,
                        trustWallet,
                        ledgerWallet,
                        rainbowWallet
                    ],
                },
            ],
            chains: [avalanche],
            transports: {
                [avalanche.id]: http("https://avalanche-c-chain-rpc.publicnode.com"),
            },
            storage,
        });

        setConfig(config);
    }, []);

    const queryClient = new QueryClient();

    if (!config) return null;

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize="compact" theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
