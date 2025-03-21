import _mbbEndpointsByYear from '../config/mbb-endpoints-by-year.json';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { CollegeNameFormatter } from './college-name-formatter';
import { SelectionCommitteeType, MasseyEndpointsType, MasseyEndpointsByYearType, TeamDataType, GameTeamDataType, GameDataType, TeamSummaryDataType, YearRankingsType, TeamDataMap, TeamSummaryMap, TeamSummaryWithProbabilityType } from './types';

const mbbEndpointsByYear = _mbbEndpointsByYear as MasseyEndpointsByYearType;
const nameTable:{ [key: string]: string } = require(path.join(__dirname, '../../data/name-table.json'));


export class SelectionCommittee implements SelectionCommitteeType {
	year: number;
	teams: TeamDataMap;
	teamSummaries: TeamSummaryMap;
	tournamentStartDate: string;
	yearRankings: YearRankingsType[];

	constructor(year: number) {
		this.year = year;
		this.teams = new Map();
		this.teamSummaries = new Map();
		
		this.tournamentStartDate = this.getTournamentStartDate(year);
		this.yearRankings = this.getYearRankings(year);
	}

	static mapToObject = <K, V>(map: Map<K, V>): Record<string | number | symbol, V> => {
		return Object.fromEntries(map.entries());
	};

	getTeamSummariesFromFile():TeamSummaryMap {
		const dataDir = path.join(__dirname, '../../data/archive');
		const summaries = JSON.parse(fs.readFileSync(path.join(dataDir, `mensbb-team-summaries-${this.year}.json`), 'utf8'));

		return new Map(Object.entries(summaries));
	}

	getTeamSummaryFromFile(teamName: string):TeamSummaryDataType {
		const dataDir = path.join(__dirname, '../../data/archive');

		//this is a json file that is a map of team names to team summaries
		const summaries = JSON.parse(fs.readFileSync(path.join(dataDir, `mensbb-team-summaries-${this.year}.json`), 'utf8'));

		if(!summaries[teamName]){
			throw new Error(`Team ${teamName} not found in year ${this.year}`);
		}

		return summaries[teamName];
	}

	getTeamRanking(teamName: string):YearRankingsType {
		const teamRanking = this.yearRankings.find((ranking: YearRankingsType) => ranking.team_name === teamName);

		if(!teamRanking){
			throw new Error(`Team ${teamName} not found in year ${this.year}`);
		}

		return teamRanking;
	}

	getYearRankings(year: number):YearRankingsType[] {
		const dataDir = path.join(__dirname, '../../data/archive');
		const rankings = JSON.parse(fs.readFileSync(path.join(dataDir, `mensbb-rankings-${year}.json`), 'utf8'));
		
		return rankings;
	}

	getMasseyEndpoints(year: number): MasseyEndpointsType {
		const yearAsString = year.toString();
		const endpoints = mbbEndpointsByYear[yearAsString];
		const masseyID = endpoints.masseyID;


		return {
			teams: `https://masseyratings.com/scores.php?s=${masseyID}&sub=11590&all=1&mode=3&format=2`,
			games: {
				inter: `https://masseyratings.com/scores.php?s=${masseyID}&sub=11590&all=1&mode=1&format=1`,
				intra: `https://masseyratings.com/scores.php?s=${masseyID}&sub=11590&all=1&mode=2&format=1`,
				all: `https://masseyratings.com/scores.php?s=${masseyID}&sub=11590&all=1&mode=3&format=1`
			}
		}
		
	}

	getTournamentStartDate(year: number) {
		const yearAsString = year.toString();
		const endpoints = mbbEndpointsByYear[yearAsString];
		const tournamentStartDate = endpoints.tournamentStartDate;

		return tournamentStartDate;
	}

	async getTeamNames(year: number):Promise<Map<string,string>> {
		const endpoints = this.getMasseyEndpoints(year);
		const response = await fetch(endpoints.teams);
		const data = await response.text();
		const records = parse(data);

		return this.cleanTeamNames(records);
	}

