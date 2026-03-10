const Category = require("../models/Category");

exports.create = async (req, res, next) => {
	try {
		const data = { ...req.body, user: req.user._id };
		const cat = await Category.create(data);
		res.status(201).json(cat);
	} catch (err) {
		next(err);
	}
};

exports.list = async (req, res, next) => {
	try {
		const items = await Category.find({ user: req.user._id }).sort({ name: 1 });
		res.json(items);
	} catch (err) {
		next(err);
	}
};

exports.update = async (req, res, next) => {
	try {
		const cat = await Category.findOneAndUpdate(
			{ _id: req.params.id, user: req.user._id },
			req.body,
			{ new: true },
		);
		if (!cat) return res.status(404).json({ message: "Not found" });
		res.json(cat);
	} catch (err) {
		next(err);
	}
};

exports.remove = async (req, res, next) => {
	try {
		const cat = await Category.findOneAndDelete({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!cat) return res.status(404).json({ message: "Not found" });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
};
