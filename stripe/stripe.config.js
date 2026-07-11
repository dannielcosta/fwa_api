require("dotenv").config();
const Stripe = require("stripe");
//module.exports = new Stripe(process.env.STRIPE_SECRET_KEY);

const key = process.env.TEST_STRIPE_SECRET_KEY;

module.exports = new Stripe(key);
