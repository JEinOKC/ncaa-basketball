import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Bracketology } from "../utils/bracketology";
import { NodeType } from "../utils/Types";
import { faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface BracketNodeProps {
	node: NodeType;
	onSelectWinner: (winner: NodeType) => void;
	currentRound: number;
	randomness: number;
}

const BracketNode: React.FC<BracketNodeProps> = ({ node, onSelectWinner, randomness }) => {
	
	const gameWinners = useSelector((state: RootState) => state.state.gameWinners);	
	const nameTable = useSelector((state: RootState) => state.state.nameTable);
	const [gameIsExpanded, setGameIsExpanded] = useState(false);
	const [gameOdds, setGameOdds] = useState({
		topTeamBasicOdds: 0.5,
		bottomTeamBasicOdds: 0.5,
		topTeamSkewedOdds: 0.5,
		bottomTeamSkewedOdds: 0.5
	});

	useEffect(() => {
		if(gameIsExpanded && node.left && node.right){
			const gameOdds = Bracketology.getGameOdds(node.left, node.right, randomness);
			setGameOdds(gameOdds);
		}
	}, [gameIsExpanded, gameWinners, node.left, node.right, randomness]);
	
	const handleWinnerSelection = async (winner: NodeType) => {
		
		if (node.gameUUID !== undefined && winner.name) {
			onSelectWinner(winner);
			setGameIsExpanded(false)
		}
	};

	const getTranslatedName = (name:string) => {
		return nameTable[name] || name;
	}


	
	return (
		<div className="flex flex-row items-center lg:pl-4" >
			<div className={`flex flex-col items-start border-0 p-2 gap-2 bg-slate-200 overflow-x-clip ${gameIsExpanded ? 'w-75' : 'w-45'}`}>
				
				<div className={`bg-white ${gameIsExpanded ? 'w-75' : 'w-45'} -mx-2 -mt-2 border border-slate-300 text-right pr-2`}>
					<a href="#" onClick={(e) =>{
						e.preventDefault();
						setGameIsExpanded(!gameIsExpanded);
					}}
					className={`text-sm hover:text-blue-600`}>
						{gameIsExpanded ? (
							<FontAwesomeIcon icon={faCompress} />
						) : 
						(
							<FontAwesomeIcon icon={faExpand} />
						)}
					</a>

				</div>

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
									{node.left.seed}. {getTranslatedName(node.left.name)}	
									{gameIsExpanded && (
										<div className="mt-2 p-2 bg-gray-100 rounded-lg shadow-inner w-70">
											<div className="text-sm text-gray-700">
												<div className="flex justify-between">
													<span className="font-semibold">Rating:</span>
													<span>{node.left.rating?.toFixed(4)}</span>
												</div>
												<div className="flex justify-between">
													<span className="font-semibold">Basic Odds:</span>
													<span>{(gameOdds.topTeamBasicOdds * 100).toFixed(2)}%</span>
												</div>
												<div className="mt-2 text-center border-t border-slate-300 pt-2">
													<span className="font-bold text-xl block">Win Probability</span>
													<span className="text-4xl font-bold block" style={{ color: `rgb(${200 * (1 - gameOdds.topTeamSkewedOdds)}, ${160 * gameOdds.topTeamSkewedOdds}, 40)` }}>
														{(gameOdds.topTeamSkewedOdds * 100).toFixed(2)}%
													</span>
												</div>
											</div>
										</div>
									)}
								</a>
							</div>
							
						)
						:
						(
							<span className="text-center text-gray-500">TBD</span>
						)}

						{ gameIsExpanded ? (
							<button className="text-sm bg-indigo-600! text-white rounded-md hover:bg-indigo-700 transition-colors p-2"
								onClick={() => {
									//select winner based off of current win probability
									const winner = Bracketology.selectGameWinner(node.left!, node.right!, randomness);

									if(winner){
										handleWinnerSelection(winner);
									}
									
								}}
							>
								Simulate Game
							</button>
						) : (
							<hr className="w-full border-slate-300"/>
						)}
						
						

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
									{node.right.seed}. {getTranslatedName(node.right.name)}	
									{gameIsExpanded && (
										<div className="mt-2 p-2 bg-gray-100 rounded-lg shadow-inner w-70">
											<div className="text-sm text-gray-700">
												<div className="flex justify-between">
													<span className="font-semibold">Rating:</span>
													<span>{node.right.rating?.toFixed(4)}</span>
												</div>
												<div className="flex justify-between">
													<span className="font-semibold">Basic Odds:</span>
													<span>{(gameOdds.bottomTeamBasicOdds * 100).toFixed(2)}%</span>
												</div>
												<div className="mt-2 text-center border-t border-slate-300 pt-2">
													<span className="font-bold text-xl block">Win Probability</span>
													<span className="text-4xl font-bold block" style={{ color: `rgb(${200 * (1 - gameOdds.bottomTeamSkewedOdds)}, ${160 * gameOdds.bottomTeamSkewedOdds}, 40)` }}>
														{(gameOdds.bottomTeamSkewedOdds * 100).toFixed(2)}%
													</span>
												</div>
											</div>
										</div>
									)}
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
				(!gameIsExpanded && node.gameUUID && node.gameUUID in gameWinners && gameWinners[node.gameUUID] !== '') && (
					<div className="flex flex-col items-start p-2 ml-4 w-45 border-b border-slate-400 pb-2">
						<div className="text-sm text-gray-700">
							{getTranslatedName(gameWinners[node.gameUUID] || '')}
						</div>
					</div>
				)
			}
			
		</div>
	);
};

export default BracketNode;
