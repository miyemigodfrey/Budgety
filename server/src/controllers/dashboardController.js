const Source = require("../models/Source");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

exports.getDashboard = async (req, res, next) => {
	try {
		const userId = mongoose.Types.ObjectId(req.user._id);

		const sources = await Source.find({ user: userId }).select(
			"name balance currency",
		);

		const totalBalance = sources.reduce((s, a) => s + (a.balance || 0), 0);

		// monthly aggregates for current month
		const now = new Date();
		const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
		const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

		const agg = await Transaction.aggregate([
			{ $match: { user: userId, date: { $gte: start, $lt: end } } },
			{ $group: { _id: "$type", total: { $sum: "$amount" } } },
		]);

		const monthly = { inflow: 0, outflow: 0, transfer: 0 };
		agg.forEach((g) => (monthly[g._id] = g.total));

		const recent = await Transaction.find({ user: userId })
			.sort({ date: -1 })
			.limit(10)
			.populate("category source transferTarget");

		res.json({
			totalBalance,
			sources,
			monthlyIncome: monthly.inflow || 0,
			monthlyExpense: monthly.outflow || 0,
			recentTransactions: recent,
		});
	} catch (err) {
		next(err);
	}
};
