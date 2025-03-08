import React, { useReducer, useState } from "react";
import BracketNode from "./BracketNode";
import { Regions, NodeType, Winners } from "../utils/Types";
import { useStateContext } from "../utils/StateContext";

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
	const { gameWinners, setGameWinners } = useStateContext();

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;

		const loserName = (nodesAtCurrentLevel[0].name === winner.name) ? nodesAtCurrentLevel[1].name : nodesAtCurrentLevel[0].name;

		//need to remove the previous winner all the way up the bracket, if it exists
		if(winner.ancestor.name !== winner.name){
			let traveler = winner;
			console.log({'winner name':winner.name,'ancestor':winner.ancestor.name, 'winner':winner});
			while(traveler.ancestor && traveler.ancestor.name === loserName){
				console.log({
					'traveler name ' : traveler.name,
					'traveler':traveler
				});
				
				traveler = traveler.ancestor;
				traveler.name = undefined;

				if(traveler.gameUUID !== undefined){
					console.log('traveler.gameUUID',traveler.gameUUID);
					const safeGameUUID:string = traveler.gameUUID;
					setGameWinners((prevWinners:Winners) => ({ ...prevWinners, [safeGameUUID]: '' }));
				}
				
				
			}

		}

		if(winner.name){
			winner.ancestor.winner = winner.name;
			winner.ancestor.name = winner.name;
			winner.ancestor.rating = winner.rating;
			winner.ancestor.seed = winner.seed;
		}

		console.log({'updated game winners':gameWinners});

		dispatch({ type: "update", payload: winner });
	};

	const getNodesAtLevel = (node: NodeType, level: number, current = levels): NodeType[] => {
		// console.log({
		// 	'node':node,
		// 	'level':level,
		// 	'current':current
		// })
		if (current === level) return [node];
		if (!node.left || !node.right) return [];
		return [
			...getNodesAtLevel(node.left, level, current - 1),
			...getNodesAtLevel(node.right, level, current - 1),
		];
	};

	const totalLevels = (node: NodeType): number => {
		console.log({'node':node});
		if (!node.left || !node.right || !node.gameUUID) return 0;
		
		const result =  1 + Math.max(totalLevels(node.left), totalLevels(node.right));
		console.log('total levels',result);
		return result;
	};

	const levels = totalLevels(_region);
	const nodesAtCurrentLevel = getNodesAtLevel(_region, currentLevel);
	
// console.log({'levels':levels,'_region':_region});
	return (
		<div className="p-4 flex flex-col items-left">
			<h2 className="text-xl font-bold">{regionName} Region</h2>
			<div className="mt-4 flex gap-2">
				<button disabled={currentLevel <= 1} onClick={() => setCurrentLevel((lvl) => lvl - 1)} className="p-2 border rounded disabled:opacity-50">
					Previous Round
				</button>
				<button disabled={currentLevel === levels} onClick={() => setCurrentLevel((lvl) => lvl + 1)} className="p-2 border rounded disabled:opacity-50">
					Next Round
				</button>
			</div>
			<div className="flex flex-col items-stretch gap-2">
				{nodesAtCurrentLevel.map((node) => (
					<BracketNode key={node.gameUUID} node={node} onSelectWinner={handleSelectWinner} currentRound={currentLevel} />
				))}
			</div>
			<div className="mt-4 flex gap-2">
				<button disabled={currentLevel <= 100} onClick={() => setCurrentLevel((lvl) => lvl - 1)} className="p-2 border rounded disabled:opacity-50">
					Previous Round
				</button>
				<button disabled={currentLevel === levels+100} onClick={() => setCurrentLevel((lvl) => lvl + 1)} className="p-2 border rounded disabled:opacity-50">
					Next Round
				</button>
			</div>
			<p>Current Level = {currentLevel}</p>
			<p>all levels = {levels}</p>
			<p>game winners = {JSON.stringify(gameWinners)}</p>
		</div>
	);
};

export default Region;
