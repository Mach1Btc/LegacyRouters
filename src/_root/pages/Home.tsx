import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-start h-full bg-gray-50 p-8">
            <div className="flex flex-col gap-8 mt-20">
                {/* LFJ Button */}
                <Link
                    to="/LFJ"
                    className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    <img
                        src="/assets/LFGLogo.png"
                        alt="LFJ Logo"
                        className="w-96 h-48 object-contain p-1 group-hover:brightness-110 transition-all duration-300 relative z-10 bg-lfj-purple"
                    />
                    {/* Background overlay */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-20"></div>
                    {/* Text overlay - separate from background */}
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Use LFJ
                        </span>
                    </div>
                </Link>

                {/* PHARAOH Button */}
                <Link
                    to="/PHARAOH"
                    className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    <img
                        src="/assets/PharaohLogo.png"
                        alt="Pharaoh Logo"
                        className="w-96 h-48 object-cover group-hover:brightness-110 transition-all duration-300 relative z-10 bg-black"
                    />
                    {/* Background overlay */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-20"></div>
                    {/* Text overlay - separate from background */}
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Use PHARAOH
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default Home;