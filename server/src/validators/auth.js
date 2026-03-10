const { body } = require("express-validator");

exports.register = [
	body("name").isLength({ min: 1 }).withMessage("Name required"),
	body("email").isEmail().withMessage("Valid email required"),
	body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
];

exports.login = [
	body("email").isEmail().withMessage("Valid email required"),
	body("password").exists().withMessage("Password required"),
];
