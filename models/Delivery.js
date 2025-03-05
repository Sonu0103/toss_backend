const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  match_id: {
    type: String,
    required: true,
  },
  inning: Number,
  batting_team: String,
  bowling_team: String,
  batsman: String,
  bowler: String,
  batsman_runs: Number,
  total_runs: Number,
  over: Number,
  ball: Number,
  non_striker: String,
  extra_runs: Number,
  extras_type: String,
  is_wicket: Number,
  player_dismissed: String,
  dismissal_kind: String,
  fielder: String,
});

module.exports = mongoose.model("Delivery", deliverySchema);
