import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NodeType } from "../utils/Types";

interface BracketState {
	regions: Record<string, NodeType>; // Stores each region’s root node
}

const initialState: BracketState = {
	regions: {},
};

// Helper function to find a node by gameUUID
const findNodeByGameUUID = (node: NodeType, gameUUID: string): NodeType | null => {
	if (node.gameUUID === gameUUID) return node;
	if (node.left) {
		const leftResult = findNodeByGameUUID(node.left, gameUUID);
		if (leftResult) return leftResult;
	}
	if (node.right) {
		const rightResult = findNodeByGameUUID(node.right, gameUUID);
		if (rightResult) return rightResult;
	}
	return null;
};

// Helper function to update the winner in the tree
const updateWinnerInTree = (node: NodeType, gameUUID: string, winner: NodeType) => {
	const gameNode = findNodeByGameUUID(node, gameUUID);
	if (gameNode) {
		gameNode.winner = winner.name;
		gameNode.name = winner.name;
		gameNode.rating = winner.rating;
		gameNode.seed = winner.seed;
	}
};

const bracketSlice = createSlice({
	name: "bracket",
	initialState,
	reducers: {
		setRegion: (state, action: PayloadAction<{ regionName: string; region: NodeType }>) => {
			state.regions[action.payload.regionName] = action.payload.region;
		},
		updateWinner: (state, action: PayloadAction<{ gameUUID: string; winner: NodeType }>) => {
			const region = Object.values(state.regions).find((r) => findNodeByGameUUID(r, action.payload.gameUUID));
			if (region) {
				updateWinnerInTree(region, action.payload.gameUUID, action.payload.winner);
			}
		},
	},
});

export const { setRegion, updateWinner } = bracketSlice.actions;
export default bracketSlice.reducer;
