import pandas as pd
from flask import Flask, jsonify
from lib.mv_linear_regression import MBBRegressionModel

app = Flask(__name__);

@app.route('/hello')
def hello_world():
		return 'hello, world!!!'

@app.route('/2025_model')
def run_model_2025():
	# Create the LinearRegressionModel object
	model = MBBRegressionModel()

	# Prepare the data
	model.preprocess_data()

	print("Data prepared")
	# Train the model
	model.train_model()

	print("Model trained")

	#exit the program
	# exit()

	# save the model
	model.save_model()

	print("Model saved")

	# re-load the model
	model.load_model()

	print("Model re-loaded")

	#process the predictions
	model.process_predictions()

	print("Predictions processed")

	# save the predictions
	prediction_json = model.save_predictions()

	print("Predictions saved")
	return jsonify(prediction_json)



if __name__ == '__main__':
	app.run(debug=True)