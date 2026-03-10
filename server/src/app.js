const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const transactionsRoutes = require("./routes/transactions");
const categoriesRoutes = require("./routes/categories");
const summaryRoutes = require("./routes/summary");
const sourcesRoutes = require("./routes/sources");
const exportRoutes = require("./routes/export");
const dashboardRoutes = require("./routes/dashboard");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./docs/openapi.js");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true, service: "budgety-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/sources", sourcesRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// OpenAPI/Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use(errorHandler);

module.exports = app;
