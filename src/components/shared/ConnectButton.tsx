import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { FaChevronDown } from 'react-icons/fa6';
export const ConnectButton = () => {
    return (
        <RainbowConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === 'authenticated');
                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button onClick={openConnectModal} type="button" className='connect-wallet-button'>
                                        <span className='hidden sm:flex'>Connect Wallet</span>
                                        <span className='flex sm:hidden'>Connect</span>
                                    </button>
                                );
                            }
                            if (chain.unsupported) {
                                return (
                                    <button onClick={openChainModal} type="button" className='connect-wallet-button-invalid-network'>
                                        <span className='hidden sm:flex'>Invalid Network</span>
                                        <span className='flex sm:hidden'>!!!</span>
                                        <FaChevronDown />
                                    </button>
                                );
                            }
                            return (
                                <div className='flex flex-row gap-1 sm:gap-2'>
                                    <button
                                        onClick={openChainModal}
                                        style={{ display: 'flex', alignItems: 'center' }}
                                        type="button"
                                        className='connect-network-switch'
                                    >
                                        {chain.hasIcon && (
                                            <div
                                                className={`bg-$(chain.iconBackground) w-[16px] h-[16px] sm:w-[24px] sm:h-[24px] rounded-full overflow-hidden sm:mr-1`}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        className='w-[16px] h-[16px] sm:w-[24px] sm:h-[24px]'

                                                    />
                                                )}
                                            </div>
                                        )}
                                        {/* <span>{chain.name}</span> */}
                                        <FaChevronDown className='hidden sm:flex' />
                                    </button>
                                    <button onClick={openAccountModal} type="button" className="connect-account-display">
                                        <span className='hidden md:flex'>
                                            {account.displayBalance
                                                ? `${account.displayBalance} `
                                                : ''}
                                        </span>
                                        <div className="connect-account-address">
                                            <span>{account.displayName}</span>
                                            <FaChevronDown className='hidden sm:flex' />
                                        </div>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </RainbowConnectButton.Custom>
    );
};

export default ConnectButton;