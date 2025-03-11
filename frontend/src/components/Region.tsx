import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import BracketNode from "./BracketNode";
import { Regions, NodeType } from "../utils/Types";
import { selectWinner, isTreeComplete, updateRegionCompletion } from "../store/stateSlice";
import { getNodesAtLevel, totalLevels } from "../utils/treeUtils";

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
		
		// Always check completion status, even if there are no changes
		setTimeout(() => {
			const regionComplete = isTreeComplete(region);
			dispatch(updateRegionCompletion({ region: regionName, isComplete: regionComplete }));
			
			// Update the last processed game only if there were changes
			if (hasRelevantChanges) {
				const changedGame = regionGameUUIDs.find(uuid => lastProcessedRef.current !== uuid && uuid in gameWinners);
				if (changedGame) {
					lastProcessedRef.current = changedGame;
				}
			}
		}, 0);
	}, [region, regionName, dispatch, gameWinners]);

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;
		onSelectWinner(winner, regionName);
	};

	if (!region) return <div>No bracket data available for {regionName}.</div>;

	const levels = totalLevels(region);
	const nodesAtCurrentLevel = getNodesAtLevel(region, currentLevel, levels);
	const isRegionComplete = completedRegions.includes(regionName);
	
	return (
		<div id={regionName} className="mb-8 scroll-mt-20">
			<div className="bg-white rounded-lg shadow p-4 mb-4">
				<div className="flex items-center">
					<h2 className="text-2xl text-gray-900 font-bold mr-4">{regionName} Region</h2>
					{isRegionComplete && (
						<span className="text-green-500 text-xl" title="Region Complete">
							✓
						</span>
					)}
				</div>
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
					className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
				>
					Previous Round
				</button>
				<button
					onClick={() => setCurrentLevel(Math.min(levels, currentLevel + 1))}
					disabled={currentLevel === levels}
					className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
				>
					Next Round
				</button>
			</div>
		</div>
	);
};

export default Region;
