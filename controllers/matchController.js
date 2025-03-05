const Match = require("../models/Match");
const Delivery = require("../models/Delivery");

exports.getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMatchesByTeams = async (req, res) => {
  try {
    const { team1, team2 } = req.body;
    const matches = await Match.find({
      $or: [
        { team1: team1, team2: team2 },
        { team1: team2, team2: team1 },
      ],
    });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTossAnalysis = async (req, res) => {
  try {
    const { team1, team2 } = req.query;

    // Build the filter condition for selected teams
    const teamFilter =
      team1 && team2
        ? {
            $or: [
              { team1: team1, team2: team2 },
              { team1: team2, team2: team1 },
            ],
          }
        : {};

    const tossStats = await Match.aggregate([
      // First match the selected teams if provided
      { $match: teamFilter },
      {
        $group: {
          _id: {
            winner: "$toss_winner",
            decision: "$toss_decision",
          },
          count: { $sum: 1 },
          matchesWon: {
            $sum: {
              $cond: [{ $eq: ["$toss_winner", "$winner"] }, 1, 0],
            },
          },
        },
      },
    ]);
    res.json(tossStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMatchStats = async (req, res) => {
  try {
    const { matchId, team } = req.query;
    console.log("Match ID:", matchId, "Team:", team);

    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const match_id = match.match_id;
    console.log("Found match:", match);
    console.log("Using match_id:", match_id);

    // Check if we have any deliveries for this match
    const sampleDelivery = await Delivery.findOne({
      match_id: match_id.toString(),
    });
    console.log("Sample delivery:", sampleDelivery);

    // Get batting stats for all batsmen
    const battingStats = await Delivery.aggregate([
      {
        $match: {
          match_id: match_id,
          batting_team: team,
        },
      },
      {
        $group: {
          _id: "$batsman",
          runs: { $sum: "$batsman_runs" },
          balls: { $sum: 1 },
          fours: {
            $sum: { $cond: [{ $eq: ["$batsman_runs", 4] }, 1, 0] },
          },
          sixes: {
            $sum: { $cond: [{ $eq: ["$batsman_runs", 6] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          batsman: "$_id",
          _id: 0,
          runs: 1,
          balls: 1,
          fours: 1,
          sixes: 1,
          strikeRate: {
            $cond: [
              { $gt: ["$balls", 0] },
              { $multiply: [{ $divide: ["$runs", "$balls"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { runs: -1 } },
    ]);

    // Get bowling stats
    const bowlingStats = await Delivery.aggregate([
      {
        $match: {
          match_id: match_id.toString(),
          bowling_team: team,
        },
      },
      {
        $group: {
          _id: "$bowler",
          overs: {
            $sum: {
              $cond: [{ $eq: [{ $mod: ["$ball", 6] }, 0] }, 1 / 6, 1 / 6],
            },
          },
          runs: { $sum: "$total_runs" },
          wickets: {
            $sum: { $cond: [{ $eq: ["$is_wicket", 1] }, 1, 0] },
          },
          maidens: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$total_runs", 0] },
                    { $eq: [{ $mod: ["$ball", 6] }, 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          bowler: "$_id",
          _id: 0,
          overs: 1,
          maidens: 1,
          runs: 1,
          wickets: 1,
          economy: {
            $cond: [
              { $gt: ["$overs", 0] },
              { $divide: ["$runs", "$overs"] },
              0,
            ],
          },
        },
      },
      { $sort: { wickets: -1, economy: 1 } },
    ]);

    console.log("Batting Stats:", battingStats);
    console.log("Bowling Stats:", bowlingStats);

    res.json({
      battingStats,
      bowlingStats,
    });
  } catch (error) {
    console.error("Match Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};
