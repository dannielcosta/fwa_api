const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const FRONTEND_URL = process.env.FRONTEND_URL;

module.exports = (app) => {
  app.set("trust proxy", 1);

  const allowedOrigins = FRONTEND_URL || 'https://nfc-me.pt' || 'https://www.nfc-me.pt';

  // Middleware CORS principal
  app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin === FRONTEND_URL ||
      origin === "https://www.nfc-me.pt" ||
      origin.includes("localhost")
    ) {
      return callback(null, true);
    }

    console.warn("CORS bloqueado:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  //credentials: true,
}));

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};
