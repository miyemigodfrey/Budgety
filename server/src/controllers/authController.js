const User = require("../models/User");
const { signToken } = require("../utils/jwt");

exports.register = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;
		const exists = await User.findOne({ email });
		if (exists)
			return res.status(400).json({ message: "Email already in use" });
		const user = await User.create({ name, email, password });
		const token = signToken({ id: user._id });
		res
			.status(201)
			.json({
				token,
				user: { id: user._id, name: user.name, email: user.email },
			});
	} catch (err) {
		next(err);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).select("+password");
		if (!user) return res.status(400).json({ message: "Invalid credentials" });
		const match = await user.comparePassword(password);
		if (!match) return res.status(400).json({ message: "Invalid credentials" });
		const token = signToken({ id: user._id });
		res.json({
			token,
			user: { id: user._id, name: user.name, email: user.email },
		});
	} catch (err) {
		next(err);
	}
};
