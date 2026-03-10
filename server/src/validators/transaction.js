const { body } = require("express-validator");

exports.create = [
	body("type")
		.isIn(["inflow", "outflow", "transfer"])
		.withMessage("Invalid type"),
	body("amount").isNumeric().withMessage("Amount must be a number"),
	body("source").notEmpty().withMessage("Source is required"),
	body("date").optional().isISO8601().toDate(),
];

exports.update = [
	body("type").optional().isIn(["inflow", "outflow", "transfer"]),
	body("amount").optional().isNumeric(),
	body("date").optional().isISO8601().toDate(),
];
