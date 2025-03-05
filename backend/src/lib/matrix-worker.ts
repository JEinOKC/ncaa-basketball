/* this was originally an old JS file I used in another process. Should clean this up when I have the time (famous last words) */
class MatrixWorker {
	math;

	constructor(){
		this.math = require('mathjs');
	};

	create2Darray(x:number,y:number){
		var arr = new Array(x);

	    for(var i=0;i<x;i++){
	    	arr[i] = new Array(y);
	    	for(var j=0;j<y;j++){
	    		arr[i][j]=0;
	    	}
	    }
	    
	    return arr;
	};

	matrixTemplates(gameCount:number,teamCount:number){
		return {
			'gameMatrixArray' : this.create2Darray(gameCount, teamCount),
			'diffMatrixArray' : this.create2Darray(gameCount, 1)
		};
	};

	populateMatrices(myMatrices:any,TeamArray:any[],scheduleArray:any[]){
		let zeroArr = [];//array of rows/columns with all 0s

		for(var i=0;i<scheduleArray.length;i++){
			let Game = scheduleArray[i].calcs;

			let foundCount = 0;

			for(var j=0;j<TeamArray.length;j++){
				var tmpTeam = TeamArray[j];
				if(tmpTeam.team_id == Game.home_team_code){
					// console.log("MATCH!!");
					foundCount++;
					myMatrices.gameMatrixArray[i][j] = Game.homeRep;
				}
				else if (tmpTeam.team_id == Game.opponent_code){
					// console.log("MATCH!!");
					foundCount++;
					myMatrices.gameMatrixArray[i][j] = Game.awayRep;
				}	
				else{
					myMatrices.gameMatrixArray[i][j] = 0;
				}
					
			}

			if(foundCount == 0){
				zeroArr.push(i);
			}
			

			myMatrices.diffMatrixArray[i][0] = Game.ptDiff;

		}

		myMatrices.gameMatrix = this.math.matrix(myMatrices.gameMatrixArray,'sparse');
		myMatrices.diffMatrix = this.math.matrix(myMatrices.diffMatrixArray);

		return myMatrices;
	};

 	matrixMagic(myMatrices:any){
		var matrix_X = myMatrices.gameMatrix;//an nxn matrix of games played
		var matrix_Y = myMatrices.diffMatrix;//an nx1 matrix of game results

		console.log('transposing the game matrix', new Date());
		var matrix_xTrans = this.math.transpose(matrix_X); 
		console.log('transposing complete', new Date());
		console.log('creating xTx', new Date());
		var xTx = this.math.multiply(matrix_xTrans,matrix_X); 
		console.log('xTx complete', new Date());
		console.log('creating xTy', new Date());
		var xTy = this.math.multiply(matrix_xTrans,matrix_Y); 
		console.log('xTy complete', new Date());
		
		var xtx_Inverse = this.math.inv(xTx);
		var xtx_Inverse_xTy = this.math.multiply(xtx_Inverse,xTy);
		
		return xtx_Inverse_xTy;
	};

	run(teamArray:any[],schedule:any[]){
		var myMatrices = this.matrixTemplates(schedule.length, teamArray.length);
		myMatrices = this.populateMatrices(myMatrices,teamArray,schedule);

		let results = this.matrixMagic(myMatrices)._values;
		
		return results;
	};
};

module.exports = MatrixWorker;