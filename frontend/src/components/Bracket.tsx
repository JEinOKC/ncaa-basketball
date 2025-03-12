import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { Regions, NodeType, Winners, FinalFourState, FinalFourGame } from '../utils/Types';
import { Bracketology } from '../utils/bracketology';
import { BracketologyType } from '../utils/Types';
import { v4 as uuidv4 } from 'uuid';
import Region from './Region';
import { setGameWinners, setMaxBracketDepth } from "../store/stateSlice";
import { getNodesAtLevel, totalLevels } from "../utils/treeUtils";
import styles from '../styles/Semicircle.module.css';
import { useMediaQuery } from 'react-responsive';

interface BracketProps {
	context: "wbb"|"mbb";
	headline: string;
	limit: number|null;
}

const Bracket: React.FC<BracketProps> = ({ context, headline } ) => {
	const dispatch = useDispatch();
	const isDesktop = useMediaQuery({ minWidth: 1024 });
	const [currentLevel, setCurrentLevel] = useState(1);
	const completionAlertRef = useRef<HTMLDivElement>(null);
	
	const wbbBracket = useSelector((state: RootState) => state.state.wbbBracket);
	const mbbBracket = useSelector((state: RootState) => state.state.mbbBracket);
	const wbbRankings = useSelector((state: RootState) => state.state.wbbRankings);
	const mbbRankings = useSelector((state: RootState) => state.state.mbbRankings);
	const nameTable = useSelector((state: RootState) => state.state.nameTable);
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);
	const completedRegions = useSelector((state: RootState) => state.state.completedRegions);

	const [bracket,setBracket] = useState<BracketologyType>();
	const [randomness, setRandomness] = useState<number>(0.5); // Default to 0.5 for balanced randomness
	const [finalFourState, setFinalFourState] = useState<FinalFourState | null>(null);

	const roundNames = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];

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
	};

	const getTranslatedName = (name:string) => {
		return nameTable[name] || name;
	};

	const handleSelectWinner = (winner: NodeType) => {

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
		if (ancestor.gameUUID && winner.name) {
			updatedGameWinners[ancestor.gameUUID] = winner.name;
		}

		// Dispatch a single update with all changes
		dispatch(setGameWinners(updatedGameWinners));
		
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
				// Process First Four games for this region
				wbbBracketology.addFirstFourGames(wbbBracketology.nodeBracket[typedRegion]);
			});

			// Apply any existing winners
			updateBracketWithWinners(wbbBracketology);

			// Calculate max depth across all regions
			let maxDepth = 0;
			Object.values(wbbBracketology.nodeBracket).forEach(nodes => {
				if (nodes && nodes.length > 0) {
					const depth = wbbBracketology.findMaxDepth(nodes[0]);
					maxDepth = Math.max(maxDepth, depth);
				}
			});
			dispatch(setMaxBracketDepth(maxDepth));

			setBracket(wbbBracketology);
		}
		else{
			const mbbBracketology:BracketologyType = new Bracketology(mbbBracket, mbbRankings, nameTable);
			
			// Add UUIDs to each region's nodes before setting state
			Object.keys(mbbBracketology.nodeBracket).forEach((region) => {
				const typedRegion = region as Regions;
				mbbBracketology.nodeBracket[typedRegion][0] = addGameUUID(mbbBracketology.nodeBracket[typedRegion][0]);
				// Process First Four games for this region
				mbbBracketology.addFirstFourGames(mbbBracketology.nodeBracket[typedRegion]);
			});

			// Apply any existing winners
			updateBracketWithWinners(mbbBracketology);

			// Calculate max depth across all regions
			let maxDepth = 0;
			Object.values(mbbBracketology.nodeBracket).forEach(nodes => {
				if (nodes && nodes.length > 0) {
					const depth = mbbBracketology.findMaxDepth(nodes[0]);
					maxDepth = Math.max(maxDepth, depth);
				}
			});
			dispatch(setMaxBracketDepth(maxDepth));

			setBracket(mbbBracketology);
		}
	}, [wbbBracket, mbbBracket, wbbRankings, mbbRankings, nameTable, context, dispatch]);

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
			// console.log({
			// 	'levels': levels,
			// 	'region': region
			// });

			// Start from the deepest level and work up
			for (let level = 1; level <= levels; level++) {
				const nodesAtLevel = getNodesAtLevel(region, level, levels);
				// console.log({
				// 	'level': level,
				// 	'nodesAtLevel': nodesAtLevel
				// });

				// Create a promise that resolves when the state update is complete
				await new Promise<void>((resolve) => {
					nodesAtLevel.forEach(node => {
						// Only simulate if we have two teams to compare
						if (node.left?.name && node.right?.name) {
							//if the game has already been played, return the winner
							if(node.winner && node.gameUUID && node.winner.name){
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

		// Clear all game winners from state first
		dispatch(setGameWinners({}));

		// Reinitialize the bracket
		if (context === "wbb" && wbbBracket && wbbRankings.length) {
			const wbbBracketology = new Bracketology(wbbBracket, wbbRankings, nameTable);
			
			// Add UUIDs to each region's nodes
			Object.keys(wbbBracketology.nodeBracket).forEach((region) => {
				const typedRegion = region as Regions;
				wbbBracketology.nodeBracket[typedRegion][0] = addGameUUID(wbbBracketology.nodeBracket[typedRegion][0]);
				wbbBracketology.addFirstFourGames(wbbBracketology.nodeBracket[typedRegion]);
			});

			setBracket(wbbBracketology);
		}
		else if (context === "mbb" && mbbBracket && mbbRankings.length) {
			const mbbBracketology = new Bracketology(mbbBracket, mbbRankings, nameTable);
			
			// Add UUIDs to each region's nodes
			Object.keys(mbbBracketology.nodeBracket).forEach((region) => {
				const typedRegion = region as Regions;
				mbbBracketology.nodeBracket[typedRegion][0] = addGameUUID(mbbBracketology.nodeBracket[typedRegion][0]);
				mbbBracketology.addFirstFourGames(mbbBracketology.nodeBracket[typedRegion]);
			});

			setBracket(mbbBracketology);
		}

		// Reset Final Four state
		setFinalFourState(null);
	}

	const RoundNavigation = () => {
		const region = getRegion(getRegionNamesInOrder()[0]); // Use first region to determine total levels
		const levels = totalLevels(region);
		
		return (
			<div className={`flex items-center ${isDesktop ? 'justify-start gap-4 mb-4' : 'justify-between px-4'}`}>
				{/* Round indicator */}
				<div className="text-gray-700 font-medium">
					{roundNames[currentLevel - 1] || `Round ${currentLevel}`}
				</div>
				
				{/* Round selector */}
				<div className="flex gap-2">
					{Array.from({ length: levels }, (_, i) => i + 1).map((level) => (
						<button
							key={level}
							onClick={() => setCurrentLevel(level)}
							className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
								${currentLevel === level 
									? 'bg-indigo-600 text-white' 
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
						>
							{level}
						</button>
					))}
				</div>
			</div>
		);
	};

	const scrollToCompletionAlert = () => {
		if (completionAlertRef.current) {
			const headerOffset = isDesktop ? 128 : 0; // 128px is the header height on desktop (32px padding + ~96px content)
			const elementPosition = completionAlertRef.current.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	};

	// Initialize Final Four state when all regions are complete
	useEffect(() => {
		if (completedRegions.length === 4 && bracket) {
			const semifinalA: FinalFourGame = {
				gameId: 'semifinalA',
				regionA: bracket.data.finalFour[0][0] as Regions,
				regionB: bracket.data.finalFour[0][1] as Regions
			};
			
			const semifinalB: FinalFourGame = {
				gameId: 'semifinalB',
				regionA: bracket.data.finalFour[1][0] as Regions,
				regionB: bracket.data.finalFour[1][1] as Regions
			};

			const championship: FinalFourGame = {
				gameId: 'championship',
				regionA: 'TBD' as Regions,
				regionB: 'TBD' as Regions
			};

			setFinalFourState({
				semifinalA,
				semifinalB,
				championship
			});
		}
	}, [completedRegions.length, bracket]);

	const handleFinalFourWinner = (game: FinalFourGame, winningRegion: Regions) => {
		if (!finalFourState || !bracket) return;

		const updatedState = { ...finalFourState };
		const winningTeamName = bracket.nodeBracket[winningRegion][0].winner?.name;

		if (!winningTeamName) return;

		// Update the specific game with the winner
		if (game.gameId === 'semifinalA') {
			// If there was a different previous winner, clear championship game if it involved that winner
			if (updatedState.semifinalA.winnerRegion && 
				updatedState.semifinalA.winnerRegion !== winningRegion && 
				updatedState.championship.winnerRegion === updatedState.semifinalA.winnerRegion) {
				updatedState.championship.winnerRegion = undefined;
				updatedState.championship.winnerName = undefined;
				updatedState.champion = undefined;
			}
			
			updatedState.semifinalA.winnerRegion = winningRegion;
			updatedState.semifinalA.winnerName = winningTeamName;
			updatedState.championship.regionA = winningRegion;
		} else if (game.gameId === 'semifinalB') {
			// If there was a different previous winner, clear championship game if it involved that winner
			if (updatedState.semifinalB.winnerRegion && 
				updatedState.semifinalB.winnerRegion !== winningRegion && 
				updatedState.championship.winnerRegion === updatedState.semifinalB.winnerRegion) {
				updatedState.championship.winnerRegion = undefined;
				updatedState.championship.winnerName = undefined;
				updatedState.champion = undefined;
			}
			
			updatedState.semifinalB.winnerRegion = winningRegion;
			updatedState.semifinalB.winnerName = winningTeamName;
			updatedState.championship.regionB = winningRegion;
		} else if (game.gameId === 'championship' && game.regionA && game.regionB) {
			updatedState.championship.winnerRegion = winningRegion;
			updatedState.championship.winnerName = winningTeamName;
			updatedState.champion = {
				region: winningRegion,
				name: winningTeamName
			};
		}

		setFinalFourState(updatedState);
	};

	const simulateFinalFour = () => {
		if (!finalFourState || !bracket) return;

		const updatedState = { ...finalFourState };

		// Helper function to simulate a game between two regions
		const simulateGame = (regionA: Regions, regionB: Regions): Regions => {
			const teamA = bracket.nodeBracket[regionA][0];
			const teamB = bracket.nodeBracket[regionB][0];
			
			if (!teamA.winner || !teamB.winner) return regionA; // Default to first team if no winner
			
			const winner = Bracketology.selectGameWinner(
				{
					...teamA,
					name: teamA.winner.name,
					rating: teamA.winner.rating || 0,
					seed: teamA.winner.seed
				},
				{
					...teamB,
					name: teamB.winner.name,
					rating: teamB.winner.rating || 0,
					seed: teamB.winner.seed
				},
				randomness
			);
			
			return winner.name === teamA.winner.name ? regionA : regionB;
		};

		// Simulate semifinal A if not completed
		if (!updatedState.semifinalA.winnerRegion && updatedState.semifinalA.regionA && updatedState.semifinalA.regionB) {
			const winningRegion = simulateGame(updatedState.semifinalA.regionA, updatedState.semifinalA.regionB);
			const winningTeamName = bracket.nodeBracket[winningRegion][0].winner?.name;
			if (winningTeamName) {
				updatedState.semifinalA.winnerRegion = winningRegion;
				updatedState.semifinalA.winnerName = winningTeamName;
				updatedState.championship.regionA = winningRegion;
			}
		}

		// Simulate semifinal B if not completed
		if (!updatedState.semifinalB.winnerRegion && updatedState.semifinalB.regionA && updatedState.semifinalB.regionB) {
			const winningRegion = simulateGame(updatedState.semifinalB.regionA, updatedState.semifinalB.regionB);
			const winningTeamName = bracket.nodeBracket[winningRegion][0].winner?.name;
			if (winningTeamName) {
				updatedState.semifinalB.winnerRegion = winningRegion;
				updatedState.semifinalB.winnerName = winningTeamName;
				updatedState.championship.regionB = winningRegion;
			}
		}

		// Simulate championship if both semifinals are complete but championship isn't
		if (!updatedState.championship.winnerRegion && 
			updatedState.championship.regionA && 
			updatedState.championship.regionB && 
			updatedState.championship.regionA !== ('TBD' as Regions) && 
			updatedState.championship.regionB !== ('TBD' as Regions)) {
			const winningRegion = simulateGame(
				updatedState.championship.regionA,
				updatedState.championship.regionB
			);
			const winningTeamName = bracket.nodeBracket[winningRegion][0].winner?.name;
			if (winningTeamName) {
				updatedState.championship.winnerRegion = winningRegion;
				updatedState.championship.winnerName = winningTeamName;
				updatedState.champion = {
					region: winningRegion,
					name: winningTeamName
				};
			}
		}

		setFinalFourState(updatedState);
	};

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
								className="px-6 py-2 bg-indigo-600! text-white rounded-md hover:bg-indigo-700 transition-colors font-medium" 
								onClick={() => simulateTournament()}
							>
								Simulate Tournament
							</button>
							<button 
								className="px-6 py-2 border bg-amber-800! border-gray-300 text-gray-50 rounded-md hover:bg-gray-50 transition-colors font-medium" 
								onClick={() => clearTournament()}
							>
								Clear Tournament
							</button>
						</div>
					</div>

					{/* Completion Alert */}
					{completedRegions.length === 4 && (
						<div ref={completionAlertRef} className="bg-white rounded-lg shadow p-6 mb-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center">
									<div>
										<h2 className="text-2xl text-gray-900 font-bold">The Final Four</h2>
									</div>
								</div>
							</div>
							
							<div className="mb-6 text-center">
								<button 
									onClick={() => simulateFinalFour()}
									className="px-3 py-1.5 bg-indigo-600! text-white rounded-md hover:bg-indigo-700 transition-colors text-sm!"
								>
									Simulate Final Four
								</button>
							</div>

							{/* Final Four Bracket Display */}
							<div className="flex flex-col items-center w-full">
								{/* Semifinals Container */}
								<div className="justify-between w-full max-w-4xl gap-4 mb-8 xs:block lg:flex">
									{/* Left Game (First Pair) */}
									<div className={`flex-1 bg-gray-50 rounded-lg p-4`}>
										<div className="text-sm text-gray-500 mb-2">{bracket?.data.finalFour[0][0]} vs {bracket?.data.finalFour[0][1]}</div>
										<div className="flex flex-col gap-2">
											<button 
												onClick={() => finalFourState?.semifinalA && handleFinalFourWinner(finalFourState.semifinalA, bracket?.data.finalFour[0][0] as Regions)}
												className={`flex items-center bg-white! p-3 rounded border ${
													finalFourState?.semifinalA.winnerRegion === bracket?.data.finalFour[0][0]
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 hover:bg-gray-50'
												}`}
											>
												<span className="font-medium text-gray-900 text-center w-full">
													{bracket?.nodeBracket[bracket.data.finalFour[0][0] as Regions][0].winner?.name && (
														<>
															<span className="text-gray-500">{bracket?.nodeBracket[bracket.data.finalFour[0][0] as Regions][0].winner?.seed}. </span>
															{getTranslatedName(bracket?.nodeBracket[bracket.data.finalFour[0][0] as Regions][0].winner?.name || '')}
														</>
													) || 'TBD'}
												</span>
											</button>
											<div className="text-gray-400 text-center text-sm">vs</div>
											<button 
												onClick={() => finalFourState?.semifinalA && handleFinalFourWinner(finalFourState.semifinalA, bracket?.data.finalFour[0][1] as Regions)}
												className={`flex items-center bg-white! p-3 rounded border ${
													finalFourState?.semifinalA.winnerRegion === bracket?.data.finalFour[0][1]
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 hover:bg-gray-50'
												}`}
											>
												<span className="font-medium text-gray-900 text-center w-full">
													{bracket?.nodeBracket[bracket.data.finalFour[0][1] as Regions][0].winner?.name && (
														<>
															<span className="text-gray-500">{bracket?.nodeBracket[bracket.data.finalFour[0][1] as Regions][0].winner?.seed}. </span>
															{getTranslatedName(bracket?.nodeBracket[bracket.data.finalFour[0][1] as Regions][0].winner?.name || '')}
														</>
													) || 'TBD'}
												</span>
											</button>
										</div>
									</div>

									{/* Right Game (Second Pair) */}
									<div className={`flex-1 bg-gray-50 rounded-lg p-4`}>
										<div className="text-sm text-gray-500 mb-2">{bracket?.data.finalFour[1][0]} vs {bracket?.data.finalFour[1][1]}</div>
										<div className="flex flex-col gap-2">
											<button 
												onClick={() => finalFourState?.semifinalB && handleFinalFourWinner(finalFourState.semifinalB, bracket?.data.finalFour[1][0] as Regions)}
												className={`flex items-center bg-white! p-3 rounded border ${
													finalFourState?.semifinalB.winnerRegion === bracket?.data.finalFour[1][0]
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 hover:bg-gray-50'
												}`}
											>
												<span className="font-medium text-gray-900 w-full text-center">
													{bracket?.nodeBracket[bracket.data.finalFour[1][0] as Regions][0].winner?.name && (
														<>
															<span className="text-gray-500">{bracket?.nodeBracket[bracket.data.finalFour[1][0] as Regions][0].winner?.seed}. </span>
															{getTranslatedName(bracket?.nodeBracket[bracket.data.finalFour[1][0] as Regions][0].winner?.name || '')}
														</>
													) || 'TBD'}
												</span>
											</button>
											<div className="text-gray-400 text-center text-sm">vs</div>
											<button 
												onClick={() => finalFourState?.semifinalB && handleFinalFourWinner(finalFourState.semifinalB, bracket?.data.finalFour[1][1] as Regions)}
												className={`flex items-center bg-white! p-3 rounded border ${
													finalFourState?.semifinalB.winnerRegion === bracket?.data.finalFour[1][1]
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 hover:bg-gray-50'
												}`}
											>
												<span className="font-medium text-gray-900 w-full text-center">
													{bracket?.nodeBracket[bracket.data.finalFour[1][1] as Regions][0].winner?.name && (
														<>
															<span className="text-gray-500">{bracket?.nodeBracket[bracket.data.finalFour[1][1] as Regions][0].winner?.seed}. </span>
															{getTranslatedName(bracket?.nodeBracket[bracket.data.finalFour[1][1] as Regions][0].winner?.name || '')}
														</>
													) || 'TBD'}
												</span>
											</button>
										</div>
									</div>
								</div>

								{/* Championship (Center) */}
								<div className="w-full max-w-md bg-amber-50 rounded-lg p-4 border border-amber-200">
									<div className="text-sm text-amber-700 mb-2">Championship</div>
									<div className="flex flex-col gap-2">
										<button 
											onClick={() => finalFourState?.championship.regionA && handleFinalFourWinner(
												finalFourState.championship,
												finalFourState.championship.regionA
											)}
											disabled={!finalFourState?.semifinalA.winnerRegion}
											className={`flex items-center bg-white! p-3 rounded border ${
												finalFourState?.championship.winnerRegion === finalFourState?.championship.regionA
													? 'border-amber-500 bg-amber-50'
													: 'border-amber-200 hover:bg-amber-50'
											} ${!finalFourState?.semifinalA.winnerRegion ? 'opacity-50 cursor-not-allowed' : ''}`}
										>
											<span className="font-medium text-amber-900 w-full text-center">
												{finalFourState?.semifinalA.winnerName && (
													<>
														<span className="text-amber-600">{bracket?.nodeBracket[finalFourState.semifinalA.winnerRegion as Regions][0].winner?.seed}. </span>
														{getTranslatedName(finalFourState.semifinalA.winnerName || '')}
													</>
												) || 'TBD'}
											</span>
										</button>
										<div className="text-amber-600 text-center text-sm">vs</div>
										<button 
											onClick={() => finalFourState?.championship.regionB && handleFinalFourWinner(
												finalFourState.championship,
												finalFourState.championship.regionB
											)}
											disabled={!finalFourState?.semifinalB.winnerRegion}
											className={`flex items-center bg-white! p-3 rounded border ${
												finalFourState?.championship.winnerRegion === finalFourState?.championship.regionB
													? 'border-amber-500 bg-amber-50'
													: 'border-amber-200 hover:bg-amber-50'
											} ${!finalFourState?.semifinalB.winnerRegion ? 'opacity-50 cursor-not-allowed' : ''}`}
										>
											<span className="font-medium text-amber-900 w-full text-center">
												{finalFourState?.semifinalB.winnerName && (
													<>
														<span className="text-amber-600">{bracket?.nodeBracket[finalFourState.semifinalB.winnerRegion as Regions][0].winner?.seed}. </span>
														{getTranslatedName(finalFourState.semifinalB.winnerName || '')}
													</>
												) || 'TBD'}
											</span>
										</button>
									</div>
								</div>

								{/* Champion Display */}
								{finalFourState?.champion && (
									<div className="mt-8 text-center">
										<div className="inline-block bg-amber-100 rounded-lg p-6">
											<h3 className="text-amber-900 text-lg font-semibold mb-2">National Champion</h3>
											<div className="bg-white px-6 py-3 rounded-lg border-2 border-amber-500">
												<span className="text-2xl font-bold text-amber-900">
													{finalFourState.champion.name && (
														<>
															<span className="text-amber-600">{bracket?.nodeBracket[finalFourState.champion.region][0].winner?.seed}. </span>
															{getTranslatedName(finalFourState.champion.name || '')}
														</>
													)}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Desktop round navigation */}
					{isDesktop && (
						<div className="bg-white rounded-lg shadow p-4 mb-6">
							<RoundNavigation />
						</div>
					)}

					{getRegionNamesInOrder().map((element) => (
						<Region 
							key={element} 
							region={getRegion(element)} 
							regionName={element} 
							onSelectWinner={handleSelectWinner}
							currentLevel={currentLevel}
							randomness={randomness}
						/>	
					))}

					{/* Fixed bottom notification */}
					{completedRegions.length === 4 && (
						<div className={`fixed ${!isDesktop ? 'bottom-[72px] left-4 right-4' : 'bottom-4 left-1/2 -translate-x-1/2'} ${isDesktop ? 'w-auto' : 'w-[calc(100%-2rem)]'} bg-green-50 border border-green-200 rounded-lg shadow-lg z-40`}>
							<button 
								onClick={scrollToCompletionAlert}
								className={`${isDesktop ? 'px-6' : 'w-full'} py-3 text-center text-green-700 font-medium flex items-center justify-center gap-2`}
							>
								<svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
								</svg>
								Final Four
							</button>
						</div>
					)}

					{/* Mobile fixed bottom navigation */}
					{!isDesktop && (
						<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-50">
							<RoundNavigation />
						</div>
					)}
				</>
			) : 'No Bracket'}
		</div>
	);
};

export default Bracket;