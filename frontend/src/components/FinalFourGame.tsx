import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import { FinalFourGame as FinalFourGameData, NodeType, Regions, BracketologyType } from "../utils/Types";
import { Bracketology } from "../utils/bracketology";

interface FinalFourGameProps {
    game: FinalFourGameData;
    bracket: BracketologyType;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSelectWinner: (game: FinalFourGameData, winningRegion: Regions) => void;
    getTranslatedName: (name: string) => string;
    getTeamRankingInfo: (teamName: string | undefined) => { rank: number, rating: number } | null;
    gameOdds?: {
        topTeamBasicOdds: number;
        bottomTeamBasicOdds: number;
        topTeamSkewedOdds: number;
        bottomTeamSkewedOdds: number;
    };
    isChampionship?: boolean;
}

const FinalFourGame: React.FC<FinalFourGameProps> = ({
    game,
    bracket,
    isExpanded,
    onToggleExpand,
    onSelectWinner,
    getTranslatedName,
    getTeamRankingInfo,
    gameOdds,
    isChampionship = false
}) => {
    const getTeamNode = (region: Regions): NodeType => bracket.nodeBracket[region][0];
    const baseTheme = isChampionship ? 'amber' : 'gray';
    const baseTextColor = isChampionship ? 'text-amber-900' : 'text-gray-900';
    const baseBorderColor = isChampionship ? 'border-amber-200' : 'border-gray-200';
    const baseHoverBg = isChampionship ? 'hover:bg-amber-50' : 'hover:bg-gray-50';
    const baseBg = isChampionship ? 'bg-amber-50' : 'bg-gray-50';
    const expandBg = isChampionship ? 'bg-amber-100' : 'bg-gray-100';
    const winnerBorder = isChampionship ? 'border-amber-500' : 'border-green-500';
    const winnerBg = isChampionship ? 'bg-amber-50' : 'bg-green-50';
    const dividerColor = isChampionship ? 'text-amber-600' : 'text-gray-400';
    const statsTextColor = isChampionship ? 'text-amber-900' : 'text-gray-700';
    const statsBorderColor = isChampionship ? 'border-amber-300' : 'border-slate-300';

    const renderTeamButton = (region: Regions, isTopTeam: boolean) => {
        if (!region || region === 'TBD' as Regions) return null;
        const teamNode = getTeamNode(region);
        if (!teamNode.winner?.name) return null;

        const odds = isTopTeam ? 
            { basic: gameOdds?.topTeamBasicOdds, skewed: gameOdds?.topTeamSkewedOdds } :
            { basic: gameOdds?.bottomTeamBasicOdds, skewed: gameOdds?.bottomTeamSkewedOdds };

        return (
            <>
                <button 
                    onClick={() => onSelectWinner(game, region)}
                    className={`flex items-center bg-white! p-3 rounded border ${
                        game.winnerRegion === region
                            ? `${winnerBorder} ${winnerBg}`
                            : `${baseBorderColor} ${baseHoverBg}`
                    }`}
                >
                    <span className={`font-medium ${baseTextColor} text-center w-full`}>
                        <span className={isChampionship ? 'text-amber-600' : 'text-gray-500'}>
                            {teamNode.winner.seed}.{' '}
                        </span>
                        {getTranslatedName(teamNode.winner.name)}
                    </span>
                </button>
                {isExpanded && gameOdds && (
                    <div className={`mt-2 p-2 ${expandBg} rounded-lg shadow-inner`}>
                        <div className={`text-sm ${statsTextColor}`}>
                            <div className="flex justify-between">
                                <span className="font-semibold">Basic Odds:</span>
                                <span>{(odds.basic! * 100).toFixed(2)}%</span>
                            </div>
                            {teamNode.winner.name && (
                                <>
                                    <div className="flex justify-between mt-1">
                                        <span className="font-semibold">Overall Ranking:</span>
                                        <span>#{getTeamRankingInfo(teamNode.winner.name)?.rank || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="font-semibold">Rating:</span>
                                        <span>{getTeamRankingInfo(teamNode.winner.name)?.rating.toFixed(2) || 'N/A'}</span>
                                    </div>
                                </>
                            )}
                            <div className={`mt-2 text-center border-t ${statsBorderColor} pt-2`}>
                                <span className="font-bold text-xl block">Win Probability</span>
                                <span className="text-4xl font-bold block" 
                                    style={{ color: `rgb(${200 * (1 - odds.skewed!)}, ${160 * odds.skewed!}, 40)` }}>
                                    {(odds.skewed! * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`flex-1 ${baseBg} rounded-lg p-4 ${!isChampionship ? 'mb-4 lg:mb-0' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <div className={`text-sm ${isChampionship ? 'text-amber-700' : 'text-gray-500'}`}>
                    {isChampionship ? 'Championship' : `${game.regionA} vs ${game.regionB}`}
                </div>
                {game.regionA && game.regionB && game.regionA !== ('TBD' as Regions) && game.regionB !== ('TBD' as Regions) && (
                    <button
                        onClick={onToggleExpand}
                        className={isChampionship ? 'text-amber-700 hover:text-amber-900' : 'text-gray-500 hover:text-gray-700'}
                    >
                        <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} />
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-2">
                {renderTeamButton(game.regionA, true)}
                <div className={`text-center text-sm ${dividerColor}`}>vs</div>
                {renderTeamButton(game.regionB, false)}
            </div>
        </div>
    );
};

export default FinalFourGame; 