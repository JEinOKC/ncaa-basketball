import { useState, useEffect } from 'react';
import { useStateContext } from '../utils/StateContext';
import { BracketType } from '../utils/Types';
import { Bracketology } from '../utils/bracketology';
import { BracketologyType } from '../utils/Types';

interface BracketProps {
	context: "wbb"|"mbb";
	headline: string;
	limit: number|null;
}

const Bracket: React.FC<BracketProps> = ({ context, headline } ) => {
	

	const { 
		wbbBracket, mbbBracket
		, wbbRankings, mbbRankings 
		, nameTable
	} = useStateContext();

	const [bracket,setBracket] = useState<BracketologyType>();
	
	useEffect(() => {
		console.log(wbbBracket);
		console.log(mbbBracket);

		if(!wbbBracket || !mbbBracket || !wbbRankings.length || !mbbRankings.length || Object.keys(nameTable).length === 0){
			return;
		}

		if(context === "wbb"){
			const wbbBracketology:BracketologyType = new Bracketology(wbbBracket, wbbRankings, nameTable);
			console.log({'wbbBracketology':wbbBracketology});
			setBracket(wbbBracketology);
		}
		else{
			const mbbBracketology:BracketologyType = new Bracketology(mbbBracket, mbbRankings, nameTable);
			console.log({'mbbBracketology':mbbBracketology});
			setBracket(mbbBracketology);
		}

		console.log({
			'loaded bracket' : bracket
		});


	}, [wbbBracket, mbbBracket, wbbRankings, mbbRankings, nameTable]);

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

			{bracket ? bracket.toString(): 'No Bracket'}
		</div>
	);
  
};

export default Bracket;
