const { Parser } = require("json2csv");

function toCSV(records) {
	const fields = [
		{ label: "Date", value: "date" },
		{ label: "Type", value: "type" },
		{ label: "Amount", value: "amount" },
		{ label: "Description", value: "description" },
		{ label: "Note", value: "note" },
		{
			label: "Category",
			value: (row) => (row.category ? row.category.name : ""),
		},
		{ label: "Source", value: (row) => (row.source ? row.source.name : "") },
	];

	const parser = new Parser({ fields });
	return parser.parse(records);
}

module.exports = { toCSV };
