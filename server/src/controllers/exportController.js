const Transaction = require("../models/Transaction");
const { toCSV } = require("../utils/exportCSV");

exports.exportCSV = async (req, res, next) => {
	try {
		const start = req.query.start
			? new Date(req.query.start)
			: new Date("1970-01-01");
		const end = req.query.end ? new Date(req.query.end) : new Date();

		const filter = { user: req.user._id, date: { $gte: start, $lte: end } };
		const items = await Transaction.find(filter)
			.sort({ date: -1 })
			.populate("category source transferTarget");

		// normalize rows
		const rows = items.map((t) => ({
			date: t.date.toISOString(),
			type: t.type,
			amount: t.amount,
			description: t.description || "",
			note: t.note || "",
			category: t.category || null,
			source: t.source || null,
		}));

		const csv = toCSV(rows);
		res.setHeader(
			"Content-Disposition",
			"attachment; filename=budgety-financial-records.csv",
		);
		res.setHeader("Content-Type", "text/csv");
		res.send(csv);
	} catch (err) {
		next(err);
	}
};
