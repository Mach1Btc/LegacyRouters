import { ConnectButton } from '@/components/shared';
import { NavLink } from 'react-router-dom';

const Topbar = () => {
    return (
        <div className='topbar-container'>
            <div className='topbar'>
                <NavLink to="/" className='logo'>Legacy Routers</NavLink>
                <div className='topbar-links'>
                    <NavLink to="/LFJ" className='topbar-link'>LFJ</NavLink>
                    <NavLink to="/PHARAOH" className='topbar-link'>PHARAOH</NavLink>
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