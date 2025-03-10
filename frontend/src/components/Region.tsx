import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import BracketNode from "./BracketNode";
import { Regions, NodeType } from "../utils/Types";
import { selectWinner, isTreeComplete, updateRegionCompletion } from "../store/stateSlice";

interface RegionProps {
	regionName: Regions;
	region: NodeType;
	onSelectWinner: (winner: NodeType, regionName: Regions) => void;
}

const Region: React.FC<RegionProps> = ({ regionName, region, onSelectWinner }) => {
	const dispatch = useDispatch();
	const [currentLevel, setCurrentLevel] = useState(1);
	const completedRegions = useSelector((state: RootState) => state.state.completedRegions);
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);
	const lastProcessedRef = useRef<string | null>(null);

	// Function to get all game UUIDs in the region
	const getAllGameUUIDs = (node: NodeType): string[] => {
		const uuids: string[] = [];
		if (node.gameUUID) uuids.push(node.gameUUID);
		if (node.left) uuids.push(...getAllGameUUIDs(node.left));
		if (node.right) uuids.push(...getAllGameUUIDs(node.right));
		return uuids;
	};

	// Check completion status whenever relevant state changes
	useEffect(() => {
		// Get all game UUIDs in this region
		const regionGameUUIDs = getAllGameUUIDs(region);
		
		// Check if any of our region's games are in gameWinners
		const hasRelevantChanges = regionGameUUIDs.some(uuid => {
			const isInWinners = uuid in gameWinners;
			const isNewChange = lastProcessedRef.current !== uuid;
			return isInWinners && isNewChange;
		});
		
		if (hasRelevantChanges) {
			// Small delay to ensure state is updated
			setTimeout(() => {
				// console.log('Region effect triggered:', {
				// 	regionName,
				// 	regionGameUUIDs,
				// 	relevantWinners: Object.entries(gameWinners)
				// 		.filter(([uuid]) => regionGameUUIDs.includes(uuid))
				// 		.map(([uuid, winner]) => ({ uuid, winner }))
				// });

				const regionComplete = isTreeComplete(region);
				// console.log('Region completion check:', {
				// 	regionName,
				// 	isComplete: regionComplete,
				// 	regionRoot: {
				// 		gameUUID: region.gameUUID,
				// 		winner: region.winner,
				// 		hasLeft: !!region.left,
				// 		hasRight: !!region.right
				// 	}
				// });

				dispatch(updateRegionCompletion({ region: regionName, isComplete: regionComplete }));
				
				// Update the last processed game
				const changedGame = regionGameUUIDs.find(uuid => lastProcessedRef.current !== uuid && uuid in gameWinners);
				if (changedGame) {
					lastProcessedRef.current = changedGame;
				}
			}, 0);
		}
	}, [region, regionName, dispatch, gameWinners]);

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;

		onSelectWinner(winner, regionName);

		

		
	};

	const getNodesAtLevel = (node: NodeType | null, level: number, current = levels): NodeType[] => {
		if (!node) return [];
		if (current === level) return [node];
		if (!node.left || !node.right) return [];
		return [
			...getNodesAtLevel(node.left, level, current - 1),
			...getNodesAtLevel(node.right, level, current - 1),
		];
	};

	const totalLevels = (node: NodeType | null): number => {
		if (!node || !node.left || !node.right || !node.gameUUID) return 0;
		return 1 + Math.max(totalLevels(node.left), totalLevels(node.right));
	};

	if (!region) return <div>No bracket data available for {regionName}.</div>;

	const levels = totalLevels(region);
	const nodesAtCurrentLevel = getNodesAtLevel(region, currentLevel);
	const isRegionComplete = completedRegions.includes(regionName);
	
	return (
		<div className="mb-8">
			<div className="flex items-center mb-4">
				<h2 className="text-xl font-bold mr-4">{regionName} Region</h2>
				{isRegionComplete && (
					<span className="text-green-500" title="Region Complete">
						✓
					</span>
				)}
			</div>
			<div className="flex flex-col space-y-4">
				{nodesAtCurrentLevel.map((node, index) => (
					<BracketNode
						key={node.gameUUID || index}
						node={node}
						onSelectWinner={handleSelectWinner}
						currentRound={currentLevel}
					/>
				))}
			</div>
			<div className="mt-4 space-x-2">
				<button
					onClick={() => setCurrentLevel(Math.max(1, currentLevel - 1))}
					disabled={currentLevel === 1}
					className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
				>
					Previous Round
				</button>
				<button
					onClick={() => setCurrentLevel(Math.min(levels, currentLevel + 1))}
					disabled={currentLevel === levels}
					className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
				>
					Next Round
				</button>
			</div>
		</div>
	);
};

export default Region;
