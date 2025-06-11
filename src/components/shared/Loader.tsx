import React from 'react'

interface LoaderProps {
    width?: number;
    height?: number;
}

const Loader: React.FC<LoaderProps> = ({ width = 24, height = 24 }) => {
    return (
        <div className="flex">
            <img
                src="/assets/loader.svg"
                alt="loader"
                width={width}
                height={height}
                className="animate-spin"
            />
        </div>
    )
}

export default Loader