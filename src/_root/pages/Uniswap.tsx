import { UniswapSwapPanel } from "@/components/shared"


const Uniswap = () => {
    return (
        <div className="flex flex-col items-center w-full h-full overflow-y-auto">
            <div className="flex flex-col w-4/5 xl:w-3/4 h-full gap-4 items-center mt-[40px] sm:mt-[100px] md:mt-[180px] xl:mb-0">
                <UniswapSwapPanel />
            </div>
        </div>
    )
}

export default Uniswap