import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RankingItem, BracketType, Winners, Regions, NodeType } from './Types';
import { v4 as uuidv4 } from 'uuid';

const StateContext = createContext<State | undefined>(undefined);

export const StateProvider = ({ children }: { children: ReactNode }) => {
	const [wbbRankings, setWbbRankings] = useState<RankingItem[]>([]);
	const [mbbRankings, setMbbRankings] = useState<RankingItem[]>([]);

	const [wbbBracket, setWbbBracket] = useState<BracketType>();
	const [mbbBracket, setMbbBracket] = useState<BracketType>();

	const [gameWinners, setGameWinners] = useState<Winners>({});

	const [nameTable, setNameTable] = useState<{[key:string]:string}>({});

	const [context, setContext] = useState<"wbb"|"mbb">("mbb");

	const isTreeComplete = (node:NodeType):boolean =>{

		//not a game, we have reached the end of the tree
		if(!node.gameUUID){
			return true;
		}
		else if(node.winner === null || node.winner === ''){
			console.log({'failure at this node':node});
			return false;
		}

		if(node.left && node.right){
			return isTreeComplete(node.left) && isTreeComplete(node.right);
		}

		//in case we get here, the tree is unbalanced. die false
		console.log('failed at the end where we should not get to');
		return false;
	}

	useEffect(() => {
		fetch(`/data/womensbb-rankings.json`)
			.then((response) => response.json())
			.then((tmpRankings) => setWbbRankings(tmpRankings))
			.catch((error) => console.error("Error loading JSON:", error));

		fetch(`/data/mensbb-rankings.json`)
			.then((response) => response.json())
			.then((json) => setMbbRankings(json))
			.catch((error) => console.error("Error loading JSON:", error));
		
		fetch(`/data/womensbb-bracket.json`)
			.then((response) => response.json())
			.then((tmpRankings:BracketType) => {

				// const regions = tmpRankings.regions;
				// regions.forEach((region)=>{
				// 	addGameUUID(region.name);
				// })
				
				setWbbBracket(tmpRankings)
			})
			.catch((error) => console.error("Error loading JSON:", error));
		
		fetch(`/data/mensbb-bracket.json`)
			.then((response) => response.json())
			.then((tmpRankings:BracketType) => {
				
				// const regions = tmpRankings.regions;
				// regions.forEach((region)=>{
				// 	addGameUUID(region.name);
				// })
				// console.log({'updates after adding uuids':tmpRankings});
				setMbbBracket(tmpRankings)
			})
			.catch((error) => console.error("Error loading JSON:", error));

		fetch(`/data/name-table.json`)
			.then((response) => response.json())
			.then((json) => {
				console.log('name table json', json);
				setNameTable(json);
			})
			.catch((error) => console.error("Error loading JSON:", error));


	}, []);
	

	return (
		<StateContext.Provider 
		value={{ 
			wbbRankings,
			mbbRankings,
			wbbBracket,
			mbbBracket,
			nameTable,
			context,
			setContext,
			gameWinners,
			setGameWinners,
			isTreeComplete
		}}>
		{children}
		</StateContext.Provider>
	);
};

export const useStateContext = () => {
	const context = useContext(StateContext);
	if (!context) {
		throw new Error('useStateContext must be used within an StateProvider');
	}
	return context;
};
