const express = require("express");
const { validationResult } = require("express-validator");
const router = express.Router();
const txCtrl = require("../controllers/transactionsController");
const auth = require("../middleware/auth");
const { create, update } = require("../validators/transaction");

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });
	next();
};

router.use(auth);

router.post("/", create, validate, txCtrl.create);
router.get("/", txCtrl.list);
router.get("/:id", txCtrl.get);
router.put("/:id", update, validate, txCtrl.update);
router.delete("/:id", txCtrl.remove);

module.exports = router;
