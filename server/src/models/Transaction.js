const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		source: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Source",
			required: true,
		},
		type: {
			type: String,
			enum: ["inflow", "outflow", "transfer"],
			required: true,
		},
		amount: { type: Number, required: true },
		date: { type: Date, required: true, default: Date.now },
		description: { type: String },
		note: { type: String },
		category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
		// transfer target for transfers (reference to another Source)
		transferTarget: { type: mongoose.Schema.Types.ObjectId, ref: "Source" },
		meta: { type: Object },
	},
	{ timestamps: true },
);

TransactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
