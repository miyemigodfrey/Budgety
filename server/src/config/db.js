const mongoose = require("mongoose");

const connectDB = async () => {
	const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/budgety";
	const opts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};
	await mongoose.connect(uri, opts);
	console.log("MongoDB connected");
};

module.exports = connectDB;
