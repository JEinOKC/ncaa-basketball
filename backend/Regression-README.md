#Steps to form the model:

1. fix up the mensbb-tournament-[year].json files
2. build game results? http://localhost:3099/api/game-results/[year]
	a. this is loading the selection committee criteria
	b. we are putting in the dummy 69 seed in for every team throuhg setTeamSummary()
	c. writes to data/archive/mensbb-team-summaries-[year].json 


3. call http://localhost:3099/api/build-archive-ratings/[year] for each training data year?
	a. generates the rankings for a year
	b. loads the tournament data (mensbb-tournament-[year].json)
	c. adds the default seed to each team
	d. writes the seed to mensbb-rankings-[year].json (seed is correct here)
	c. re-writes to data/archive/mensbb-team-summaries-[year].json, fixing the seed


4. use python model
	a. cd into backend/py-src
	b. python test_linear_regression.py
	d. saved to seed-prediction-model.pkl

5. follow steps 1-3 with the current year
	a. delete the seed value (may or may not be necessary)


*** this is all a bit up in the air since the JS model did not work and was replaced by python ***
*** i am in the process of cleaning this up and making it more straightforward ***