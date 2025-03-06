import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RankingItem, BracketType } from './Types';

const StateContext = createContext<State | undefined>(undefined);

export const StateProvider = ({ children }: { children: ReactNode }) => {
	const [wbbRankings, setWbbRankings] = useState<RankingItem[]>([]);
	const [mbbRankings, setMbbRankings] = useState<RankingItem[]>([]);

	const [wbbBracket, setWbbBracket] = useState<BracketType>();
	const [mbbBracket, setMbbBracket] = useState<BracketType>();

	const [nameTable, setNameTable] = useState<{[key:string]:string}>({});

	const [context, setContext] = useState<"wbb"|"mbb">("mbb");

	useEffect(() => {
		fetch(`/data/womensbb-rankings.json`)
			.then((response) => response.json())
			.then((json) => setWbbRankings(json))
			.catch((error) => console.error("Error loading JSON:", error));

		fetch(`/data/mensbb-rankings.json`)
			.then((response) => response.json())
			.then((json) => setMbbRankings(json))
			.catch((error) => console.error("Error loading JSON:", error));
		
		fetch(`/data/womensbb-bracket.json`)
			.then((response) => response.json())
			.then((json) => setWbbBracket(json))
			.catch((error) => console.error("Error loading JSON:", error));
		
		fetch(`/data/mensbb-bracket.json`)
			.then((response) => response.json())
			.then((json) => setMbbBracket(json))
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
			setContext
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
