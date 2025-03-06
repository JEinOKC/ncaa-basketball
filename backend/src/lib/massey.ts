import { parse } from 'csv-parse/sync';
import { CollegeNameFormatter } from './college-name-formatter';

const rankingMethods = require('generic-ranking-methods');
const nameTable:{ [key: string]: string } = require('../../data/name-table.json');

interface FormattedGameType {
	calcs: {
		home_team_code: number;
		opponent_code: number;
		ptDiff: number;
		homeRep: number;
		awayRep: number;
	};
};

interface FormattedTeamType {
	team_id: number;
	team_name: string;
	rank: number;
	rating: number;
};

interface GameTeamType {
	id: number;
	score: number;
	site: string;
	name: string;
};

interface GameType {
	teamA: GameTeamType;
	teamB: GameTeamType;
	conference: boolean;
};

interface TeamType {
	masseyName: string;
	prettyName: string;
}

interface MasseyLeagueType {
	teams: Map<number, TeamType>;
	games: Array<GameType>;
	intraGamesURL: string;
	interGamesURL: string;
	namesURL: string;

	parseCSV(input: string): any;
	processNameResults(myResults: string): void;
	determineGameSite(homeFieldNum: number): string;
	getAllGames(): Array<GameType>;
	getAllTeams(): any;
	findName(teamID: number): string;
	nameTheTeams(): void;
	processGamesResults(myResults: string, isIntra: boolean): void;
	loadInter(): Promise<any>;
	loadIntra(): Promise<any>;
	loadNames(): Promise<any>;
	getHomeFieldAdvantageAverage(masseyGames: any): number;
	formatGames(): any;
	formatTeams(allTeams: any): FormattedTeamType[];
	getNamePairs(): any;
	loadEverything(): Promise<void>;
	generateRankings(): any;
};

class MasseyLeague implements MasseyLeagueType {
	teams: Map<number, TeamType> = new Map();
	games:GameType[] = [];

	interGamesURL: string;
	intraGamesURL: string;
	namesURL: string;

	constructor(teamsURL:string,intraGamesURL:string, interGamesURL:string){
		this.teams = new Map();
		this.games = [];

		this.interGamesURL = interGamesURL;
		this.intraGamesURL = intraGamesURL;

		this.namesURL = teamsURL;
	}

	parseCSV(input:string){
		var records = parse(input);
		return records;
	}

	processNameResults(myResults:string){
		var records = this.parseCSV(myResults);

		for(let i=0;i<records.length;i++){
			let currentRecord = records[i];
			const masseyName = currentRecord[1].trim()

			this.teams.set(parseInt(currentRecord[0].trim()), {
				masseyName: masseyName,
				prettyName: nameTable[masseyName] ? nameTable[masseyName] : CollegeNameFormatter.formatCollegeName(masseyName)
			});

		}
	}

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

	getAllGames():Array<GameType>{
		return this.games;
	}

	getAllTeams(format:'massy'|'pretty'='massy'){
		const teamsJson = Array.from(this.teams, ([id, team]) => ({ id, name: format === 'pretty' ? team.prettyName : team.masseyName }));

		return teamsJson;
	}

	findName(teamID:number,format:'massy'|'pretty'='massy'){
		const team = this.teams.get(teamID);

		if(team){
			return format === 'pretty' ? team.prettyName : team.masseyName;
		}
		else{
			return 'unknown';
		}

	}

	getNamePairs(){
		var mappingObject:{ [key: string]: string } = {};
		this.teams.forEach((value,key) => {
			mappingObject[value.masseyName] = value.prettyName;
		});
		
		return mappingObject;
	}

	nameTheTeams(){
		for(let i=0;i<this.games.length;i++){
			this.games[i].teamA.name = this.findName(this.games[i].teamA.id, 'pretty');
			this.games[i].teamB.name = this.findName(this.games[i].teamB.id, 'pretty');
		}
	}

	processGamesResults(myResults:string,isIntra:boolean){
		var records = this.parseCSV(myResults);

		for(let i=0;i<records.length;i++){
			let currentRecord = records[i];
			let game:GameType = {
				'teamA' : {
					'id' : parseInt(currentRecord[2].trim()),
					'score' : parseInt(currentRecord[4].trim()),
					'site' : this.determineGameSite(currentRecord[3].trim()),
					'name' : ''
				},
				'teamB' : {
					'id' : parseInt(currentRecord[5].trim()),
					'score' : parseInt(currentRecord[7].trim()),
					'site' : this.determineGameSite(currentRecord[6].trim()),
					'name' : ''
				},
				conference : isIntra
			};

			this.games.push(game);
		}
	}

	processIntraResults(myResults:string){
		this.processGamesResults(myResults,true);
	}

	processInterResults(myResults:string){
		this.processGamesResults(myResults,false);
	}

	async loadEverything(){
		const [nameResults, interResults, intraResults] = await Promise.all([this.loadNames(),this.loadInter(),this.loadIntra()]);

		this.processNameResults(nameResults);
		this.processInterResults(interResults);
		this.processIntraResults(intraResults);
		
		this.nameTheTeams();
	}

	//intra-conference games -->  list games if both teams are members of the selected conference
	async loadIntra(){

		const response = await fetch(this.intraGamesURL);

		if(response.status !== 200){
			throw new Error('Unable to load games');
		}

		return response.text();

	}

