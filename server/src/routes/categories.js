const express = require("express");
const { validationResult } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/categoriesController");
const auth = require("../middleware/auth");
const { create, update } = require("../validators/category");

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });
	next();
};

router.use(auth);

router.post("/", create, validate, ctrl.create);
router.get("/", ctrl.list);
router.put("/:id", update, validate, ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
