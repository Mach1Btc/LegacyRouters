import { ArenaSwapPanel, RouterSelecter } from '@/components/shared';

const Arena = () => {
    return (
        <div className="flex flex-col items-center w-full h-full overflow-y-auto">
            <RouterSelecter />
            <div className="flex flex-col w-4/5 xl:w-3/4 h-full gap-4 items-center justify-center">
                <ArenaSwapPanel />
            </div>
        </div>
    )
};

export default Arena;