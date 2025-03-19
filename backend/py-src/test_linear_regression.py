import pandas as pd
from lib.mv_linear_regression import MBBRegressionModel

# Example dataset
data = pd.DataFrame({
    'feature1': [1, 2, 3, 4, 5],
    'feature2': [5, 4, 3, 2, 1],
    'target': [10, 9, 8, 7, 6]
})

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
model.save_predictions()

print("Predictions saved")

# print("Model Performance Metrics:", metrics)


