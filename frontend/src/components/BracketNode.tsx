import { useState, useEffect } from "react";
import { NodeType, Winners } from "../utils/Types";
import { useStateContext } from "../utils/StateContext";

interface BracketNodeProps {
	node: NodeType;
	onSelectWinner: (winner: NodeType) => void;
	currentRound: number;
}

const BracketNode: React.FC<BracketNodeProps> = ({ node, onSelectWinner, currentRound }) => {
	
	const { gameWinners, setGameWinners } = useStateContext();

	const handleWinnerSelection = async (winner: NodeType) => {
		
		if (node.gameUUID !== undefined && winner.name) {
			
			const safeGameUUID:string = node.gameUUID;
			const newWinners = { ...gameWinners,[safeGameUUID]:winner.name};
			
			setGameWinners(newWinners);
			onSelectWinner(winner);
		}
	};
	
	return (
		<div className="flex flex-row items-center" >
			<div className="flex flex-col items-center border p-2 gap-2 w-45">
				{node.left && node.right ? (
					<div className="flex flex-col space-y-2">
						{/* Left Team */}
						
						{
							node.left.name ? (
								<>
									<button
										onClick={() => handleWinnerSelection(node.left!)}
										className="p-1 border hover:bg-green-200"
									>
										{node.left.seed}. {node.left.name}	
									</button>
								</>
							)
							:
							(
								<span className="text-center text-gray-500">TBD</span>
							)
						}

						{/* Right Team */}
						
						{
							node.right.name ? (
								<>
									<button
										onClick={() => handleWinnerSelection(node.right!)}
										className="p-1 border hover:bg-green-200"
									>
										{node.right.seed}. {node.right.name}	
									</button>
								</>
							) 
							:
							(
								<span className="text-center text-gray-500">TBD</span>
							)
						}	
					</div>
				) : (
					<div className="border p-2 text-center">
						{node.name ? (
							<strong>{node.name}</strong>
						) : (
							<span className="text-gray-500">TBD</span>
						)}
					</div>
				)}
			</div>
			
			{
				(node.gameUUID && node.gameUUID in gameWinners && gameWinners[node.gameUUID] !== '') && (
					<div className="flex flex-col items-center border p-2 ml-4 w-45">
						<div>
							{gameWinners[node.gameUUID]}
						</div>
					</div>
				)
			}
			
		</div>
	);
};

export default BracketNode;
