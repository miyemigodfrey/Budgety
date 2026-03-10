const Source = require("../models/Source");
const Transaction = require("../models/Transaction");

exports.create = async (req, res, next) => {
	try {
		const data = { ...req.body, user: req.user._id };
		const src = await Source.create(data);
		res.status(201).json(src);
	} catch (err) {
		next(err);
	}
};

exports.list = async (req, res, next) => {
	try {
		const items = await Source.find({ user: req.user._id }).sort({
			createdAt: -1,
		});
		res.json(items);
	} catch (err) {
		next(err);
	}
};

exports.get = async (req, res, next) => {
	try {
		const src = await Source.findOne({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!src) return res.status(404).json({ message: "Not found" });

		const transactions = await Transaction.find({
			user: req.user._id,
			source: src._id,
		})
			.populate("category source transferTarget")
			.sort({ date: -1 });

		res.json({ source: src, transactions });
	} catch (err) {
		next(err);
	}
};

exports.update = async (req, res, next) => {
	try {
		const src = await Source.findOneAndUpdate(
			{ _id: req.params.id, user: req.user._id },
			req.body,
			{ new: true },
		);
		if (!src) return res.status(404).json({ message: "Not found" });
		res.json(src);
	} catch (err) {
		next(err);
	}
};

exports.remove = async (req, res, next) => {
	try {
		const src = await Source.findOne({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!src) return res.status(404).json({ message: "Not found" });

		const has = await Transaction.exists({
			user: req.user._id,
			source: src._id,
		});
		if (has)
			return res
				.status(400)
				.json({ message: "Cannot delete source with transactions" });

		await Source.deleteOne({ _id: src._id });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
};
