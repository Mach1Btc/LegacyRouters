import { NavLink } from 'react-router-dom';

const RouterSelecter = () => {
    return (
        <div className='w-[360px] min-h-[40px] flex flex-row items-center justify-between lg:hidden mt-4 lg:mt-0'>
            <NavLink
                to="/LFJ"
                className={({ isActive }) =>
                    isActive ? '' : 'opacity-50 scale-75'
                }
            >
                <img src="/assets/icons/Joe.png" className="h-8 w-8 transition-transform" />
            </NavLink>

            <NavLink
                to="/PHARAOH"
                className={({ isActive }) =>
                    isActive ? '' : 'opacity-50 scale-75'
                }
            >
                <img src="/assets/icons/Pharaoh.svg" className="h-8 w-8 mb-1 transition-transform" />
            </NavLink>

            <NavLink
                to="/Arena"
                className={({ isActive }) =>
                    isActive ? '' : 'opacity-50 scale-75'
                }
            >
                <img src="/assets/icons/Arena.svg" className="h-8 w-8 transition-transform" />
            </NavLink>

            <NavLink
                to="/Pangolin"
                className={({ isActive }) =>
                    isActive ? '' : 'opacity-50 scale-75'
                }
            >
                <img src="/assets/icons/Pangolin.svg" className="h-8 w-8 transition-transform" />
            </NavLink>

            <NavLink
                to="/Uniswap"
                className={({ isActive }) =>
                    isActive ? '' : 'opacity-50 scale-75'
                }
            >
                <img src="/assets/icons/Uniswap.svg" className="h-8 w-8 transition-transform" />
            </NavLink>
        </div>
    )
};

export default RouterSelecter;