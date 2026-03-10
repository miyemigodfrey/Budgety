const Transaction = require("../models/Transaction");
const { getPagination } = require("../utils/pagination");
const balanceService = require("../services/balanceService");

exports.create = async (req, res, next) => {
	try {
		const data = { ...req.body, user: req.user._id };
		const tx = await Transaction.create(data);
		try {
			await balanceService.applyTransaction(tx);
		} catch (err) {
			// rollback transaction on balance update error
			await Transaction.findByIdAndDelete(tx._id).catch(() => {});
			throw err;
		}
		const populated = await Transaction.findById(tx._id).populate(
			"category source transferTarget",
		);
		res.status(201).json(populated);
	} catch (err) {
		next(err);
	}
};

exports.list = async (req, res, next) => {
	try {
		const { limit, skip, page } = getPagination(req);
		const filter = { user: req.user._id };
		if (req.query.type) filter.type = req.query.type;
		if (req.query.category) filter.category = req.query.category;
		if (req.query.source) filter.source = req.query.source;
		if (req.query.from || req.query.to) {
			const from = req.query.from
				? new Date(req.query.from)
				: new Date("1970-01-01");
			const to = req.query.to ? new Date(req.query.to) : new Date();
			filter.date = { $gte: from, $lte: to };
		}
		const total = await Transaction.countDocuments(filter);
		const items = await Transaction.find(filter)
			.sort({ date: -1 })
			.skip(skip)
			.limit(limit)
			.populate("category source transferTarget");

		// map to bank-style rows
		const rows = items.map((t) => ({
			id: t._id,
			date: t.date,
			description: t.description || "",
			note: t.note || "",
			category: t.category || null,
			source: t.source || null,
			transferTarget: t.transferTarget || null,
			inflow: t.type === "inflow" ? t.amount : 0,
			outflow: t.type === "outflow" || t.type === "transfer" ? t.amount : 0,
			rawType: t.type,
		}));

		res.json({ meta: { total, page, limit }, items: rows });
	} catch (err) {
		next(err);
	}
};

exports.get = async (req, res, next) => {
	try {
		const tx = await Transaction.findOne({
			_id: req.params.id,
			user: req.user._id,
		}).populate("category source transferTarget");
		if (!tx) return res.status(404).json({ message: "Not found" });
		res.json(tx);
	} catch (err) {
		next(err);
	}
};

exports.update = async (req, res, next) => {
	try {
		const orig = await Transaction.findOne({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!orig) return res.status(404).json({ message: "Not found" });

		const originalSnapshot = orig.toObject();

		// reverse original effects
		await balanceService.reverseTransaction(originalSnapshot);

		// apply updates
		Object.assign(orig, req.body);
		const saved = await orig.save();

		try {
			await balanceService.applyTransaction(saved);
		} catch (err) {
			// attempt to restore original balances; best-effort
			await balanceService.applyTransaction(originalSnapshot).catch(() => {});
			throw err;
		}

		const populated = await Transaction.findById(saved._id).populate(
			"category source transferTarget",
		);
		res.json(populated);
	} catch (err) {
		next(err);
	}
};

exports.remove = async (req, res, next) => {
	try {
		const tx = await Transaction.findOne({
			_id: req.params.id,
			user: req.user._id,
		});
		if (!tx) return res.status(404).json({ message: "Not found" });

		// reverse effects
		await balanceService.reverseTransaction(tx);

		await Transaction.deleteOne({ _id: tx._id });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
};
