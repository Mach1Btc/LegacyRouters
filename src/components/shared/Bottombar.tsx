// import { FaDiscord, FaXTwitter } from "react-icons/fa6";
// import { SiGitbook } from "react-icons/si";

const Bottombar = () => {
    return (
        <div className='bottombar-container'>
            <div className='bottombar'>
                <div className='flex flex-col items-center'>
                    <div className='logo'>
                        Legacy Routers
                    </div>
                    <span>&copy; 2025 Legacy Routers</span>
                </div>

                <div className="flex flex-row gap-8 text-xl">
                    {/* <a href="" target="_blank" className="bottom-bar-social-link"><FaDiscord /></a>
                    <a href="" target="_blank" className="bottom-bar-social-link"><FaXTwitter /></a>
                    <a href="" target="_blank" className="bottom-bar-social-link"><SiGitbook /></a> */}
                </div>
            </div>
        </div>
    )
}

export default Bottombar