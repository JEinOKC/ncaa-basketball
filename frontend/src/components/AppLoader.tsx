import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    setWbbRankings, 
    setMbbRankings, 
    setWbbBracket, 
    setMbbBracket, 
    setNameTable 
} from '../store/stateSlice';
import { RootState } from '../store';
import { BracketType, RankingItem } from '../utils/Types';

interface AppLoaderProps {
    children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();

    // We can use this selector to check if all required data is loaded
    const dataLoaded = useSelector((state: RootState) => {
        return state.state.wbbRankings.length > 0 &&
            state.state.mbbRankings.length > 0 &&
            state.state.wbbBracket !== undefined &&
            state.state.mbbBracket !== undefined &&
            Object.keys(state.state.nameTable).length > 0;
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all data in parallel
                const [
                    wbbRankingsRes,
                    mbbRankingsRes,
                    wbbBracketRes,
                    mbbBracketRes,
                    nameTableRes
                ] = await Promise.all([
                    fetch('/data/womensbb-rankings.json'),
                    fetch('/data/mensbb-rankings.json'),
                    fetch('/data/womensbb-bracket.json'),
                    fetch('/data/mensbb-bracket.json'),
                    fetch('/data/name-table.json')
                ]);

                // Parse all responses in parallel
                const [
                    wbbRankingsData,
                    mbbRankingsData,
                    wbbBracketData,
                    mbbBracketData,
                    nameTableData
                ] = await Promise.all([
                    wbbRankingsRes.json() as Promise<RankingItem[]>,
                    mbbRankingsRes.json() as Promise<RankingItem[]>,
                    wbbBracketRes.json() as Promise<BracketType>,
                    mbbBracketRes.json() as Promise<BracketType>,
                    nameTableRes.json() as Promise<{ [key: string]: string }>
                ]);

                // Dispatch all actions
                dispatch(setWbbRankings(wbbRankingsData));
                dispatch(setMbbRankings(mbbRankingsData));
                dispatch(setWbbBracket(wbbBracketData));
                dispatch(setMbbBracket(mbbBracketData));
                dispatch(setNameTable(nameTableData));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load application data');
            } finally {
                setIsLoading(false);
            }
        };

        if (!dataLoaded) {
            fetchAllData();
        } else {
            setIsLoading(false);
        }
    }, [dispatch, dataLoaded]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Loading NCAA Basketball Data...</h2>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AppLoader; 