	//inter-conference games --> list games that involve a team outside the selected conference
	async loadInter(){

		const response = await fetch(this.interGamesURL);

		if(response.status !== 200){
			throw new Error('Unable to load games');
		}

		return response.text();

	}

	//id/name pairs
	async loadNames(){

		const response = await fetch(this.namesURL);

		if(response.status !== 200){
			throw new Error('Unable to load games');
		}

		return response.text();

	}

	getHomeFieldAdvantageAverage(): number {
		var homePoints:number = 0;
		var roadPoints:number = 0;
		var gamesCount:number = 0;

		const masseyGames = this.getAllGames();

		for(let i=0;i<masseyGames.length;i++){
			let currentGame = masseyGames[i];

			if(currentGame.teamA.site == 'home'){
				homePoints += currentGame.teamA.score;
				roadPoints += currentGame.teamB.score;
			}
			else if(currentGame.teamA.site == 'road'){
				homePoints += currentGame.teamB.score;
				roadPoints += currentGame.teamA.score;
			}

			gamesCount+=1;//gamesCount != length because of neutral site games

		}

		const ptDiffCnt = homePoints - roadPoints;
		const HomeFieldAdv = ptDiffCnt/gamesCount;
		

		return HomeFieldAdv;
	}

	formatGames():FormattedGameType[]{
		const HomeFieldAdv = this.getHomeFieldAdvantageAverage();
		const allGames = this.getAllGames();

		var formattedGames:FormattedGameType[] = [];
	
		/*
			format of array item:
			{
				'teamA' : {
					'id' : integer
					'score' : integer
					'site' : home|neutral|road
				},
				'teamB' : {
					'id' : integer
					'score' : integer
					'site' : home|neutral|road
				},
				conference : true|false
			}
	
			format we need to get it into:
			{
				"calcs": {
					"home_team_code": 1,
					"opponent_code": 2,
					"ptDiff" : 14, 
					"homeRep" : 1,
					"awayRep" : -1
				}
	
			}
	
	
	
		*/
	
		for(let i=0;i<allGames.length;i++){
			let currentGame:GameType = allGames[i];
			let currentHomeTeam:"teamA"|"teamB" = 'teamA';
			let isNeutralSite = false;
	
			if(currentGame.teamB.site == 'home'){
				currentHomeTeam = 'teamB';
			}
			else if(currentGame.teamB.site == 'neutral'){
				isNeutralSite = true;
			}
	
			if(!isNeutralSite){
				currentGame[currentHomeTeam].score = currentGame[currentHomeTeam].score - HomeFieldAdv;
			}
	
			let currentRoadTeam:"teamA"|"teamB" = ( currentHomeTeam == 'teamA' ? 'teamB' : 'teamA' );
	
			let calcs = {
				'home_team_code' : currentGame[currentHomeTeam].id,
				'opponent_code' : currentGame[currentRoadTeam].id,
				'ptDiff' : this.determinePointDiff(currentGame[currentHomeTeam].score,currentGame[currentRoadTeam].score,currentGame.conference),
				'homeRep' : ( currentGame[currentHomeTeam].score > currentGame[currentRoadTeam].score ? 1 : -1 ),
				'awayRep' : ( currentGame[currentHomeTeam].score < currentGame[currentRoadTeam].score ? 1 : -1 )
			};
	
	
			if(calcs.ptDiff != 0){
				formattedGames.push({'calcs':calcs});
			}
	
			
		}
	
		return formattedGames;
	};

	formatTeams():FormattedTeamType[] {
		const allTeams = this.teams;
		var formattedTeams:FormattedTeamType[] = [];

		/*
			allTeams is an object - not an array. Keys = id. Value = team name

			formate we need to get it into:

			{
				"team_id": 1,
				"team_name": "New York"
			}
		*/

		allTeams.forEach((team:TeamType,key:number) => {
			
			let newTeam:FormattedTeamType = {
				team_id : key,
				team_name : team ? team.prettyName : 'unknown',
				rank : 0,
				rating : 0
			};

			formattedTeams.push(newTeam);
		});

		return formattedTeams;
	}

	determinePointDiff(homeScore:number,roadScore:number,isInConference:boolean):number{
		//home score is already altered for home field advantage
	
		const totalScore:number = homeScore + roadScore;
		var winnerPoints:number = totalScore;
		var loserPoints:number = 0;
		var ratio:number = 0;
	
		
		if(homeScore > roadScore){
			winnerPoints = homeScore;
			loserPoints = roadScore;
		}
		else{
			winnerPoints = roadScore;
			loserPoints = homeScore;
		}
	
		  if(isNaN(winnerPoints/totalScore)){
			  return ratio;
		  }
			  
		ratio = winnerPoints/totalScore;
	
		  if(isInConference){
			  ratio = ratio * 1.1;
		  }
		  
		return ratio;
	};

	generateRankings():any{
		const formattedGames = this.formatGames();
		const formattedTeams = this.formatTeams();
		const rankingResults = rankingMethods.Run(formattedTeams, formattedGames);

		//the teams and results are tied together by index
		for(var i=0;i<formattedTeams.length;i++){
			formattedTeams[i].rating = rankingResults[i][0];
		}
	
		//now that the ratings are set, we are free to sort the teams by rating
		const teamsSortedByRating = formattedTeams.sort((a,b) => b.rating - a.rating);
	
		for(i=0;i<teamsSortedByRating.length;i++){
			teamsSortedByRating[i].rank = i+1;
		}

		return teamsSortedByRating;
	}
};

module.exports = MasseyLeague;