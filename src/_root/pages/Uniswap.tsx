import { UniswapSwapPanel } from "@/components/shared"

const Uniswap = () => {
    return (
        <div className="flex flex-col items-center w-full h-full overflow-y-auto">
            <div className="flex flex-col w-4/5 xl:w-3/4 h-full gap-4 items-center justify-center">
                <UniswapSwapPanel />
            </div>
        </div>
    )
}

export default Uniswap