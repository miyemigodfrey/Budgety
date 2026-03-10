const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const summary = require("../controllers/summaryController");

router.use(auth);

router.get("/monthly", summary.monthly);

module.exports = router;
