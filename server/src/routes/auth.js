const express = require("express");
const { validationResult } = require("express-validator");
const router = express.Router();
const authCtrl = require("../controllers/authController");
const { register, login } = require("../validators/auth");

const validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });
	next();
};

router.post("/register", register, validate, authCtrl.register);
router.post("/login", login, validate, authCtrl.login);

module.exports = router;
