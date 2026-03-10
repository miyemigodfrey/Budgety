const { body } = require("express-validator");

exports.create = [
	body("name").isLength({ min: 1 }).withMessage("Name required"),
	body("type")
		.isIn(["inflow", "outflow", "transfer"])
		.withMessage("Invalid type"),
];

exports.update = [
	body("name").optional().isLength({ min: 1 }),
	body("type").optional().isIn(["inflow", "outflow", "transfer"]),
];
