export interface SelectionCommitteeType {
	year: number;
	tournamentStartDate: string;
}

export interface MasseyEndpointsType {
	teams: string;
	games: {
		inter: string;
		intra: string;
		all: string;
	}
}

export interface MasseyEndpointsByYearType {
	[key: string]: {
		masseyID: number;
		tournamentStartDate: string;
	}
}

export interface TeamDataType {
	id: number;
	games: {
		opponent: string;
		site: string;
		margin: number;
	}[];
}

export interface GameTeamDataType {
	id: number;
	score: number;
	scoreDiff: number;
	site: string;
	name: string;
	opponent: string;
	gameDate: string;
}

export interface GameDataType {
	teamA: GameTeamDataType;
	teamB: GameTeamDataType;
	neutral: boolean;
}

export interface TeamSummaryDataType {
	id: number;	
	ranking: number;
	rating: number;
	averageOpponentRanking: number;
	averageOpponentRating: number;
	averageScoringMargin: number;
	gameCount: number;
	bidType: string;
	wins:{
		quad1: number;
		quad2: number;
		quad3: number;
		quad4: number;
	}
	losses:{
		quad1: number;
		quad2: number;
		quad3: number;
		quad4: number;
	}
	
}

export interface YearRankingsType {
	team_id: number;
	team_name: string;
	rank: number;
	rating: number;
	bid_type: string;
}

export interface TeamSummaryWithProbabilityType extends TeamSummaryDataType {
	probability: number;
	prediction: number;
	rawDecisionValue: number;
	teamName: string;
}


export type TeamDataMap = Map<string, TeamDataType>;
export type TeamSummaryMap = Map<string, TeamSummaryDataType>;