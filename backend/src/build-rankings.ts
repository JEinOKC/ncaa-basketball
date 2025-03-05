import fs from 'fs';
import path from 'path';

interface leagueEndpointsType {
	teams: string;
	games: {
		intra: string;
		inter: string;
		all: string;
	};
};

interface leaguesObjectType {
	year: number;
	womensbb : leagueEndpointsType;
	mensbb : leagueEndpointsType;
};


const endpoints:leaguesObjectType = require('./config/endpoints.json');
const MasseyLeague = require('./lib/massey.ts');
const rankingMethods = require('generic-ranking-methods');
const dataDir = path.join(__dirname, '../data'); // Adjust based on your structure

/*------- run this code to create the data directory and place rankings inside it -------*/

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export const main = async () => {
	try {
		console.log("🚀 Generating JSON files...");
		await Promise.all([womensbb(), mensbb()]);
		console.log("🎉 All JSON files generated!");
	} catch (error) {
		console.error("❌ Error generating JSON:", error);
		process.exit(1); // Exit with error
	}
}

//generate women's basketball rankings
const womensbb = async () => {
	console.log('initializing womens basketball rankings');
	const massey = new MasseyLeague(endpoints.womensbb.teams, endpoints.womensbb.games.intra, endpoints.womensbb.games.inter);
	await massey.loadEverything();
	const currentRatings = massey.generateRankings();

	// Write JSON to file
	fs.writeFileSync(path.join(dataDir, 'womensbb-rankings.json'), JSON.stringify(currentRatings, null, 2));
	console.log('womens rankings written');
}

//generate men's basketball rankings
const mensbb = async () => {
	console.log('initializing mens basketball rankings');
	const massey = new MasseyLeague(endpoints.mensbb.teams, endpoints.mensbb.games.intra, endpoints.mensbb.games.inter);
	await massey.loadEverything();
	const currentRatings = massey.generateRankings();

	// Write JSON to file
	fs.writeFileSync(path.join(dataDir, 'mensbb-rankings.json'), JSON.stringify(currentRatings, null, 2));
	console.log('mens rankings written');
}

// Run main function if file is run directly
if (require.main === module) {
	main();
}