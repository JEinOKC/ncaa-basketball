import json
import os
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

#this class is currently built to only function for the 2025 model.
#if wanting to run a 2026 model, the 2025 summary will need to be added to the file_names and all file writes should have their names changed
#ideally this should be addressed through a variable passed through. (TODO)

class MBBRegressionModel:
    def __init__(self):
        self.datasets = []
        self.features = []
        self.labels = []
        self.predictions = []
        self.regression = None

    def set_datasets(self):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/archive"))
        print(data_dir)
        file_names = [
            "mensbb-team-summaries-2022.json",
            "mensbb-team-summaries-2023.json",
            "mensbb-team-summaries-2024.json",
        ]
        for file_name in file_names:
            file_path = os.path.join(data_dir, file_name)
            
            try:
                with open(file_path, "r") as f:
                    self.datasets.append(json.load(f))
            except FileNotFoundError as e:
                print(f"File {file_path} not found: {e}")
            except Exception as e:
                print(f"Error loading file {file_path}: {e}")


    def process_predictions(self):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/archive"))
        
        file_name = "mensbb-team-summaries-2025.json";
        file_path = os.path.join(data_dir, file_name)

        # load the file
        with open(file_path, "r") as f:
            data = json.load(f)

        # process the data
        for team_name, team in data.items():   # 'team_name' is the key, 'team' is the value
            # print("team:", team)
            prediction = self.predict(team)
            # print("prediction:", prediction)

            
            self.predictions.append({
                'team': team, 
                'team_name': team_name,
                'prediction': prediction,

            })

        print("predictions:", self.predictions)

        # sort by the prediction
        self.predictions.sort(key=lambda x: x['prediction'])


    def save_predictions(self):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/archive"))
        
        with open(os.path.join(data_dir, "predictions-2025.json"), "w") as f:
            json.dump(self.predictions, f)

        return self.predictions


    def preprocess_data(self):
        self.set_datasets()

        teams = [team for dataset in self.datasets for team in dataset.values()]
        
        self.features = np.array([
            [
                team["ranking"],
                team["rating"],
                team["averageOpponentRanking"],
                team["averageOpponentRating"],
                team["averageScoringMargin"],
                team["wins"]["quad1"],
                team["wins"]["quad2"],
                team["wins"]["quad3"],
                team["wins"]["quad4"],
                team["losses"]["quad1"],
                team["losses"]["quad2"],
                team["losses"]["quad3"],
                team["losses"]["quad4"],
            ]
            for team in teams
        ])

        self.labels = np.array([
            # in 2025, MSE: MSE: 21.28642063875229, R^2: 0.9980617251338721 - but results did not defeat original model using eye test
            # team.get("seed", team["ranking"]) if team.get("seed", 69) != 69 else max(team["ranking"], 30)

            # in 2025, Model trained. MSE: 40.384068446019704, R^2: 0.9962490296593149 - MSE a bit higher than lower values, but I believe this makes more sense logically and the eye test shows better results
            team.get("seed", team["ranking"]) if team.get("seed", 69) != 69 else max(min(team["ranking"], 69), 69)

            for team in teams
        ])



    def train_model(self):
        self.preprocess_data()

        if len(self.features) == 0 or len(self.labels) == 0:
            raise ValueError("No data available for training.")

        self.regression = LinearRegression()
        self.regression.fit(self.features, self.labels)

        predictions = self.regression.predict(self.features)
        mse = mean_squared_error(self.labels, predictions)
        r2 = r2_score(self.labels, predictions)

        print(f"Model trained. MSE: {mse}, R^2: {r2}")

    def save_model(self, filename="seed-prediction-model.pkl"):
        if self.regression is None:
            raise ValueError("Model not trained. Train before saving.")
        
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/archive"))
        file_path = os.path.join(data_dir, filename)
        
        with open(file_path, "wb") as f:
            joblib.dump(self.regression, f)
        
        print(f"Model saved to {filename}")

    def load_model(self, filename="seed-prediction-model.pkl"):
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/archive"))
        file_path = os.path.join(data_dir, filename)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file {filename} not found.")
        
        with open(file_path, "rb") as f:
            self.regression = joblib.load(f)

        print(f"Model loaded from {filename}")

    def predict(self, team_summary):
        if self.regression is None:
            raise ValueError("Model not trained or loaded.")

        team_features = np.array([
            team_summary["ranking"],
            team_summary["rating"],
            team_summary["averageOpponentRanking"],
            team_summary["averageOpponentRating"],
            team_summary["averageScoringMargin"],
            team_summary["wins"]["quad1"],
            team_summary["wins"]["quad2"],
            team_summary["wins"]["quad3"],
            team_summary["wins"]["quad4"],
            team_summary["losses"]["quad1"],
            team_summary["losses"]["quad2"],
            team_summary["losses"]["quad3"],
            team_summary["losses"]["quad4"],
        ]).reshape(1, -1)

        predicted_seed = self.regression.predict(team_features)[0]
        return round(predicted_seed)

    def predict_probability(self, team_summary):
        if self.regression is None:
            raise ValueError("Model not trained or loaded.")

        predicted_seed = self.predict(team_summary)

        clamped_seed = max(1, min(68, predicted_seed))
        raw_decision_value = 68 - clamped_seed
        probability = raw_decision_value / 67

        return {
            "rawDecisionValue": raw_decision_value,
            "probability": probability,
            "prediction": round(clamped_seed),
        }