	setGameDataByTeam(gameTeam:GameTeamDataType){
		let team = null;
		
		let existingTeam = this.teams.get(gameTeam.name.toString());

		if(existingTeam){
			team = existingTeam;
		}
		else{
			team = {id: gameTeam.id, games: []};
		}

		let margin = gameTeam.scoreDiff;

		if(margin > 10){
			margin = 10;
		}
		else if(margin < -10){
			margin = -10;
		}
		

		team.games.push({
			opponent: gameTeam.opponent,
			site: gameTeam.site,
			margin: margin
		});

		this.teams.set(gameTeam.name.toString(), team);
		
	}

	async getGameResults(year: number) {
		const endpoints = this.getMasseyEndpoints(year);

		const [response,teams] = await Promise.all([
			fetch(endpoints.games.all),
			this.getTeamNames(year),
		]);
		
		const data = await response.text();
		const records = parse(data);
		const cleanedRecords = this.cleanGameResults(records,teams);



		for (const game of cleanedRecords.games) {
			this.setGameDataByTeam(game.teamA);
			this.setGameDataByTeam(game.teamB);
		}
			
		
		//now we should have the ability to determine all of the NCAA selection criteria (other than efficiency, but I think they're lying about that anyway)
		
		/*
				net rating - use our own ratings
				strength of schedule - average ranking of opponents
				scoring marging - loop through games. teamA.score - teamB.score. 10 points is the maximum margin. 
				quality wins/losses - use the rankings to determine quality. 
		*/

		//now this.teams has all the games and scoring margins

		//loop through the cleanedRecords and assign wins and losses to each team
		this.teams.forEach((team,teamName) => {
			this.setTeamSummary(teamName);
		});
		


		return {
			'games' : cleanedRecords.games,
			'teams' : SelectionCommittee.mapToObject(this.teams),
			'teamSummaries' : SelectionCommittee.mapToObject(this.teamSummaries)
		};
	}

	setTeamSummary(teamName: string) {
		const team = this.teams.get(teamName);

		if(!team){
			throw new Error(`Team ${teamName} not found`);
		}

		const teamRanking = this.getTeamRanking(teamName);

		const teamSummary:TeamSummaryDataType = {
			id: teamRanking.team_id,
			ranking: teamRanking.rank,
			rating: teamRanking.rating,
			averageOpponentRanking: 0,
			averageOpponentRating: 0,
			averageScoringMargin: 0,
			gameCount: team.games.length,
			wins: {
				quad1: 0,
				quad2: 0,
				quad3: 0,
				quad4: 0
			},
			losses: {
				quad1: 0,
				quad2: 0,
				quad3: 0,
				quad4: 0
			},
			seed: 0
		};

		let sumOpponentRanking = 0;
		let sumOpponentRating = 0;
		let sumScoringMargin = 0;

		for(const game of team.games){
			const opponentRanking = this.getTeamRanking(game.opponent).rank;

			sumScoringMargin += game.margin;
			sumOpponentRanking += opponentRanking;
			sumOpponentRating += this.getTeamRanking(game.opponent).rating;

			const quad = this.determineQuad(opponentRanking,game.site);

			if(game.margin > 0){//teamA wins
				teamSummary.wins[quad]++;
			}
			else{
				teamSummary.losses[quad]++;
			}
			
		}

		teamSummary.averageOpponentRanking = sumOpponentRanking / team.games.length;
		teamSummary.averageOpponentRating = sumOpponentRating / team.games.length;
		teamSummary.averageScoringMargin = sumScoringMargin / team.games.length;

		this.teamSummaries.set(teamName,teamSummary);
		
	}

