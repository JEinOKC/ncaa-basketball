import { configureStore } from "@reduxjs/toolkit";
import bracketReducer from "./bracketSlice";

export const store = configureStore({
	reducer: {
		bracket: bracketReducer, // Add the bracket reducer
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
