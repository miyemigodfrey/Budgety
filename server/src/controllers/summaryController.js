const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// GET /api/summary/monthly?year=2026&month=3
exports.monthly = async (req, res, next) => {
	try {
		const year = parseInt(req.query.year, 10) || new Date().getFullYear();
		const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
		const start = new Date(Date.UTC(year, month - 1, 1));
		const end = new Date(Date.UTC(year, month, 1));

		const match = {
			user: mongoose.Types.ObjectId(req.user._id),
			date: { $gte: start, $lt: end },
		};

		const agg = await Transaction.aggregate([
			{ $match: match },
			{
				$group: {
					_id: "$type",
					total: { $sum: "$amount" },
					count: { $sum: 1 },
				},
			},
		]);

		const totals = { inflow: 0, outflow: 0, transfer: 0 };
		agg.forEach((g) => {
			totals[g._id] = g.total;
		});

		res.json({ year, month, totals });
	} catch (err) {
		next(err);
	}
};