	determineQuad(opponentRanking: number,site: string){
		/*

			site is either home, road, or neutral
			opponentRanking is the ranking of the opponent
			we need to determine which quad the game is in

			home games:
			quad1 = 1-30
			quad2 = 31-75
			quad3 = 76-160
			quad4 = 161+

			road games:
			quad1 = 1-75
			quad2 = 76-135
			quad3 = 136-240
			quad4 = 241+

			neutral games:
			quad1 = 1-50
			quad2 = 51-100
			quad3 = 101-200
			quad4 = 201+
			
		*/

		if(site === 'home'){
			if(opponentRanking <= 30){
				return 'quad1';
			}
			else if(opponentRanking <= 75){
				return 'quad2';
			}
			else if(opponentRanking <= 160){
				return 'quad3';
			}
			else{
				return 'quad4';
			}
		}
		else if(site === 'road'){
			if(opponentRanking <= 75){
				return 'quad1';
			}
			else if(opponentRanking <= 135){
				return 'quad2';
			}
			else if(opponentRanking <= 240){
				return 'quad3';
			}
			else{
				return 'quad4';
			}
		}
		else if(site === 'neutral'){
			if(opponentRanking <= 50){
				return 'quad1';
			}
			else if(opponentRanking <= 100){
				return 'quad2';
			}
			else if(opponentRanking <= 200){
				return 'quad3';
			}
			else{
				return 'quad4';
			}
		}

		throw new Error("Invalid quad determination");
		
	}

	cleanTeamNames(teams: any):Map<string,string> {
		

		const cleanedTeams: {id: string, name: string}[] = teams.map((team: any) => {
			return {
				'id' : team[0].trim(),
				'name' : SelectionCommittee.getPrettyTeamName(team[1].trim())
			};
		});

		//convert json to map where the id is the key and the name is the value
		const teamMap = new Map(cleanedTeams.map((team: any) => [team.id, team.name]));

		return teamMap;
	}

	static getPrettyTeamName(teamName: string) {
		return nameTable[teamName] ? nameTable[teamName] : CollegeNameFormatter.formatCollegeName(teamName);
	}

	cleanGameResults(records: any,teams: any):{games:GameDataType[],teams:TeamDataMap} {
		const cleanedRecords = records
		.filter((record: any) => {

			//massey date format is YYYYMMDD
			const masseyDate = record[1].trim();
			const masseyYear = masseyDate.substring(0,4);
			const masseyMonth = masseyDate.substring(4,6);
			const masseyDay = masseyDate.substring(6,8);

			const tournamentStartDate = this.tournamentStartDate;

			const masseyDateObject = new Date(masseyYear, masseyMonth - 1, masseyDay);
			const tournamentStartDateObject = new Date(tournamentStartDate);

			return masseyDateObject <= tournamentStartDateObject;
			
		})
		.map((record: any) => {

			var teamA:GameTeamDataType = {
				'id' : parseInt(record[2].trim()),
				'score' : parseInt(record[4].trim()),
				'scoreDiff' : parseInt(record[4].trim()) - parseInt(record[7].trim()),
				'site' : this.determineGameSite(record[3].trim()),
				'name' :  teams.get(record[2].trim()) || 'unknown',
				'opponent' : teams.get(record[5].trim()) || 'unknown',
				'gameDate' : record[1].trim()
			};
			
			var teamB:GameTeamDataType = {
				'id' : parseInt(record[5].trim()),
				'score' : parseInt(record[7].trim()),
				'scoreDiff' : parseInt(record[7].trim()) - parseInt(record[4].trim()),
				'site' : this.determineGameSite(record[6].trim()),
				'name' : teams.get(record[5].trim()) || 'unknown',
				'opponent' : teams.get(record[2].trim()) || 'unknown',
				'gameDate' : record[1].trim()
			};

			return {
				teamA: teamA,
				teamB: teamB,
				neutral: teamA.site === 'neutral' ? true : false
			};

		});

		return {
			teams : teams,
			games : cleanedRecords
		};
	}

	//pulled from massey.ts
	determineGameSite(homeFieldNum:number){
		//(1=home, -1=away, 0=neutral)

		if(homeFieldNum == 1){
			return 'home';
		}
		else if(homeFieldNum == 0){
			return 'neutral';
		}
		else{
			return 'road';
		}
		
	}
	
}