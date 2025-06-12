// import { FaDiscord, FaXTwitter } from "react-icons/fa6";
// import { SiGitbook } from "react-icons/si";

const Bottombar = () => {
    return (
        <div className='bottombar-container'>
            <div className='bottombar'>
                <div className='flex flex-col items-center'>
                    <div className='logo'>
                        <div className="rounded-md bg-ava-red p-2 h-8 w-8">
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
                            className="w-64 h-16"
                        />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Bottombar