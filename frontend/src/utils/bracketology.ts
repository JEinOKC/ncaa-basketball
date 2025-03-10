import { RankingItem, Regions, leftOrRight, BracketType, NodeType, BracketologyType } from './Types';


class Bracketology implements BracketologyType{
	data:BracketType;
	regionsMerged:boolean;
	ratingsArray:RankingItem[];
	ratings:Record<string,number|string>;
	nodeBracket:Record<string,any[]>;
	nameTable:Record<string,string>;
	
	constructor(data:BracketType,ratingsArray:RankingItem[], nameTable:{ [key: string]: string }){
		this.data = data;
		this.regionsMerged = false;
		this.ratingsArray=ratingsArray;
		this.ratings = {};
		this.nameTable = nameTable;

		this.nodeBracket = this.buildGames();
		
	}
	getData(){
		return this.data;
	}

	getTeamOrder(size:number){

		if(size == 16){
			return [1,16,8,9,5,12,4,13,6,11,14,3,10,7,15,2];	
		}
		else if(size == 8){//cut the array down for 8
			return [1,8,5,4,6,3,7,2];	
		}
		else if(size == 4){
			return [1,4,3,2];		
		}
		else if(size == 2){
			return [1,2];
		}

		throw "unable to sort an array of that size";

	}

	getBracket(){
		return this.nodeBracket;
	}

	createNode():NodeType{
		return {
			'left' : null,
			'right' : null,
			'winner' : null,
			'score' : null
		};
	}

	placeTeamInNodeArray(nodeArray:any[],team:any,leftOrRight:leftOrRight){
		//each team element must be an object. we will assign an ancestor value into that object, so if it is anything else, we will create an object and push the definition into 'value'
		if(typeof team !== 'object'){
			team.value = team;
		}
		var newNode = null;

		if(leftOrRight == 'left'){
			//left branches get filled first, so only the last one needs to be checked
			if(nodeArray[nodeArray.length-1].left === null){
				nodeArray[nodeArray.length-1].left = team;
				team.ancestor = nodeArray[nodeArray.length-1];
				return nodeArray;

			}

			//all branches are full. add a node to the nodeArray and with current team on the left
			newNode = this.createNode();
			newNode.left = team;
			team.ancestor = newNode;
			nodeArray.push(newNode);
			return nodeArray;
		}
			
		else{
			for(var i=nodeArray.length-1;i>=0;i--){//if all left branches are taken, go for the right branches
				if(nodeArray[i].right === null){
					nodeArray[i].right = team;
					team.ancestor=nodeArray[i];
					return nodeArray;
				}
			}

			//all branches are full. add a node to the nodeArray and with current team on the left
			newNode = this.createNode();
			newNode.right = team;
			team.ancestor=newNode;
			nodeArray.push(newNode);
			return nodeArray;
		}
			

		

	}

	buildWeeks(nodeArray:any[]):any[]{
		var arrayLen = nodeArray.length;
		//at the top
		if(arrayLen % 2 == 1){
			return nodeArray;
		}
		else{
			let newNodeArray = [this.createNode()];

			for(var i=0;i<arrayLen;i++){

				let leftOrRight:leftOrRight = (i%2===0?'left':'right');
				newNodeArray = this.placeTeamInNodeArray(newNodeArray,nodeArray[i],leftOrRight);
			}

			return this.buildWeeks(newNodeArray);
		}

	}

	determineWinner(team1:any,team2:any,weight:any){
		/*should look up the ratings for each team, considering the weigh, and return a winner*/
	}

	findGameById(gameId:string){
		for(var key in this.nodeBracket){
			
			var myRegionGames = this.findRegionGames(key);

			for(var i=0;i<myRegionGames.length;i++){
				var currentGame = myRegionGames[i];

				if(gameId == currentGame.gameUUID){
					// console.log(currentGame);
					return currentGame;
				}

				while(typeof currentGame !== 'undefined'){
					currentGame = currentGame.ancestor;

					if(typeof currentGame !== 'undefined'){
						if(gameId == currentGame.gameUUID){
							return currentGame;
						}	
					}
				}
			}

		}

		return null;
	}

	mergeRegions(){
		

		if(typeof this.data.finalFour !== 'undefined'){



			if(this.data.finalFour.length > 1){
				var championshipNode = this.createNode();
				championshipNode.gameUUID = 'ChampionshipGame';//this.getUUID();
			

				for(var i=0;i<this.data.finalFour.length;i++){
					var newNode = this.createNode();
					newNode.gameUUID = this.data.finalFour[i][0] + this.data.finalFour[i][1];//this.getUUID();
					newNode.left = this.nodeBracket[this.data.finalFour[i][0]][0];
					this.nodeBracket[this.data.finalFour[i][0]][0].ancestor = newNode;
					newNode.right = this.nodeBracket[this.data.finalFour[i][1]][0];
					this.nodeBracket[this.data.finalFour[i][1]][0].ancestor = newNode;

					newNode.ancestor = championshipNode;

					let leftOrRight:leftOrRight = (i%2===0?'left':'right');

					if(leftOrRight == 'left'){
						championshipNode.left = newNode;
					}
					else{
						championshipNode.right = newNode;
					}

				}
			}
		}



		this.regionsMerged = true;

		return;
	}

