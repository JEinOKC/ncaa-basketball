import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import BracketNode from "./BracketNode";
import { Regions, NodeType } from "../utils/Types";
import { isTreeComplete, updateRegionCompletion } from "../store/stateSlice";
import { getNodesAtLevel, totalLevels } from "../utils/treeUtils";
import { useMediaQuery } from 'react-responsive';

interface RegionProps {
	regionName: Regions;
	region: NodeType;
	onSelectWinner: (winner: NodeType, regionName: Regions) => void;
	currentLevel: number;
}

const Region: React.FC<RegionProps> = ({ regionName, region, onSelectWinner, currentLevel }) => {
	const dispatch = useDispatch();
	const completedRegions = useSelector((state: RootState) => state.state.completedRegions);
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);
	const lastProcessedRef = useRef<string | null>(null);
	const isDesktop = useMediaQuery({ minWidth: 1024 });

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
		const regionGameUUIDs = getAllGameUUIDs(region);
		const hasRelevantChanges = regionGameUUIDs.some(uuid => {
			const isInWinners = uuid in gameWinners;
			const isNewChange = lastProcessedRef.current !== uuid;
			return isInWinners && isNewChange;
		});
		
		setTimeout(() => {
			const regionComplete = isTreeComplete(region);
			dispatch(updateRegionCompletion({ region: regionName, isComplete: regionComplete }));
			
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

	const roundNames = ['First Round', 'Second Round', 'Sweet 16', 'Elite 8'];
	
	const RoundNavigation = () => (
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
				{isDesktop && <RoundNavigation />}
			</div>
			
			<div className="flex flex-col space-y-4">
				{nodesAtCurrentLevel.map((node: NodeType, index: number) => (
					<BracketNode
						key={node.gameUUID || index}
						node={node}
						onSelectWinner={handleSelectWinner}
						currentRound={currentLevel}
					/>
				))}
			</div>

			{/* Mobile fixed bottom navigation */}
			{!isDesktop && (
				<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-50">
					<RoundNavigation />
				</div>
			)}
		</div>
	);
};

export default Region;
