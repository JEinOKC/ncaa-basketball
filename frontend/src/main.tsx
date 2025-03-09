import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StateProvider } from './utils/StateContext.tsx';
import { Provider } from "react-redux";
import { store } from "./store";

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<StateProvider>
				<App />
			</StateProvider>
		</Provider>
	</StrictMode>,
)
