const express = require("express");
const router = express.Router();

const matchController = require("../controllers/matchController");
const playerController = require("../controllers/playerController");
const importController = require("../controllers/importController");

// Match routes
router.get("/matches", matchController.getAllMatches);
router.post("/matches/query", matchController.getMatchesByTeams);
router.get("/toss-analysis", matchController.getTossAnalysis);
router.get("/match-stats", matchController.getMatchStats);

// Player routes
router.get("/player-performance", playerController.getPlayerPerformance);

// Import route
router.post("/import", importController.importData);

module.exports = router;
