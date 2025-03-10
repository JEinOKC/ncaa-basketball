import { useEffect } from 'react'
import './App.css'
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import { setContext } from './store/stateSlice';
import DisplayRankings from './components/DisplayRankings';
import Bracket from './components/Bracket';
import AppLoader from './components/AppLoader';

function App() {
	const wbbRankings = useSelector((state: RootState) => state.state.wbbRankings);
	const mbbRankings = useSelector((state: RootState) => state.state.mbbRankings);
	const context = useSelector((state: RootState) => state.state.context);

	const dispatch = useDispatch();
	
	const dispatchSetContext = (newContext: 'wbb'|'mbb') => {
		dispatch(setContext(newContext));
	} 
	
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
		<AppLoader>
			<Bracket context={context} headline={getContextBracketHeadline(context)} limit={25} />
			<div className="context-switcher text-right">
				<button 
					onClick={() => dispatchSetContext("mbb")} 
					className={context === "mbb" ? "active" : "" + "m-2"}
					>
					Men's Basketball
				</button>
				<button 
					onClick={() => dispatchSetContext("wbb")} 
					className={context === "wbb" ? "active" : "" + "m-2"}
					>
					Women's Basketball
				</button>
			</div>
			<h1>Context = {context}</h1>
			<DisplayRankings context={context} headline={getContextRankingsHeadline(context)} limit={25} />
		</AppLoader>
	)
}

export default App
