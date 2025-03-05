const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  match_id: String,
  season: Number,
  city: String,
  team1: String,
  team2: String,
  toss_winner: String,
  toss_decision: String,
  winner: String,
  result: String,
  result_margin: Number,
  date: Date,
});

module.exports = mongoose.model("Match", matchSchema);
