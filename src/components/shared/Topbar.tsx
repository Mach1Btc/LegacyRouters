import { ConnectButton } from '@/components/shared';
import { NavLink } from 'react-router-dom';

const Topbar = () => {
    return (
        <div className='topbar-container'>
            <div className='topbar'>
                <NavLink to="/" className='logo'>
                    <div className='logo'>
                        <div className="rounded-md bg-ava-red p-2 h-8 w-8">
                            <img src="assets/Avalanche_Logomark_White.svg" className='' />
                        </div>
                        <span>Legacy Routers</span>
                    </div>
                </NavLink>
                <div className='topbar-links'>
                    <NavLink to="/LFJ" className='topbar-link'>LFJ</NavLink>
                    <NavLink to="/PHARAOH" className='topbar-link'>PHARAOH</NavLink>
                    <NavLink to="/Pangolin" className='topbar-link'>Pangolin</NavLink>
                    <NavLink to="/Uniswap" className='topbar-link'>Uniswap</NavLink>
                </div>
                <div className='connect-and-theme-button-wrapper'>
                    {/* <ThemeToggle /> */}
                    <ConnectButton />
                </div>
            </div>
        </div>
    )
}

export default Topbar