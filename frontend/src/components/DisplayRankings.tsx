import { useSelector } from "react-redux";
import { RootState } from "../store";
import { RankingItem } from '../utils/Types';

interface DisplayRankingsProps {
	context: "wbb"|"mbb";
	headline: string;
	limit: number|null;
	onLimitChange?: (newLimit: number) => void;
}

const DisplayRankings: React.FC<DisplayRankingsProps> = ({ context, limit, onLimitChange } ) => {
	
	const wbbRankings = useSelector((state: RootState) => state.state.wbbRankings);
	const mbbRankings = useSelector((state: RootState) => state.state.mbbRankings);
	
	const getRankingsLimitOptions = () => {
		const currentRankings = context === 'wbb' ? wbbRankings : mbbRankings;
		const maxLimit = currentRankings.length;
		const options = [25, 50, 100, 200];
		if (maxLimit > 0 && !options.includes(maxLimit)) {
			options.push(maxLimit);
		}
		return options.filter(opt => opt <= maxLimit);
	}

	return (
		<div className="bg-white rounded-lg shadow p-4">
			<h2 className="text-gray-800 text-xl font-semibold text-center">{context === "wbb" ? "Women's Basketball Ratings" : "Men's Basketball Ratings"}</h2>
			<div className="flex justify-center items-center mb-4">
				
				{onLimitChange && (
					<select
						value={limit || 25}
						onChange={(e) => onLimitChange(Number(e.target.value))}
						className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
					>
						{getRankingsLimitOptions().map(limit => (
							<option key={limit} value={limit}>
								Show Top {limit}
							</option>
						))}
					</select>
				)}
			</div>
			<div className="space-y-1 pr-2">
				{/** 
				* determine the context. depending on the context, loop through the array up until the limit or the length, whatever is shorter
				* if the context is wbb, then use wbbRankings 
				* if the context is mbb, then use mbbRankings 
				* if the limit is null, then use the length of the array 
				* if the limit is not null, then use the limit 
				* display the team name and the ranking 
				**/}

				{context === "wbb" 
					? wbbRankings.slice(0, limit ? limit : wbbRankings.length).map((team:RankingItem, index:number) => (
						<div 
							key={index}
							className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
						>
							<div className="flex items-center gap-3">
								<span className="text-indigo-600 font-semibold w-6">{team.rank}</span>
								<span className="text-gray-900">{team.team_name}</span>
							</div>
							<span className="text-sm text-gray-600 font-medium">
								{team.rating.toFixed(3)}
							</span>
						</div>
					)) 
					: mbbRankings.slice(0, limit ? limit : mbbRankings.length).map((team:RankingItem, index:number) => (
						<div 
							key={index}
							className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
						>
							<div className="flex items-center gap-3">
								<span className="text-indigo-600 font-semibold w-6">{team.rank}</span>
								<span className="text-gray-900">{team.team_name}</span>
							</div>
							<span className="text-sm text-gray-600 font-medium">
								{team.rating.toFixed(3)}
							</span>
						</div>
					))
				}
			</div>
		</div>
	);
  
};

export default DisplayRankings;
