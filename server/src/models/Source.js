const mongoose = require("mongoose");

const SourceSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: { type: String, required: true, trim: true },
		balance: { type: Number, required: true, default: 0 },
		currency: { type: String, required: true, default: "NGN" },
	},
	{ timestamps: true },
);

SourceSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Source", SourceSchema);
