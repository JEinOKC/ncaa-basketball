import { useState } from "react";
import { NodeType } from "../utils/Types";

interface BracketNodeProps {
	node: NodeType;
	onSelectWinner: (winner: NodeType) => void;
	currentRound: number;
}

const BracketNode: React.FC<BracketNodeProps> = ({ node, onSelectWinner, currentRound }) => {
	const [round, setRound] = useState(currentRound);
	// const [winner, setWinner] = useState('');

	const handleWinnerSelection = (winner: NodeType) => {
		if (winner.name) {
			// setWinner(winner.name);
			onSelectWinner(winner);
		}
	};

	const isWinner = (node: NodeType):boolean => {
console.log({'winner??':node.ancestor?.winner,'node name':node.name,'node':node});
		if(node.ancestor?.winner === node.name){
			return true;
		}

		return false;
	};

	return (
		<div className="flex flex-col items-center border p-2">
			{node.left && node.right ? (
				<div className="flex flex-col space-y-2">
					{/* Left Team */}
					<button
						onClick={() => handleWinnerSelection(node.left!)}
						className="p-1 border hover:bg-green-200"
					>
						{node.left.seed}. {node.left.name} {isWinner(node.left) ? <>Winner!</> : <></>}
					</button>

					{/* Right Team */}
					<button
						onClick={() => handleWinnerSelection(node.right!)}
						className="p-1 border hover:bg-green-200"
					>
						{node.right.seed}. {node.right.name} {isWinner(node.right) ? <>Winner!</> : <></>}
					</button>
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
	);
};

export default BracketNode;
