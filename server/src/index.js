const app = require("./app");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 4000;

connectDB()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("Failed to connect to DB", err);
		process.exit(1);
	});
