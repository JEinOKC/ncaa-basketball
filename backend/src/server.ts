import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { main } from './build-rankings';
import { SelectionCommittee } from './lib/selection-committee';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.get('/api/game-results/:year', async (req: Request, res: Response) => {
	const year = parseInt(req.params.year);
	const selectionCommittee = new SelectionCommittee(year);
	const gameResults = await selectionCommittee.getGameResults(year);	

	//write team summaries to the archive folder
	fs.writeFileSync(path.join(__dirname, `../data/archive/mensbb-team-summaries-${year}.json`), JSON.stringify(gameResults.teamSummaries, null, 2));

	res.status(200).send(gameResults);

	// console.log(`initializing mens basketball rankings for ${year}`);
});

// app.get('/api/selection-committee/:year', async (req: Request, res: Response) => {
app.get('/api/build-archive-ratings/:year', async (req: Request, res: Response) => {
	const MasseyLeague = require('./lib/massey');
	const dataDir = path.join(__dirname, '../data/archive');
	const year = parseInt(req.params.year);
	const selectionCommittee = new SelectionCommittee(year);
	const endpoints = selectionCommittee.getMasseyEndpoints(year);

	console.log(`initializing mens basketball rankings for ${year}`);
	const massey = new MasseyLeague(endpoints.teams, endpoints.games.intra, endpoints.games.inter);
	await massey.loadEverything();
	

	interface TeamType {
		team_id: number;
		team_name: string;
		rank: number;
		rating: number;
		seed?: number;
	}

	const currentRatings:TeamType[] = massey.generateRankings();
	const tournament = fs.readFileSync(path.join(__dirname, `../data/archive/mensbb-tournament-${year}.json`), 'utf8');
	const tournamentData = JSON.parse(tournament);

	const teamSummaries = fs.readFileSync(path.join(__dirname, `../data/archive/mensbb-team-summaries-${year}.json`), 'utf8');
	const teamSummariesData = JSON.parse(teamSummaries);


	//add seed to the currentRatings

	//add seed = 69 to all the teams that don't have a bid (1 spot outside of tourney)
	currentRatings.forEach((team:TeamType) => {
		if (!team.seed) {
			team.seed = 69;
		}
	});

	tournamentData.forEach((team:any) => {
		const teamName = team.team_name;
		const seed = team.seed;
		
		//match team_name to currentRatings.team_name
		const teamId = currentRatings.find((t:TeamType) => t.team_name === teamName)?.team_id;
		if (teamId) {
			const matchedTeam = currentRatings.find((t: TeamType) => t.team_id === teamId);
			if (matchedTeam) {
				matchedTeam.seed = seed;
				console.log({'team matched':matchedTeam});
			} else {
				console.log(`Team with ID ${teamId} not found in currentRatings`);
			}
		}
		else{
			console.log(`team ${teamName} not found in currentRatings`);
		}

		//update teamSummariesData with seed
		teamSummariesData[teamName].seed = seed;

	});

	// Write JSON to file
	fs.writeFileSync(path.join(dataDir, `mensbb-rankings-${year}.json`), JSON.stringify(currentRatings, null, 2));
	console.log(`mens rankings written for ${year}`);

	fs.writeFileSync(path.join(dataDir, `mensbb-team-summaries-${year}.json`), JSON.stringify(teamSummariesData, null, 2));
	console.log(`mens team summaries written for ${year}`);


	res.status(200).send(endpoints);
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