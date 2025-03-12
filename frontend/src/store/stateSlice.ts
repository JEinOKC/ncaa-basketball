import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RankingItem, BracketType, Winners, NodeType, BracketologyType, Regions } from "../utils/Types";

interface State {
	wbbRankings: RankingItem[];
	mbbRankings: RankingItem[];
	wbbBracket?: BracketType;
	mbbBracket?: BracketType;
	nameTable: { [key: string]: string };
	context: "wbb" | "mbb";
	gameWinners: Winners;
	wbbBracketology?: BracketologyType;
	mbbBracketology?: BracketologyType;
	completedRegions: Regions[];
	maxBracketDepth: number;
}

const initialState: State = {
	wbbRankings: [],
	mbbRankings: [],
	wbbBracket: undefined,
	mbbBracket: undefined,
	nameTable: {},
	context: "mbb",
	gameWinners: {},
	wbbBracketology: undefined,
	mbbBracketology: undefined,
	completedRegions: [],
	maxBracketDepth: 0
};

// Recursive function to check if the bracket tree is complete
export const isTreeComplete = (node: NodeType): boolean => {
	// Base case: if no node, consider it complete
	if (!node) return true;

	// If this is a game node (has a UUID), it must have a winner
	if (node.gameUUID && (node.winner === null || node.winner.name === undefined)) {
		// console.log('Node incomplete - no winner:', node.gameUUID);
		return false;
	}

	// If node has children, both children must be complete AND node must have a winner
	if (node.left && node.right) {
		const leftComplete = isTreeComplete(node.left);
		const rightComplete = isTreeComplete(node.right);
		const hasWinner = node.winner !== null && node.winner.name !== undefined;
		
		
		return leftComplete && rightComplete && hasWinner;
	}

	// If we get here, it's a leaf node (no children)
	const isComplete = !node.gameUUID || (node.winner !== null && node.winner.name !== undefined);
	
	return isComplete;
};

const stateSlice = createSlice({
	name: "state",
	initialState,
	reducers: {
		setWbbRankings: (state, action: PayloadAction<RankingItem[]>) => {
			state.wbbRankings = action.payload;
		},
		setMbbRankings: (state, action: PayloadAction<RankingItem[]>) => {
			state.mbbRankings = action.payload;
		},
		setWbbBracket: (state, action: PayloadAction<BracketType>) => {
			state.wbbBracket = action.payload;
		},
		setMbbBracket: (state, action: PayloadAction<BracketType>) => {
			state.mbbBracket = action.payload;
		},
		setNameTable: (state, action: PayloadAction<{ [key: string]: string }>) => {
			state.nameTable = action.payload;
		},
		setContext: (state, action: PayloadAction<"wbb" | "mbb">) => {
			state.context = action.payload;
		},
		setGameWinners: (state, action: PayloadAction<Winners>) => {
			state.gameWinners = action.payload;
		},
		setWbbBracketology: (state, action: PayloadAction<BracketologyType>) => {
			state.wbbBracketology = action.payload;
		},
		setMbbBracketology: (state, action: PayloadAction<BracketologyType>) => {
			state.mbbBracketology = action.payload;
		},
		updateRegionCompletion: (state, action: PayloadAction<{ region: Regions; isComplete: boolean }>) => {
			if (action.payload.isComplete) {
				if (!state.completedRegions.includes(action.payload.region)) {
					state.completedRegions.push(action.payload.region);
				}
			} else {
				state.completedRegions = state.completedRegions.filter(r => r !== action.payload.region);
			}
		},
		selectWinner: (state, action: PayloadAction<{ gameUUID: string; winner: string }>) => {
			console.log('Selecting winner:', action.payload);

			const updateBracket = (bracketology: BracketologyType) => {
				console.log('Updating bracket:', bracketology);
				// Helper to clear a node
				// const clearNode = (node: NodeType) => {
				// 	node.winner = null;
				// 	node.name = undefined;
				// 	node.rating = undefined;
				// 	node.seed = undefined;
				// 	if (node.gameUUID) {
				// 		delete state.gameWinners[node.gameUUID];
				// 	}
				// };

				// // Helper to update a node with team info
				// const updateNodeWithTeam = (node: NodeType, team: NodeType) => {
				// 	node.name = team.name;
				// 	node.rating = team.rating;
				// 	node.seed = team.seed;
				// };

				// // Process each region's root node
				// Object.values(bracketology.nodeBracket).forEach(nodes => {
				// 	console.log('Processing region nodes:', nodes);
				// 	const processNode = (node: NodeType) => {
				// 		console.log('Processing node:', node.gameUUID);
				// 		if (!node) return;

				// 		// If this is our target game
				// 		if (node.gameUUID === action.payload.gameUUID) {
				// 			console.log('Target Game Found: Processing node:', node.gameUUID);
				// 			const previousWinner = node.winner;

				// 			// If winner is changing, clear ancestors
				// 			if (previousWinner && previousWinner !== action.payload.winner) {
				// 				let current = node.ancestor;
				// 				while (current) {
				// 					clearNode(current);
				// 					current = current.ancestor;
				// 				}
				// 			}

				// 			// Set new winner
				// 			node.winner = action.payload.winner;

				// 			// Update node properties
				// 			if (node.left && node.left.name === action.payload.winner) {
				// 				updateNodeWithTeam(node, node.left);
				// 			} else if (node.right && node.right.name === action.payload.winner) {
				// 				updateNodeWithTeam(node, node.right);
				// 			}

				// 			// Update gameWinners
				// 			state.gameWinners[node.gameUUID] = action.payload.winner;

				// 			// Update immediate ancestor
				// 			if (node.ancestor) {
				// 				updateNodeWithTeam(node.ancestor, node);
				// 				node.ancestor.winner = node.name ?? null;
				// 				if (node.ancestor.gameUUID) {
				// 					state.gameWinners[node.ancestor.gameUUID] = node.name ?? '';
				// 				}
				// 			}
				// 		}

				// 		// Continue searching
				// 		if (node.left) processNode(node.left);
				// 		if (node.right) processNode(node.right);
				// 	};

				// 	// Start processing from root node
				// 	if (nodes && nodes.length > 0) {
				// 		processNode(nodes[0]);
				// 	}
				// });
			};

			console.log('state.context:', state.context);
			console.log('state.wbbBracketology:', state.wbbBracketology);
			console.log('state.mbbBracketology:', state.mbbBracketology);

			// Update the appropriate bracket
			if (state.context === "wbb" && state.wbbBracketology) {
				updateBracket(state.wbbBracketology);
			}
			else if (state.context === "mbb" && state.mbbBracketology) {
				updateBracket(state.mbbBracketology);
			}
		},
		setMaxBracketDepth: (state, action: PayloadAction<number>) => {
			state.maxBracketDepth = action.payload;
		},
	},
});

export const { 
	setWbbRankings, 
	setMbbRankings, 
	setWbbBracket, 
	setMbbBracket, 
	setNameTable, 
	setContext, 
	setGameWinners, 
	setWbbBracketology,
	setMbbBracketology,
	updateRegionCompletion,
	selectWinner,
	setMaxBracketDepth
} = stateSlice.actions;

export default stateSlice.reducer;
