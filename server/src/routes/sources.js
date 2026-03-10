const express = require("express");
const { validationResult } = require("express-validator");
const router = express.Router();
const ctrl = require("../controllers/sourceController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });
	next();
};

router.use(auth);

router.post(
	"/",
	[
		body("name").notEmpty().withMessage("Name required"),
		body("currency").optional().isString(),
	],
	validate,
	ctrl.create,
);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);
router.patch(
	"/:id",
	[body("name").optional().notEmpty(), body("currency").optional().isString()],
	validate,
	ctrl.update,
);
router.delete("/:id", ctrl.remove);

module.exports = router;
