import { useEffect } from 'react';
import { useStateContext } from '../utils/StateContext';
import { RankingItem } from '../utils/Types';

interface DisplayRankingsProps {
	context: "wbb"|"mbb";
	headline: string;
	limit: number|null;
}

const DisplayRankings: React.FC<DisplayRankingsProps> = ({ context, headline, limit } ) => {
	
	const { wbbRankings, mbbRankings } = useStateContext();
	
	// useEffect(() => {
	// 	console.log(wbbRankings);
	// 	console.log(mbbRankings);
	// }, [wbbRankings, mbbRankings]);

	return (
		<div>
			<h1>{headline}</h1>
			{/** 
			* determine the context. depending on the context, loop through the array up until the limit or the length, whatever is shorter
			* if the context is wbb, then use wbbRankings 
			* if the context is mbb, then use mbbRankings 
			* if the limit is null, then use the length of the array 
			* if the limit is not null, then use the limit 
			* display the team name and the ranking 
			**/}

			{context === "wbb" ? wbbRankings.slice(0, limit ? limit : wbbRankings.length).map((team:RankingItem, index:number) => (
				<div key={index}>
					{team.rank} - {team.team_name} ({team.rating.toFixed(4)})
				</div>
			)) : mbbRankings.slice(0, limit ? limit : mbbRankings.length).map((team:RankingItem, index:number) => (
				<div key={index}>
					{team.rank} - {team.team_name} ({team.rating.toFixed(4)})
				</div>
			))}
		</div>
	);
  
};

export default DisplayRankings;
