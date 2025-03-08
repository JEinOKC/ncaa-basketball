import { useState, useEffect } from 'react'
import './App.css'
import { useStateContext } from './utils/StateContext';
import DisplayRankings from './components/DisplayRankings';
import Bracket from './components/Bracket';

function App() {
	
	const { 
		wbbRankings, mbbRankings
		, context, setContext

	} = useStateContext();
	
	useEffect(() => {
		// console.log(wbbRankings);
		// console.log(mbbRankings);
	}, [wbbRankings, mbbRankings]);

	const getContextRankingsHeadline = (context: string) => {
		return context === 'wbb' ? 'Women\'s Basketball Top 25' : 'Men\'s Basketball Top 25';
	};

	const getContextBracketHeadline = (context: string) => {
		return context === 'wbb' ? 'Women\'s Basketball Bracket' : 'Men\'s Basketball Bracket';
	};



	return (
		<>
			<Bracket context={context} headline={getContextBracketHeadline(context)} limit={25} />
			<div className="context-switcher text-right">
				<button 
					onClick={() => setContext("mbb")} 
					className={context === "mbb" ? "active" : "" + "m-2"}
					>
					Men's Basketball
				</button>
				<button 
					onClick={() => setContext("wbb")} 
					className={context === "wbb" ? "active" : "" + "m-2"}
					>
					Women's Basketball
				</button>
			</div>
			<h1>Context = {context}</h1>
			<DisplayRankings context={context} headline={getContextRankingsHeadline(context)} limit={25} />
		</>
	)
}

export default App
