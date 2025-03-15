const LogisticRegression = require('ml-logistic-regression');
import { Matrix } from 'ml-matrix';
import fs from 'fs';
import path from 'path';
import { TeamSummaryDataType } from './types';

export class MBBLogisticalRegression {
	datasets: string[];
	regression: typeof LogisticRegression;
	labels: number[];
	features: number[][];

	constructor() {
		this.datasets = [];
		this.labels = [];
		this.features = [];
		this.regression = new LogisticRegression();
	}

	preprocessData() {
		this.setDatasets();
		
		const teams: TeamSummaryDataType[] = Object.values(this.datasets.flatMap(Object.values));

		this.features = teams.map((team) => [
		team.ranking,
		team.rating,
		team.averageOpponentRanking,
		team.averageOpponentRating,
		team.averageScoringMargin,
		team.wins.quad1,
		team.wins.quad2,
		team.wins.quad3,
		team.wins.quad4,
		team.losses.quad1,
		team.losses.quad2,
		team.losses.quad3,
		team.losses.quad4,
		]);

		this.labels = teams.map((team) => (team.bidType !== 'N/A' ? 1 : 0)); // 1 if bid, 0 otherwise
	}

	setDatasets() {
		const dataDir = path.join(__dirname, '../../data/archive');

		this.datasets = [
		JSON.parse(fs.readFileSync(path.join(dataDir, 'mensbb-team-summaries-2022.json'), 'utf8')),
		JSON.parse(fs.readFileSync(path.join(dataDir, 'mensbb-team-summaries-2023.json'), 'utf8')),
		JSON.parse(fs.readFileSync(path.join(dataDir, 'mensbb-team-summaries-2024.json'), 'utf8')),
		];
	}

	// Train the logistic regression model
	trainModel() {
		const dataDir = path.join(__dirname, '../../data/archive');
		this.preprocessData();

		if (!this.features || !this.labels) {
		throw new Error('Data not loaded. Call loadData() first.');
		}

		const X = new Matrix(this.features);
		const Y = Matrix.columnVector(this.labels);

		fs.writeFileSync(path.join(dataDir, 'logistic-regression-X.json'), JSON.stringify(X));
		fs.writeFileSync(path.join(dataDir, 'logistic-regression-Y.json'), JSON.stringify(Y));

		this.regression.train(X, Y);

		console.log('Model training complete.');
	}

	// Save the trained model to a file
	saveModel(filename = 'selection-committee-model.json') {
		const dataDir = path.join(__dirname, '../../data/archive');

		console.log('saving the model');

		// Save the model to a file using `toJSON` method
		const modelData = this.regression.toJSON(); 

		fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(modelData));
		console.log(`Model saved to ${filename}`);
	}

	// Load a saved model from a file
	loadModel(filename = 'selection-committee-model.json') {
		const dataDir = path.join(__dirname, '../../data/archive');
		
		console.log('loading the model');

		const modelData = JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));

		// Load the model from the saved data using `fromJSON` method
		this.regression = LogisticRegression.load(modelData); 

		console.log(`Model loaded from ${filename}`);
	}

	// Predict the probability of a team getting a bid
	predict(teamSummary: TeamSummaryDataType) {
		const teamStats = [
		teamSummary.ranking,
		teamSummary.rating,
		teamSummary.averageOpponentRanking,
		teamSummary.averageOpponentRating,
		teamSummary.averageScoringMargin,
		teamSummary.wins.quad1,
		teamSummary.wins.quad2,
		teamSummary.wins.quad3,
		teamSummary.wins.quad4,
		teamSummary.losses.quad1,
		teamSummary.losses.quad2,
		teamSummary.losses.quad3,
		teamSummary.losses.quad4,
		];

		// Wrap features in Matrix to ensure mmul is available
		const featuresMatrix = new Matrix([teamStats]);

		// Return prediction using the regression model
		return this.regression.predict(featuresMatrix);

		// Return prediction
		// return this.regression.predict(teamStats);
	}

	predictProbability(teamSummary: TeamSummaryDataType) {
		const teamStats = [
			teamSummary.ranking,
			teamSummary.rating,
			teamSummary.averageOpponentRanking,
			teamSummary.averageOpponentRating,
			teamSummary.averageScoringMargin,
			teamSummary.wins.quad1,
			teamSummary.wins.quad2,
			teamSummary.wins.quad3,
			teamSummary.wins.quad4,
			teamSummary.losses.quad1,
			teamSummary.losses.quad2,
			teamSummary.losses.quad3,
			teamSummary.losses.quad4,
		];

		// Ensure that the weights are a column vector (13 x 1) for proper matrix multiplication
		const weights = this.regression.classifiers[0].weights;  // Assuming weights are 1x13
		const featureMatrix = new Matrix([teamStats]); // Create a 2D matrix (1x13)
	
		// Reshape weights to be 13x1
		// const weightsMatrix = new Matrix(weights[0]); // This assumes that `weights` is a 1x13 array, so we reshape it to a 13x1 matrix
	
		// console.log({
		// 	'weights':weights,
		// 	'weights 0': weights[0],
		// 	featureMatrix: featureMatrix.toJSON(),
		// 	// weightsMatrix: weightsMatrix.toJSON(),
		// })

		// Now directly multiply the feature matrix (1x13) with the weights matrix (1x13)
		const rawDecisionValue = featureMatrix.mmul(weights.transpose()).get(0, 0);  // Get the raw decision value

		const scaledRawDecisionValue = rawDecisionValue / 1000;
		const probability = this.sigmoid(scaledRawDecisionValue);
		

		return {'rawDecisionValue':rawDecisionValue, 'probability':probability, 'prediction':this.predict(teamSummary)};

	}

	// Sigmoid function
	sigmoid(x: number): number {
		return 1 / (1 + Math.exp(-x));
	}

}
