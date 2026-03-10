const getPagination = (req) => {
	const page = Math.max(1, parseInt(req.query.page, 10) || 1);
	const limit = Math.min(100, parseInt(req.query.limit, 10) || 25);
	const skip = (page - 1) * limit;
	return { page, limit, skip };
};

module.exports = { getPagination };
