import { useState, useEffect } from 'react';
import { useStateContext } from '../utils/StateContext';
import { Regions, NodeType } from '../utils/Types';
import { Bracketology } from '../utils/bracketology';
import { BracketologyType } from '../utils/Types';
import { v4 as uuidv4 } from 'uuid';
import Region from './Region';

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

	const getDefaultRegion = ():NodeType =>{
		return {
			left: null,
			right: null,
			winner: null,
			score: null,
			gameUUID: uuidv4()
		};
	}

	const addGameUUID = (node:NodeType) =>{
	
		if(node.left && node.right){
			node.gameUUID = uuidv4();
			addGameUUID(node.left);
			addGameUUID(node.right);
		}
		
	};

	const getRegionNamesInOrder = ():Regions[] =>{
		const finalFour = bracket?.data.finalFour;
		const regionOrder:Regions[] = [];
		if(!finalFour){
			return regionOrder;
		}

		for(var i=0;i<finalFour.length;i++){
			const segment = finalFour[i];

			for(var j=0;j<segment.length;j++){
				const typedItem:Regions = segment[j] as Regions;

				regionOrder.push(typedItem);
			}
		}

		return regionOrder;
	}

	

	const getRegion = (regionName:Regions):NodeType =>{

		if(!bracket){
			return getDefaultRegion();
		}

		let currentRegion =  bracket.nodeBracket[regionName][0];
		
		return currentRegion;
	}
	
	useEffect(() => {
		// console.log(wbbBracket);
		// console.log(mbbBracket);

		if(!wbbBracket || !mbbBracket || !wbbRankings.length || !mbbRankings.length || Object.keys(nameTable).length === 0){
			return;
		}

		if(context === "wbb"){
			// const wbbBracketology:BracketologyType = new Bracketology(wbbBracket, wbbRankings, nameTable);
			// const wbbRegions = wbbBracketology.data.regions;
			// wbbRegions.forEach((region)=>{
			// 	addGameUUID(getRegion(region.name));
			// })

			// console.log({'wbbBracketology':wbbBracketology});
			// setBracket(wbbBracketology);
		}
		else{
			const mbbBracketology:BracketologyType = new Bracketology(mbbBracket, mbbRankings, nameTable);
			const mbbRegions = mbbBracketology.data.regions;
			mbbRegions.forEach((region)=>{
				addGameUUID(getRegion(region.name));
			})
			console.log({'mbbBracketology':mbbBracketology});
			setBracket(mbbBracketology);
		}

		// console.log({
		// 	'loaded bracket' : bracket
		// });


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

			{bracket ? (
				getRegionNamesInOrder().map((element) => (
					<Region key={element} region={getRegion(element)} regionName={element}/>	
				))
			) : 'No Bracket'}
		</div>
	);
  
};

export default Bracket;
