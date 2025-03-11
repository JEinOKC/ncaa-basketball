import { useSelector } from "react-redux";
import { RootState } from "../store";
// import { setGameWinners } from "../store/stateSlice";
import { NodeType, Winners } from "../utils/Types";

interface BracketNodeProps {
	node: NodeType;
	onSelectWinner: (winner: NodeType) => void;
	currentRound: number;
}

const BracketNode: React.FC<BracketNodeProps> = ({ node, onSelectWinner, currentRound }) => {
	
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);

	// const dispatch = useDispatch();
	// const dispatchSetGameWinners = (newWinners: Winners) => {
	// 	dispatch(setGameWinners(newWinners));
	// } 


	const handleWinnerSelection = async (winner: NodeType) => {
		
		if (node.gameUUID !== undefined && winner.name) {
			
			// const safeGameUUID:string = node.gameUUID;
			// const newWinners = { ...gameWinners,[safeGameUUID]:winner.name};
			
			// dispatchSetGameWinners(newWinners);
			onSelectWinner(winner);
		}
	};
	
	return (
		<div className="flex flex-row items-center lg:pl-4" >
			<div className="flex flex-col items-start border-0 p-2 gap-2 w-45 bg-slate-200 overflow-x-clip">
				{node.left && node.right ? (
					<div className="flex flex-col space-y-2 ">
						{/* Left Team */}
						
						{node.left.name ? (
							<div className="pb-2 w-full">
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handleWinnerSelection(node.left!);
									}}
									className={`text-sm hover:text-blue-600 ${
										node.gameUUID && gameWinners[node.gameUUID] === node.left.name
											? 'font-bold text-blue-600'
											: 'text-gray-700'
									}`}
								>
									{node.left.seed}. {node.left.name}	
								</a>
							</div>
							
						)
						:
						(
							<span className="text-center text-gray-500">TBD</span>
						)}

						<hr className="w-full border-slate-300"/>

						{/* Right Team */}
						
						{node.right.name ? (
							<div className="pt-2 w-full">
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handleWinnerSelection(node.right!);
									}}
									className={`text-sm hover:text-blue-600 ${
										node.gameUUID && gameWinners[node.gameUUID] === node.right.name
											? 'font-bold text-blue-600'
											: 'text-gray-700'
									}`}
								>
									{node.right.seed}. {node.right.name}	
								</a>
							</div>
						) 
						:
						(
							<span className="text-center text-gray-500">TBD</span>
						)}	
					</div>
				) : (
					<div className="text-center">
						{node.name ? (
							<strong className="text-sm text-gray-700">{node.name}</strong>
						) : (
							<span className="text-gray-500">TBD</span>
						)}
					</div>
				)}
			</div>
			
			{
				(node.gameUUID && node.gameUUID in gameWinners && gameWinners[node.gameUUID] !== '') && (
					<div className="flex flex-col items-start p-2 ml-4 w-45 border-b border-slate-400 pb-2">
						<div className="text-sm text-gray-700">
							{gameWinners[node.gameUUID]}
						</div>
					</div>
				)
			}
			
		</div>
	);
};

export default BracketNode;
