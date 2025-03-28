import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import BracketNode from "./BracketNode";
import { Regions, NodeType } from "../utils/Types";
import { updateRegionCompletion } from "../store/stateSlice";

interface RegionProps {
	regionName: Regions;
	region: NodeType;
	onSelectWinner: (winner: NodeType, regionName: Regions) => void;
	currentLevel: number;
	randomness: number;
}

const Region: React.FC<RegionProps> = ({ regionName, region, onSelectWinner, currentLevel, randomness }) => {
	const dispatch = useDispatch();
	const completedRegions = useSelector((state: RootState) => state.state.completedRegions);
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);
	const maxBracketDepth = useSelector((state: RootState) => state.state.maxBracketDepth);
	const roundNames = ['First Four', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];

	// Function to get all game UUIDs in the region
	const getAllGameUUIDs = (node: NodeType): string[] => {
		const uuids: string[] = [];
		if (node.gameUUID && node.left && node.right) uuids.push(node.gameUUID);
		if (node.left) uuids.push(...getAllGameUUIDs(node.left));
		if (node.right) uuids.push(...getAllGameUUIDs(node.right));
		return uuids;
	};

	// Get nodes at a specific level
	const getNodesAtLevel = (node: NodeType, targetLevel: number, currentLevel: number): NodeType[] => {
		if (!node) return [];
		if (currentLevel === targetLevel) return [node];
		
		// Continue traversal even if one side is missing
		const leftNodes = node.left ? getNodesAtLevel(node.left, targetLevel, currentLevel - 1) : [];
		const rightNodes = node.right ? getNodesAtLevel(node.right, targetLevel, currentLevel - 1) : [];
		return [...leftNodes, ...rightNodes];
	};

	// Check completion status whenever relevant state changes
	useEffect(() => {
		const regionGameUUIDs = getAllGameUUIDs(region);
		
		// A region is complete when all its games have winners
		const regionComplete = regionGameUUIDs.every(uuid => {
			return uuid in gameWinners;
		});

		dispatch(updateRegionCompletion({ region: regionName, isComplete: regionComplete }));
		
	}, [region, regionName, dispatch, gameWinners]);

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;
		onSelectWinner(winner, regionName);
	};

	if (!region) return <div>No bracket data available for {regionName}.</div>;

	const nodesAtCurrentLevel = getNodesAtLevel(region, currentLevel, maxBracketDepth);
	const isRegionComplete = completedRegions.includes(regionName);
	
	return (
		<div id={regionName} className="mb-8 scroll-mt-20">
			<div className="bg-white rounded-lg shadow p-4 mb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<h2 className="text-2xl text-gray-900 font-bold mr-4">{regionName} Region</h2>
						{isRegionComplete && (
							<span className="text-green-500 text-xl" title="Region Complete">
								✓
							</span>
						)}
					</div>
					<div className="text-gray-700 font-medium">
						{roundNames[currentLevel - 1] || `Round ${currentLevel}`}
					</div>
				</div>
			</div>
			
			<div className="flex flex-col space-y-4">
				{(() => {
					const filteredNodes = nodesAtCurrentLevel.filter(node => node.gameUUID && node.left && node.right);
					return filteredNodes.length > 0 ? (
						filteredNodes.map((node: NodeType) => (
							<BracketNode
								key={node.gameUUID}
								node={node}
								onSelectWinner={handleSelectWinner}
								currentRound={currentLevel}
								randomness={randomness}
							/>
						))
					) : (
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<p className="text-gray-500">There are no {roundNames[currentLevel - 1]} games in the {regionName} Region</p>
						</div>
					);
				})()}
			</div>
		</div>
	);
};

export default Region;
