const Delivery = require("../models/Delivery");

exports.getPlayerPerformance = async (req, res) => {
  try {
    const { team1, team2 } = req.query;

    // Build match filter for selected teams
    const matchFilter =
      team1 && team2
        ? {
            $or: [{ batting_team: team1 }, { batting_team: team2 }],
          }
        : {};

    console.log("Match Filter:", matchFilter);

    const playerStats = await Delivery.aggregate([
      // Match deliveries for selected teams
      { $match: matchFilter },
      // Group by batsman and their team
      {
        $group: {
          _id: {
            batsman: "$batsman",
            team: "$batting_team",
          },
          totalRuns: { $sum: "$batsman_runs" },
          ballsFaced: { $sum: 1 },
          matches: { $addToSet: "$match_id" },
          fours: {
            $sum: {
              $cond: [{ $eq: ["$batsman_runs", 4] }, 1, 0],
            },
          },
          sixes: {
            $sum: {
              $cond: [{ $eq: ["$batsman_runs", 6] }, 1, 0],
            },
          },
        },
      },
      // Project the final fields
      {
        $project: {
          _id: 0,
          batsman: "$_id.batsman",
          battingTeam: "$_id.team",
          totalRuns: 1,
          ballsFaced: 1,
          matchesPlayed: { $size: "$matches" },
          fours: 1,
          sixes: 1,
          strikeRate: {
            $multiply: [{ $divide: ["$totalRuns", "$ballsFaced"] }, 100],
          },
          average: {
            $divide: ["$totalRuns", { $size: "$matches" }],
          },
        },
      },
      // Match only the selected teams again to ensure correct data
      {
        $match: {
          battingTeam: { $in: [team1, team2] },
        },
      },
      // Sort by total runs in descending order
      { $sort: { totalRuns: -1 } },
    ]);

    console.log("Player Stats:", playerStats);

    res.json(playerStats);
  } catch (error) {
    console.error("Player Performance Error:", error);
    res.status(500).json({ message: error.message });
  }
};
