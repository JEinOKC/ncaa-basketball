import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { main } from './build-rankings';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.use(cors());
app.use(bodyParser.json({limit: '5mb'}));

app.get('/api/health', (req: Request, res: Response) => {
	res.status(200).send('OK');
});

app.get('/api/ncaawbb', async (req: Request, res: Response) => {
	// const massey = new MasseyLeague(endpoints.womensbb.teams, endpoints.womensbb.games.intra, endpoints.womensbb.games.inter);
	// await massey.loadEverything();
	// const currentRatings = massey.generateRankings();

	const currentRatings = fs.readFileSync(path.join(__dirname, '../data/womensbb-rankings.json'), 'utf8');

	res.status(200).send(currentRatings);

});

app.get('/api/ncaambb', async (req: Request, res: Response) => {

	const currentRatings = fs.readFileSync(path.join(__dirname, '../data/mensbb-rankings.json'), 'utf8');

	res.status(200).send(currentRatings);

});

app.get('/api/generate-rankings', async (req: Request, res: Response) => {
	await main();
	res.status(200).send('Rankings generated');
});

app.listen(PORT, () => {
	console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
console.log('initialized express');

/*------- run this code to create the data directory and place rankings inside it -------*/

const dataDir = path.join(__dirname, '../data'); // Adjust based on your structure

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}