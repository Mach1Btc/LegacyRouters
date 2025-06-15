// import { FaDiscord, FaXTwitter } from "react-icons/fa6";
// import { SiGitbook } from "react-icons/si";

const Bottombar = () => {
    return (
        <div className='bottombar-container relative'>
            <div className='bottombar'>
                <div className='flex flex-col items-center'>
                    <div className='logo'>
                        <div className="rounded-md bg-ava-red p-2 h-8 w-8 flex items-center justify-center">
                            <img src="assets/Avalanche_Logomark_White.svg" />
                        </div>
                        <span className="hidden sm:flex">Legacy Routers</span>
                        <span className="flex sm:hidden">LR</span>
                    </div>
                    <span className="hidden sm:flex text-xxs md:text-xs lg:text-base" >&copy; 2025 Legacy Routers</span>
                </div>

                <div className="flex flex-row gap-8 text-xl">
                    {/* <a href="" target="_blank" className="bottom-bar-social-link"><FaDiscord /></a>
                    <a href="" target="_blank" className="bottom-bar-social-link"><FaXTwitter /></a>
                    <a href="" target="_blank" className="bottom-bar-social-link"><SiGitbook /></a> */}
                    <a href="https://www.avax.network/" target="_blank">
                        <img
                            src="/assets/PoweredbyAvalanche_BlackWhite 1.svg"
                            alt="Powered by Avalanche"
                            className="w-32 h-8 sm:w-64 sm:h-16"
                        />
                    </a>
                </div>
            </div>

            {/* Creator credit and social links */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center gap-2 pb-2 text-xxs sm:text-xs text-gray-600">
                <span>Made by @Mach1___</span>
                <div className="flex gap-2">
                    <a href="https://x.com/Mach1___" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                    <a href="https://arena.social/Mach1___" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 11 14" className="w-3 h-3 sm:w-4 sm:h-4"><path fill="currentColor" fillRule="evenodd" d="M10.31 14V5.154a5.155 5.155 0 1 0-10.31 0V14h.224V6.051A4.937 4.937 0 0 1 5.156 1.12a4.936 4.936 0 0 1 4.93 4.931v7.948h.224Zm-.894-.838V5.658a4.26 4.26 0 1 0-8.519 0v7.504h.224V6.419a4.041 4.041 0 0 1 4.036-4.036A4.04 4.04 0 0 1 9.193 6.42v6.743h.223Zm-.9-6.997v6.163H8.29V6.792a3.144 3.144 0 0 0-3.14-3.14 3.144 3.144 0 0 0-3.14 3.14v5.536h-.224V6.165a3.365 3.365 0 0 1 6.728 0ZM7.62 11.49V6.668a2.469 2.469 0 1 0-4.937 0v4.822h.224V7.161a2.248 2.248 0 0 1 2.245-2.245A2.247 2.247 0 0 1 7.397 7.16v4.33h.224ZM6.73 7.172v3.48h-.224V7.53a1.35 1.35 0 0 0-1.35-1.35c-.743 0-1.35.605-1.35 1.35v3.123h-.223V7.172c0-.87.705-1.574 1.574-1.574.867 0 1.573.705 1.573 1.574Zm-.903 2.646v-2.14a.678.678 0 0 0-1.355 0v2.14h.224V7.903a.454.454 0 1 1 .908 0v1.915h.223Z" clipRule="evenodd"></path></svg>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Bottombar