import React, { useReducer, useState, useEffect } from "react";
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
	const { isTreeComplete, gameWinners, setGameWinners } = useStateContext();
	
	// const findNodeSibling = (node:NodeType):NodeType|null =>{
	// 	if(!node.ancestor){
	// 		return null;
	// 	}

	// 	const ancestor = node.ancestor;

	// 	const leftNode = ancestor.left;
	// 	const rightNode = ancestor.right;

	// 	if(leftNode?.name === node.name && leftNode?.rating === node.rating){
	// 		return rightNode;
	// 	}

	// 	return leftNode;
	// }

	// const resetNode = (node:NodeType):NodeType =>{

	// 	node.name = undefined;
	// 	node.seed = undefined;
	// 	node.rating = undefined;
	// 	node.score = null;	

	// 	return node;
	// };

	const handleSelectWinner = (winner: NodeType) => {
		if (!winner.ancestor) return;

		const ancestor = winner.ancestor;
		const previousWinner = ancestor.winner;

		// Assign the winner to the ancestor
		if(winner.name){
			
			ancestor.winner = winner.name;
			ancestor.name = winner.name;
			ancestor.rating = winner.rating;
			ancestor.seed = winner.seed;
		}

		// const loserNode = findNodeSibling(winner);

		// const loserName = loserNode ? loserNode.name : undefined;
console.log({'winner!':winner});

		//need to remove the previous winner all the way up the bracket, if it exists
		if(previousWinner && previousWinner !== winner.name){
			let traveler = winner;
			
			while(traveler.ancestor && traveler.ancestor.name === previousWinner){
				// Reset the old winner in the ancestor nodes
				traveler.ancestor.winner = "";
				traveler.ancestor.name = undefined;
				traveler.ancestor.rating = undefined;
				traveler.ancestor.seed = undefined;
				traveler = traveler.ancestor;

				if(traveler.gameUUID !== undefined){
					const safeGameUUID:string = traveler.gameUUID;
					setGameWinners((prevWinners:Winners) => ({ 
						...prevWinners, 
						[safeGameUUID]: '' 
					}));
				}
				
			}

		}

		
console.log({'ancestor':winner.ancestor,'_region fater update':_region,'region':region});

		dispatch({ type: "update", payload: { ...region} });
	};

	const isRegionComplete = () =>{
		return isTreeComplete(_region);
	}

	useEffect( ()=>{
		console.log('game winners changed');
		const regionComplete = isTreeComplete(_region);
		console.log({
			'region name':regionName,
			'is the region complete now?':regionComplete,
			'region':_region
		});
	},[_region] )

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
		if (!node.left || !node.right || !node.gameUUID) return 0;
		
		const result =  1 + Math.max(totalLevels(node.left), totalLevels(node.right));
		
		return result;
	};

	const levels = totalLevels(_region);
	const nodesAtCurrentLevel = getNodesAtLevel(_region, currentLevel);
	

	return (
		<div className="p-4 flex flex-col items-left">
			<h2 className="text-xl font-bold">{regionName} Region {isRegionComplete() && (<>COMPLETE!!</>)}</h2>
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
				<button disabled={currentLevel <= 1} onClick={() => setCurrentLevel((lvl) => lvl - 1)} className="p-2 border rounded disabled:opacity-50">
					Previous Round
				</button>
				<button disabled={currentLevel === levels} onClick={() => setCurrentLevel((lvl) => lvl + 1)} className="p-2 border rounded disabled:opacity-50">
					Next Round
				</button>
			</div>
		</div>
	);
};

export default Region;
