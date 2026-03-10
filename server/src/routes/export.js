const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/exportController");

router.use(auth);

router.get("/", ctrl.exportCSV);

module.exports = router;
