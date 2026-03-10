const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/dashboardController");

router.use(auth);

router.get("/", ctrl.getDashboard);

module.exports = router;
