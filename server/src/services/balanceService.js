const Source = require("../models/Source");

async function applyTransaction(tx) {
	if (!tx || !tx.source)
		throw new Error("Invalid transaction for balance update");

	const amount = Number(tx.amount) || 0;

	if (tx.type === "inflow") {
		const updated = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: amount } },
			{ new: true },
		);
		if (!updated) throw new Error("Source not found");
		return updated;
	}

	if (tx.type === "outflow") {
		const updated = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: -amount } },
			{ new: true },
		);
		if (!updated) throw new Error("Source not found");
		return updated;
	}

	if (tx.type === "transfer") {
		if (!tx.transferTarget) throw new Error("Transfer target required");
		// decrement source, increment target
		const src = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: -amount } },
			{ new: true },
		);
		const tgt = await Source.findByIdAndUpdate(
			tx.transferTarget,
			{ $inc: { balance: amount } },
			{ new: true },
		);
		if (!src || !tgt) throw new Error("Source or target not found");
		return { src, tgt };
	}
}

async function reverseTransaction(tx) {
	if (!tx || !tx.source)
		throw new Error("Invalid transaction for balance reversal");

	const amount = Number(tx.amount) || 0;

	if (tx.type === "inflow") {
		// inflow previously increased balance, so subtract
		const updated = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: -amount } },
			{ new: true },
		);
		if (!updated) throw new Error("Source not found");
		return updated;
	}

	if (tx.type === "outflow") {
		// outflow previously decreased balance, so add back
		const updated = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: amount } },
			{ new: true },
		);
		if (!updated) throw new Error("Source not found");
		return updated;
	}

	if (tx.type === "transfer") {
		if (!tx.transferTarget) throw new Error("Transfer target required");
		// reverse: add to source, subtract from target
		const src = await Source.findByIdAndUpdate(
			tx.source,
			{ $inc: { balance: amount } },
			{ new: true },
		);
		const tgt = await Source.findByIdAndUpdate(
			tx.transferTarget,
			{ $inc: { balance: -amount } },
			{ new: true },
		);
		if (!src || !tgt) throw new Error("Source or target not found");
		return { src, tgt };
	}
}

module.exports = { applyTransaction, reverseTransaction };
