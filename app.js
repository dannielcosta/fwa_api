// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();

// 🔥 1. PRIMEIRO: config (CORS, body parsers, etc)
require("./config")(app);

// 🔥 2. Middlewares gerais
app.use(morgan("dev"));
app.use(cookieParser());

// 🔥 3. Routes
const webhooksRoutes = require("./webhooks/webhooks.routes");
app.use("/api/webhooks", webhooksRoutes);

const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const cardsRoutes = require("./routes/cards.routes");
app.use("/api", cardsRoutes);

const emailRoutes = require("./routes/email.routes");
app.use("/api/email", emailRoutes);

const analyticsRoutes = require("./routes/analytics.routes");
app.use("/api", analyticsRoutes);

const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);

// 🔥 4. Test route
app.get("/", (req, res) => {
  res.json({ message: "API running 🚀" });
});

// 🔥 5. Error handling (sempre no fim)
require("./error-handling")(app);

module.exports = app;