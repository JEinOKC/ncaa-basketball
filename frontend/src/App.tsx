import { useEffect, useState } from 'react'
import './App.css'
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import { setContext } from './store/stateSlice';
import DisplayRankings from './components/DisplayRankings';
import Bracket from './components/Bracket';
import AppLoader from './components/AppLoader';
import BracketLayout from './components/BracketLayout';
import BracketNavigation from './components/BracketNavigation';
import { Regions } from './utils/Types';

function App() {
	const wbbRankings = useSelector((state: RootState) => state.state.wbbRankings);
	const mbbRankings = useSelector((state: RootState) => state.state.mbbRankings);
	const context = useSelector((state: RootState) => state.state.context);
	const wbbBracket = useSelector((state: RootState) => state.state.wbbBracket);
	const mbbBracket = useSelector((state: RootState) => state.state.mbbBracket);
	const completedRegions = useSelector((state: RootState) => state.state.completedRegions);
	const [selectedLimit, setSelectedLimit] = useState<number>(25);
	const [areAllRegionsComplete, setAreAllRegionsComplete] = useState(false);
	const dispatch = useDispatch();

	// Monitor for all regions being complete
	useEffect(() => {
		const regions = getRegions();
		const complete = regions.length > 0 && regions.every(region => completedRegions.includes(region));
		setAreAllRegionsComplete(complete);
		
		if (complete) {
			console.log('🎉 All regions are complete! Ready for Final Four!', {
				completedRegions,
				context: context === 'wbb' ? "Women's" : "Men's"
			});
		}
	}, [completedRegions, context]);
	
	const getMaxRankingsLimit = () => {
		const currentRankings = context === 'wbb' ? wbbRankings : mbbRankings;
		return currentRankings.length;
	}

	const getRankingsLimitOptions = () => {
		const maxLimit = getMaxRankingsLimit();
		const options = [25, 50, 100, 200];
		if (maxLimit > 0 && !options.includes(maxLimit)) {
			options.push(maxLimit);
		}
		return options.filter(opt => opt <= maxLimit);
	}

	const handleLimitChange = (newLimit: number) => {
		setSelectedLimit(newLimit);
	}

	const dispatchSetContext = (newContext: 'wbb'|'mbb') => {
		dispatch(setContext(newContext));
	} 
	
	useEffect(() => {
		// Reset to default limit when context changes
		setSelectedLimit(25);
	}, [context]);

	const getContextRankingsHeadline = (context: string) => {
		return context === 'wbb' ? `Women's Basketball Top ${selectedLimit}` : `Men's Basketball Top ${selectedLimit}`;
	};

	const getContextBracketHeadline = (context: string) => {
		return context === 'wbb' ? 'Women\'s Basketball Bracket' : 'Men\'s Basketball Bracket';
	};

	const handleRegionSelect = (region: Regions) => {
		// Implement smooth scroll to region
		const element = document.getElementById(region);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const getRegions = (): Regions[] => {
		const bracket = context === 'wbb' ? wbbBracket : mbbBracket;
		if (!bracket || !bracket.finalFour) return [];
		
		const regions: Regions[] = [];
		(bracket.finalFour as Regions[][]).forEach((game: Regions[]) => {
			game.forEach((region: Regions) => {
				regions.push(region);
			});
		});
		return regions;
	};

	return (
		<AppLoader>
			<div className="min-h-screen bg-gray-50">
				<div className="py-8">
					<BracketLayout
						bracket={
							<Bracket 
								context={context} 
								headline={getContextBracketHeadline(context)} 
								limit={getMaxRankingsLimit()} 
							/>
						}
						rankings={
							<DisplayRankings 
								context={context} 
								headline={getContextRankingsHeadline(context)} 
								limit={selectedLimit}
								onLimitChange={handleLimitChange}
							/>
						}
						navigation={
							<BracketNavigation
								regions={getRegions()}
								onRegionSelect={handleRegionSelect}
							/>
						}
						contextToggle={
							<div className="flex items-center gap-6">
								<span 
									onClick={() => dispatchSetContext("mbb")} 
									className={`text-gray-700 cursor-pointer transition-colors ${
										context === "mbb" 
											? "font-bold border-b-2 border-indigo-600" 
											: "hover:text-gray-900"
									}`}
								>
									Men's Basketball
								</span>
								<span 
									onClick={() => dispatchSetContext("wbb")} 
									className={`text-gray-700 cursor-pointer transition-colors ${
										context === "wbb" 
											? "font-bold border-b-2 border-indigo-600" 
											: "hover:text-gray-900"
									}`}
								>
									Women's Basketball
								</span>
							</div>
						}
						isComplete={areAllRegionsComplete}
					/>
				</div>
			</div>
		</AppLoader>
	)
}

export default App