	setWinner(gameId:string,winnerName:string){
		if(!this.regionsMerged){
			// console.log('regions havent merged yet. Do That!!');
			this.mergeRegions();
		}

		winnerName = winnerName.replace(/^\d+\.\s*/, '');//remove seed number that may be passed through
		// console.log(this.nodeBracket);

		var myGame = this.findGameById(gameId);


		var winningDirection = 'top';
		if(myGame === null){//game does not exist
			// console.log('game ' + gameId + ' does not exist');
			return;
		}

		if(myGame.left.name == winnerName){
			myGame.winner = myGame.left;
		}
		else if(myGame.right.name == winnerName){
			myGame.winner = myGame.right;
		}
		else{
			return;
		}

		var nextSpot = null;

		// console.log({
		// 	'myGame' : myGame
		// });

		if(typeof myGame.ancestor === 'undefined'){
			// console.log(myGame);
			if(myGame.gameUUID == 'ChampionshipGame'){
				// console.log(this.nodeBracket);
				return {
					'direction' : 'top'
				};
			}
			return;
		}


		if(myGame.ancestor.left.gameUUID == gameId){
			nextSpot = myGame.ancestor.left;
		}
		else if(myGame.ancestor.right.gameUUID == gameId){
			winningDirection = 'bottom';
			nextSpot = myGame.ancestor.right;
		}
		else{
			return;
		}

		nextSpot.name = myGame.winner.name;
		nextSpot.rating = myGame.winner.rating;
		nextSpot.seed = myGame.winner.seed;

		// var nextGame = this.findGameById(nextSpot.gameUUID);
		

		// console.log({
		// 	'task':'set winner',
		// 	'gameId' : gameId,
		// 	'winnerName' : winnerName,
		// 	'myGame' : myGame,
		// 	'nextSpot' : nextSpot,
		// 	'nodeBracket' : this.nodeBracket,
		// 	'nextGame' : nextGame
		// });

		return {
			'direction' : winningDirection//top or bottom
		};
	}

	lookupRating(teamName:string){

		var teamNameArray = teamName.split('/');

		if(teamNameArray.length > 1){
			// console.log(teamNameArray);
			let totalScore = 0;
			let totalTeams = teamNameArray.length; 
			for(var j=0;j<teamNameArray.length;j++){

				let tempTeamName = teamNameArray[j].trim();
				let tempTeamScore = Number(this.lookupRating(tempTeamName));
				// console.log({
				// 	'name':tempTeamName,
				// 	'score':tempTeamScore
				// });
				totalScore+=tempTeamScore;

			}	

			//return an average
			// console.log(totalScore/totalTeams);
			return totalScore/totalTeams;
		}
		


		//format the team name to replace leading rating numbers
		//format the team name to replace the spaces with underscores

		teamName = teamName.replace(/^\d+\.\s*/, '').replace(/ /g,"_");
		const translatedTeamName = this.nameTable[teamName] ? this.nameTable[teamName] : teamName;

		// console.log({
		// 	'teamName': teamName,
		// 	'translatedTeamName': translatedTeamName,
		// 	'ratings from teamName': this.ratings[teamName],
		// 	'ratings from translatedTeamName': this.ratings[translatedTeamName],
		// 	'ratingsArray': this.ratingsArray,
		// 	'nameTable': this.nameTable,
		// 	'this.ratings':this.ratings
		// });

		// console.log(teamName);
		if(translatedTeamName === ''){
			return 0;
		}

		//match team name (or if separated by slash - multiple names) to our rating score
		if(typeof this.ratings[translatedTeamName] !== 'undefined'){
			return this.ratings[translatedTeamName];
		}

		if(typeof this.ratingsArray !== 'undefined'){
			// console.log(this.ratingsArray);

			for(var i=0;i<this.ratingsArray.length;i++){
				if(translatedTeamName == this.ratingsArray[i].team_name || teamName == this.ratingsArray[i].team_name){
					// console.log(teamName+"'s rating is " +this.ratingsArray[i].rating[0]);
					return this.ratingsArray[i].rating;
				}
			}
		}

		// return 0;
		//we have a team name that we cannot find a rating for. output it.
		if(teamName != '&nbsp;'){
			console.log('cannot find a rating for ' + teamName);
			console.log({
				'teamName':teamName,
				'translatedTeamName':translatedTeamName,
				'ratingsArray':this.ratingsArray,
				'ratings':this.ratings,
				'nameTable':this.nameTable
			})	;
			
		}

		

		return '-.9999';//Math.random().toFixed(4);
	}

