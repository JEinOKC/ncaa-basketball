import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { Regions, NodeType } from '../utils/Types';
import { Bracketology } from '../utils/bracketology';
import { BracketologyType } from '../utils/Types';
import { v4 as uuidv4 } from 'uuid';
import Region from './Region';
import { setGameWinners } from "../store/stateSlice";

interface BracketProps {
	context: "wbb"|"mbb";
	headline: string;
	limit: number|null;
}

const Bracket: React.FC<BracketProps> = ({ context, headline } ) => {
	const dispatch = useDispatch();
	
	const wbbBracket = useSelector((state: RootState) => state.state.wbbBracket);
	const mbbBracket = useSelector((state: RootState) => state.state.mbbBracket);
	const wbbRankings = useSelector((state: RootState) => state.state.wbbRankings);
	const mbbRankings = useSelector((state: RootState) => state.state.mbbRankings);
	const nameTable = useSelector((state: RootState) => state.state.nameTable);
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);

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

	const handleSelectWinner = (winner: NodeType, regionName: Regions) => {
		console.log({
			'inside the handleSelectWinner function within the bracket component. Here is your winner': winner,
			'and here is the regionName': regionName
		})

		if (!winner.ancestor) return;

		const ancestor = winner.ancestor;
		const previousWinner = ancestor.winner;

		// Assign the winner to the ancestor
		if (winner.name) {
			ancestor.winner = winner.name;
			ancestor.name = winner.name;
			ancestor.rating = winner.rating;
			ancestor.seed = winner.seed;
		}
console.log('line 57');
console.log({
	'previousWinner': previousWinner,
	'currentWinner': winner.name
});
		// If there was a previous winner that's different from the current winner,
		// we need to clear that winner's path up the bracket
		if (previousWinner && previousWinner !== winner.name) {
			let traveler = winner;
			
			while (traveler.ancestor && traveler.ancestor.name === previousWinner) {
				console.log('found a previous winner that is different from the current winner');
				// Reset the ancestor node's properties
				traveler.ancestor.winner = "";
				traveler.ancestor.name = undefined;
				traveler.ancestor.rating = undefined;
				traveler.ancestor.seed = undefined;
				
				// Clear the game winner in Redux store if there's a gameUUID
				if (traveler.gameUUID) {
				console.log('clear this game uuid', traveler.gameUUID);
					const safeGameUUID: string = traveler.gameUUID;
					dispatch(setGameWinners({
						...gameWinners,
						[safeGameUUID]: ''
					}));
				}
				
				traveler = traveler.ancestor;
			}
		}
	};

	const addGameUUID = (node: NodeType): NodeType => {
		if (!node) return node;
		
		const newNode = { ...node };
		if (newNode.left && newNode.right) {
			newNode.gameUUID = uuidv4();
			newNode.left = addGameUUID(newNode.left);
			newNode.right = addGameUUID(newNode.right);
			
			// Restore ancestor relationships
			if (newNode.left) {
				newNode.left.ancestor = newNode;
			}
			if (newNode.right) {
				newNode.right.ancestor = newNode;
			}
		}
		return newNode;
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
	
	const updateBracketWithWinners = (currentBracket: BracketologyType) => {
		if (!currentBracket) return;

		// Ensure regions are merged for winner propagation
		if (!currentBracket.regionsMerged) {
			currentBracket.mergeRegions();
		}

		// Apply winners in order to ensure proper propagation
		const sortedWinners = Object.entries(gameWinners).sort(([gameIdA], [gameIdB]) => {
			// Put championship game last
			if (gameIdA === 'ChampionshipGame') return 1;
			if (gameIdB === 'ChampionshipGame') return -1;
			return 0;
		});

		sortedWinners.forEach(([gameId, winner]) => {
			currentBracket.setWinner(gameId, winner);
		});

		return currentBracket;
	};

	useEffect(() => {
		if(!wbbBracket || !mbbBracket || !wbbRankings.length || !mbbRankings.length || Object.keys(nameTable).length === 0){
			return;
		}

		if(context === "wbb"){
			const wbbBracketology:BracketologyType = new Bracketology(wbbBracket, wbbRankings, nameTable);
			
			// Add UUIDs to each region's nodes before setting state
			Object.keys(wbbBracketology.nodeBracket).forEach((region) => {
				const typedRegion = region as Regions;
				wbbBracketology.nodeBracket[typedRegion][0] = addGameUUID(wbbBracketology.nodeBracket[typedRegion][0]);
			});

			// Apply any existing winners
			updateBracketWithWinners(wbbBracketology);

			// console.log({'wbbBracketology':wbbBracketology});
			setBracket(wbbBracketology);
		}
		else{
			const mbbBracketology:BracketologyType = new Bracketology(mbbBracket, mbbRankings, nameTable);
			
			// Add UUIDs to each region's nodes before setting state
			Object.keys(mbbBracketology.nodeBracket).forEach((region) => {
				const typedRegion = region as Regions;
				mbbBracketology.nodeBracket[typedRegion][0] = addGameUUID(mbbBracketology.nodeBracket[typedRegion][0]);
			});

			// Apply any existing winners
			updateBracketWithWinners(mbbBracketology);

			// console.log({'mbbBracketology':mbbBracketology});
			setBracket(mbbBracketology);
		}
	}, [wbbBracket, mbbBracket, wbbRankings, mbbRankings, nameTable, context]);

	useEffect(() => {
		if (bracket) {
			// Clone the existing bracket to maintain structure but trigger a re-render
			const updatedBracket = Object.create(
				Object.getPrototypeOf(bracket),
				Object.getOwnPropertyDescriptors(bracket)
			);

			// Apply winners to the existing structure
			Object.entries(gameWinners).forEach(([gameId, winner]) => {
				updatedBracket.setWinner(gameId, winner);
			});

			setBracket(updatedBracket);
		}
	}, [gameWinners]);

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
					<Region key={element} region={getRegion(element)} regionName={element} onSelectWinner={handleSelectWinner}/>	
				))
			) : 'No Bracket'}
		</div>
	);
  
};

export default Bracket;
