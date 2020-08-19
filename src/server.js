const express = require("express");
var path = require("path");
const { secretKeyStripe } = require("./stripe");
var bodyParser = require("body-parser");

const prettyPrint = (response) =>
  console.log(JSON.stringify(response, null, 2));

// This could be done using webhooks for the event: source.chargable and source.failed
// https://stripe.com/docs/api/events/types#event_types-source.chargeable
const waitForChargableSource = async (sourceId) => {
  const source = await secretKeyStripe.sources.retrieve(sourceId);
  if (source.status !== "chargeable") {
    return await waitForChargableSource(sourceId);
  }
  return source;
};

const createPaymentIntent = (source) => {
  return secretKeyStripe.paymentIntents.create({
    amount: source.amount,
    currency: source.currency,
    source: source.id,
    payment_method_types: ["klarna"],
    confirm: true,
  });
};

const port = 3000;
const app = express();

app.use(bodyParser.json());

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response) => {
    const event = request.body;
    switch (event.type) {
      case "source.chargeable":
        console.log("source.chargable webhook fired!");
        const source = event.data.object;
        await createPaymentIntent(source);
        break;
      case "source.failed":
        console.log("source.failed webhook fired!");
        break;
      default:
        return response.status(400).end();
    }
    response.json({ received: true });
  }
);
app.use(express.static(path.join(__dirname, "website")));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
