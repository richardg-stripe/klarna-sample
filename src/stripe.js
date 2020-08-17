require("dotenv").config({ path: process.env.DOT_ENV_CONFIG || ".env" });
const stripe = require("stripe");

const secretKeyStripe = stripe(process.env.STRIPE_SECRET_KEY);
const publishableKeyStripe = stripe(process.env.STRIPE_PUBLISHABLE_KEY);
module.exports = { secretKeyStripe, publishableKeyStripe };
