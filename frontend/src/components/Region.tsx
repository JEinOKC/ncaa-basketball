import React, { useReducer, useState } from "react";
import BracketNode, { NodeType } from "./BracketNode";
import { Regions } from "../utils/Types";

interface RegionProps {
	region: NodeType;
	regionName:Regions;
}

const Region: React.FC<RegionProps> = ({ region, regionName }) => {
	const bracketReducer = (state: NodeType, action: { type: "update"; payload: NodeType }) => {
		return { ...state }; // Forces re-render
	};

	const [_region, dispatch] = useReducer(bracketReducer, region);
	const [currentLevel, setCurrentLevel] = useState(1);

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;

		winner.ancestor.winner = winner.name;
		winner.ancestor.name = winner.name;
		winner.ancestor.rating = winner.rating;
		winner.ancestor.seed = winner.seed;
		dispatch({ type: "update", payload: winner });
	};

	const getNodesAtLevel = (node: NodeType, level: number, current = levels): NodeType[] => {
		if (current === level) return [node];
		if (!node.left || !node.right) return [];
		return [
			...getNodesAtLevel(node.left, level, current - 1),
			...getNodesAtLevel(node.right, level, current - 1),
		];
	};

	const totalLevels = (node: NodeType): number => {
		if (!node.left || !node.right || !node.gameUUID) return 0;
		
		return 1 + Math.max(totalLevels(node.left), totalLevels(node.right));
	};

	const levels = totalLevels(_region);
	const nodesAtCurrentLevel = getNodesAtLevel(_region, currentLevel);
	
console.log({'levels':levels});
	return (
		<div className="p-4 flex flex-col items-center">
			<h2 className="text-xl font-bold">{regionName} Region</h2>
			<div className="flex flex-col items-center gap-2">
				{nodesAtCurrentLevel.map((node) => (
					<BracketNode key={node.gameUUID} node={node} onSelectWinner={handleSelectWinner} currentRound={currentLevel} />
				))}
			</div>
			<div className="mt-4 flex gap-2">
				<button disabled={currentLevel <= 1} onClick={() => setCurrentLevel((lvl) => lvl - 1)} className="p-2 border rounded disabled:opacity-50">
					Previous Round
				</button>
				<button disabled={currentLevel === levels} onClick={() => setCurrentLevel((lvl) => lvl + 1)} className="p-2 border rounded disabled:opacity-50">
					Next Round
				</button>
			</div>
			<p>Current Level = {currentLevel}</p>
			<p>all levels = {levels}</p>
		</div>
	);
};

export default Region;
