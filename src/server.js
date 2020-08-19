const express = require("express");
var path = require("path");
const { secretKeyStripe } = require("./stripe");
var bodyParser = require("body-parser");

const port = 3000;
const app = express();

app.use(bodyParser.json());

const printResponse = (response) =>
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

app.post("/api/create-payment-intent/", async (request, response) => {
  console.log(request.body);
  const sourceId = request.body.source;
  const source = await waitForChargableSource(sourceId);
  const charge = await secretKeyStripe.paymentIntents.create({
    amount: source.amount,
    currency: source.currency,
    source: source.id,
    payment_method_types: ["klarna"],
    confirm: true,
  });
  printResponse(charge);
  response.send({ charge: charge });
});

app.use(express.static(path.join(__dirname, "website")));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
