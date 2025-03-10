export type Regions = "East"|"West"|"South"|"Midwest";
export type leftOrRight = "left"|"right";
export type Winners = Record<string,string>;

export interface RankingItem {
	rank: number;
	rating: number;
	team_id: number;
	team_name: string;
}

export interface RegionType{
	id:Regions;
	name:Regions;
	fullName:string;
}

export interface BracketType{
	finalFour: "East"|"West"|"South"|"Midwest"[][];	
	regions: RegionType[];
	teams: Record<Regions,string[]>;
}

export interface NodeType{
	left:NodeType|null;
	right:NodeType|null;
	winner:string|null;
	score:number|null;
	gameUUID?:string;
	ancestor?:NodeType;
	name?:string;
	seed?:number;
	rating?:number;
}

export interface BracketologyType{
	data:BracketType;
	nameTable:{[key:string]:string};
	nodeBracket: Record<Regions,NodeType[]>;
	ratings: Record<string,number|string>;
	ratingsArray: RankingItem[];
	regionsMerged: boolean;
	mergeRegions: () => void;
	setWinner: (gameId: string, winnerName: string) => void;
}