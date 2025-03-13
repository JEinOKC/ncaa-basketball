export type Regions = "East"|"West"|"South"|"Midwest"|"Albany"|"Houston"|"Minneapolis"|"Sacramento";
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
	finalFour: "East"|"West"|"South"|"Midwest"|"Albany"|"Houston"|"Minneapolis"|"Sacramento"[][];	
	regions: RegionType[];
	teams: Record<Regions,string[]>;
}

export interface NodeType{
	left:NodeType|null;
	right:NodeType|null;
	winner:WinnerType|null;
	score:number|null;
	gameUUID?:string;
	ancestor?:NodeType;
	name?:string;
	seed?:number;
	rating?:number;
}

export interface WinnerType{
	name?:string;
	rating?:number;
	seed?:number;
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
	findMaxDepth: (node: NodeType) => number;
	getBracket: () => Record<Regions,NodeType[]>;
	getData: () => BracketType;
	getTeamOrder: (size: number) => number[];
	createNode: () => NodeType;
	placeTeamInNodeArray: (nodeArray: any[], team: any, leftOrRight: leftOrRight) => any[];
	buildWeeks: (nodeArray: any[]) => any[];
	findGameById: (gameId: string) => NodeType | null;
	lookupRating: (teamName: string) => number | string;
	buildGames: () => { bracket: Record<Regions, NodeType[]>; maxDepth: number };
	addFirstFourGames: (regionNodes: NodeType[]) => void;
}

export interface FinalFourGame {
    gameId: string;
    regionA: Regions;
    regionB: Regions;
    winnerRegion?: Regions;
    winnerName?: string;
}

export interface FinalFourState {
    semifinalA: FinalFourGame;
    semifinalB: FinalFourGame;
    championship: FinalFourGame;
    champion?: {
        region: Regions;
        name: string;
    };
}