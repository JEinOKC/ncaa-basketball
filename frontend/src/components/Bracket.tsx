import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { Regions, NodeType, Winners } from '../utils/Types';
import { Bracketology } from '../utils/bracketology';
import { BracketologyType } from '../utils/Types';
import { v4 as uuidv4 } from 'uuid';
import Region from './Region';
import { setGameWinners } from "../store/stateSlice";
import { getNodesAtLevel, totalLevels } from "../utils/treeUtils";
import styles from '../styles/Semicircle.module.css';

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
	const [randomness, setRandomness] = useState<number>(0.5); // Default to 0.5 for balanced randomness

	const getArcColor = (value: number): string => {
		// Convert the value to a percentage distance from 50%
		const distanceFromMiddle = Math.abs(0.5 - value);
		// Scale it to be between 0 and 1 (0 being at 50%, 1 being at 0% or 100%)
		const normalizedDistance = distanceFromMiddle * 2;
		
		// Calculate RGB values with reduced intensity
		// Red goes from 0 to 200 (instead of 255)
		const red = Math.round(200 * normalizedDistance);
		// Green goes from 0 to 160 (instead of 255)
		const green = Math.round(160 * (1 - normalizedDistance));
		// Add some blue to soften the colors
		const blue = Math.round(40 * (1 - normalizedDistance));
		
		return `rgb(${red}, ${green}, ${blue})`;
	};

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

		if (!winner.ancestor) return;

		const ancestor = winner.ancestor;
		const previousWinner = ancestor.winner;

		// Assign the winner to the ancestor
		if (winner.name) {
			ancestor.winner = {
				name: winner.name,
				rating: winner.rating || undefined,
				seed: winner.seed || undefined
			}
		}

		// Create a single updated gameWinners object
		const updatedGameWinners = { ...gameWinners };

		// If there was a previous winner that's different from the current winner,
		// we need to clear that winner's path up the bracket
		if (previousWinner && previousWinner.name !== winner.name) {
			let traveler = winner;
			
			while (traveler.ancestor && traveler.ancestor.name === previousWinner.name) {
				console.log('found a previous winner that is different from the current winner');
				// Reset the ancestor node's properties
				traveler.ancestor.winner = {};
				traveler.ancestor.name = undefined;
				traveler.ancestor.rating = undefined;
				traveler.ancestor.seed = undefined;
				
				// Clear the gameUUID from updatedGameWinners
				if (traveler.ancestor.gameUUID && updatedGameWinners[traveler.ancestor.gameUUID] === previousWinner.name) {
					delete updatedGameWinners[traveler.ancestor.gameUUID];
				}
				
				traveler = traveler.ancestor;
			}
		}

		// Add the new winner to the same updatedGameWinners object
		console.log({'ancestor': ancestor});
		if (ancestor.gameUUID && winner.name) {
			updatedGameWinners[ancestor.gameUUID] = winner.name;
		}

		// Dispatch a single update with all changes
		dispatch(setGameWinners(updatedGameWinners));
		console.log({'updatedGameWinners':updatedGameWinners});
		
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

	const simulateTournament = async () => {
		console.log('simulateTournament');
		
		// Helper function to simulate a game between two teams
		const simulateGame = (team1: NodeType, team2: NodeType): NodeType => {
			if (!team1.name || !team2.name || !team1.rating || !team2.rating) {
				console.error('Missing team info:', {
					team1: { name: team1.name, rating: team1.rating },
					team2: { name: team2.name, rating: team2.rating }
				});
				return team1;
			}
			

			return Bracketology.selectGameWinner(team1, team2, randomness);
		};

		// Create a single object to store all winners
		const allWinners: Winners = { ...gameWinners };

		// Process each region
		for (const regionName of getRegionNamesInOrder()) {
			const region = getRegion(regionName);
			const levels = totalLevels(region);
			console.log({
				'levels': levels,
				'region': region
			});

			// Start from the deepest level and work up
			for (let level = 1; level <= levels; level++) {
				const nodesAtLevel = getNodesAtLevel(region, level, levels);
				console.log({
					'level': level,
					'nodesAtLevel': nodesAtLevel
				});

				// Create a promise that resolves when the state update is complete
				await new Promise<void>((resolve) => {
					nodesAtLevel.forEach(node => {
						// Only simulate if we have two teams to compare
						if (node.left?.name && node.right?.name) {
							//if the game has already been played, return the winner
							if(node.winner){
								allWinners[node.gameUUID] = node.winner.name;
							}
							else{
								const winner = simulateGame(node.left, node.right);
								
								// Set the winner in this node
								if (winner.name && node.gameUUID) {
									allWinners[node.gameUUID] = winner.name;
								}
							}

							
						}
					});

					// Dispatch the update with all accumulated winners
					dispatch(setGameWinners({ ...allWinners }));
					
					// Give React time to process the state update
					setTimeout(resolve, 0);
				});
			}
		}
	}

	const clearTournament = () => {
		console.log('clearTournament');

		// Process each region
		for (const regionName of getRegionNamesInOrder()) {
			const region = getRegion(regionName);
			const levels = totalLevels(region);

			// Start from the top level and work down to ensure we clear everything
			for (let level = 1; level <= levels; level++) {
				const nodesAtLevel = getNodesAtLevel(region, level, levels);
				
				nodesAtLevel.forEach(node => {
					// Reset the node's winner and properties
					node.winner = null;
					node.name = undefined;
					node.rating = undefined;
					node.seed = undefined;
				});
			}
		}

		// Finally, clear all game winners from state
		dispatch(setGameWinners({}));
	}

	return (
		<div>
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<h1 className="text-3xl text-gray-900 font-bold">{headline}</h1>
			</div>
			{/** 
			* determine the context. depending on the context, loop through the array up until the limit or the length, whatever is shorter
			* if the context is wbb, then use wbbRankings 
			* if the context is mbb, then use mbbRankings 
			* if the limit is null, then use the length of the array 
			* if the limit is not null, then use the limit 
			* display the team name and the ranking 
			**/}

			{bracket ? (
				<>
					<div className="bg-white rounded-lg shadow p-6 mb-6">
						<div className="flex flex-col items-center space-y-4">
							<div className="relative w-48">
								<div className={styles['semi-circle']}>
									{/* Base semicircle with gray border is created by ::before pseudo-element */}
									<div className={styles['semi-circle-mask']}>
										{/* Progress arc */}
										<div 
											className={styles.fill}
											style={{ 
												transform: `rotate(${-90 + (180 * randomness)}deg)`,
												borderTopColor: getArcColor(randomness)
											}}
										></div>
									</div>
									{/* Center text */}
									<div className="text-center absolute left-0 right-0 top-1/3 z-10">
										<span className="text-lg font-semibold text-gray-900">
											{Math.round(randomness * 100)}%
										</span>
									</div>
								</div>
								{/* Labels */}
								<div className="flex justify-between px-2">
									<span className="text-sm font-medium text-gray-600">Random</span>
									<span className="text-sm font-medium text-gray-600">Chalk</span>
								</div>
								{/* Range input */}
								<div className="mt-4">
									<input
										type="range"
										className="w-full"
										id="randomness"
										min="0"
										max="1"
										step="0.01"
										value={randomness}
										onChange={(e) => setRandomness(parseFloat(e.target.value))}
									/>
								</div>
							</div>
						</div>
						<div className="flex justify-center gap-4 mt-6">
							<button 
								className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium" 
								onClick={() => simulateTournament()}
							>
								Simulate Tournament
							</button>
							<button 
								className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium" 
								onClick={() => clearTournament()}
							>
								Clear Tournament
							</button>
						</div>
					</div>
					{getRegionNamesInOrder().map((element) => (
						<Region key={element} region={getRegion(element)} regionName={element} onSelectWinner={handleSelectWinner}/>	
					))}
				</>
			) : 'No Bracket'}
		</div>
	);
  
};

export default Bracket;