	buildGames(){
		var myTeams:Record<Regions,string[]> = this.data.teams;
		var allRegions:any			= {};
		// console.log(myTeams);

		//loop through each region. for basketball, each region is an array of 16 teams
		for(var region in myTeams){
			let typedRegion:Regions = region as Regions;
			let nodeArray = new Array(myTeams[typedRegion].length);

			var sortedArr = this.getTeamOrder(myTeams[typedRegion].length);

			//we know the teams are sorted 1-16
			for(var i=0;i<myTeams[typedRegion].length;i++){
				let currentTeam = {
					'name' : myTeams[typedRegion][i],
					'seed' : i+1,
					'rating' : this.lookupRating(myTeams[typedRegion][i])
				};


				//I cannot say I remember exactly why this duplicate with the seed number is necessary. Will see if I can rip it out in this context.
				this.ratings[currentTeam.name] = currentTeam.rating;
				this.ratings[currentTeam.seed + '. ' + currentTeam.name] = currentTeam.rating;

				this.ratings[currentTeam.name.replace(/ /g,"_")] = currentTeam.rating;
				this.ratings[(currentTeam.seed + '. ' + currentTeam.name).replace(/ /g,"_")] = currentTeam.rating;
				

				for(var j=0;j<sortedArr.length;j++){
					if(sortedArr[j]==currentTeam.seed){
						nodeArray[j] = currentTeam;
						break;
					}
				}
				
				
			}

			let fullRegion = this.buildWeeks(nodeArray);

			allRegions[region] = fullRegion;
		}
		
		return allRegions;
		

	}

	printNode(myNode:NodeType,nodeDepth:number){
		var leftOrRight:leftOrRight = 'left';
		if(typeof myNode.ancestor !== 'undefined'){
			leftOrRight = myNode.ancestor.left == myNode ? 'left' : 'right';
			// console.log(leftOrRight);	
		}

		if(typeof myNode.left !== 'undefined' && myNode.left !== null){
			this.printNode(myNode.left,nodeDepth-1);
		}

		// console.log(nodeDepth);
		let stupidString = '-----------------';
		while(stupidString.length < nodeDepth*40){
			stupidString = ' ' + stupidString;
		}

		if(stupidString.length > 0){
			/* jshint devel: true */
			console.log(stupidString);
		}

		if(typeof myNode.right !== 'undefined' && myNode.right !== null){
			this.printNode(myNode.right,nodeDepth-1);
			// console.log('------');
		}

		if(
			typeof myNode.name !== 'undefined' && 
			typeof myNode.seed !== 'undefined'
													){
			// console.log('('+leftOrRight+') - ' + myNode.seed + '. ' + myNode.name);
		/* jshint devel: true */
		console.log(myNode.seed + '. ' + myNode.name + ' ('+myNode.rating+')');
		// console.log('('+nodeDepth+') - ' + myNode.seed + '. ' + myNode.name);
		}



		

		

		// console.log(typeof myNode.ancestor);

	}

	searchNodeDepth(myNode:NodeType){
		var totalDepth = 0;

		while(typeof myNode.left !== 'undefined' && myNode.left !== null){
			totalDepth+=1;
			myNode = myNode.left;
		}

		return totalDepth;
	}

	printRegion(region:any){

		for(var i=0;i<region.length;i++){
			let myNode = region[i];
			let nodeDepth = this.searchNodeDepth(myNode);
			this.printNode(myNode,nodeDepth);
		}

	}

	getUUID(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	}

	getFinalFourRegion(regionName:string):string{
		var finalFourInfo = this.data.finalFour;

		for(var i=0;i<finalFourInfo.length;i++){
			var game = finalFourInfo[i];
			var foundGame=false;
			var gameConcat = '';
			for(var j=0;j<game.length;j++){
				gameConcat = gameConcat+game[j];
				if(game[j]==regionName){
					foundGame = true;
				}
			}

			if(foundGame){
				// console.log('found a game -->'+gameConcat);
				return gameConcat;
			}

		}

		return '';
		
	}

	findNodeGames(myArray:NodeType[],myNode:NodeType){
		// console.log(myNode);

		if(typeof myNode === 'undefined' || typeof myNode.left === 'undefined' || typeof myNode.right === 'undefined'){
			return;
		}

		if(typeof myNode.gameUUID === 'undefined'){
			myNode.gameUUID = this.getUUID();
		}

		//at the end of the tree
		if(myNode.left !== null && myNode.right !== null){
			this.findNodeGames(myArray,myNode.left);
			this.findNodeGames(myArray,myNode.right);
		}
		
		if(myNode.left !== null && typeof myNode.left.name !== 'undefined' && myNode.right !== null && typeof myNode.right.name !== 'undefined'){
			myArray.push(myNode);
		}

	}

	findRegionGames(region:any){

		var results:any[] = [];
		var regionData = this.nodeBracket[region];
		for(var i=0;i<region.length;i++){
			let myNode = regionData[i];
			// myNode.region = region;
			// let nodeDepth = this.searchNodeDepth(myNode);
			this.findNodeGames(results,myNode);
		}

		for(i=0;i<results.length;i++){
			results[i].region=region;
		}
		
		return results;

	}

	print(){
		for(var region in this.nodeBracket){
			/* jshint devel: true */
			console.log('Region ' + region);
			console.log('------------------');
			this.printRegion(this.nodeBracket[region]);
		}
	}


}

export {Bracketology};