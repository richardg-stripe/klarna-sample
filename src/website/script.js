const REDIRECT_URL = `${window.location.origin}/completed.html`;
const PUBLIC_KEY =
  "pk_test_51HH3GjKy6MGWtC1Ifgn7eTxDep8ayZinPJSXASknWBWEVOZYlpHXWsQUbsheBlY6EtraMQlVDeNyowpXMWkpJ5Zr00PQnw7f2B";
const stripe = window.Stripe(PUBLIC_KEY);

const createPaymentIntent = async (source) => {
  const result = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source,
    }),
  });
  const response = await result.json();
  console.log(response);
  if (!result.ok) {
    return {
      error: response,
    };
  }

  return {
    ...response,
    error: null,
  };
};

const displayError = (error) => {
  document.querySelector("p#error").textContent = error;
};

const createKlarnaSource = () => {
  return stripe.createSource({
    type: "klarna",
    flow: "redirect",
    redirect: {
      return_url: window.location.origin,
    },
    amount: 10000,
    currency: "gbp",
    klarna: {
      product: "payment",
      purchase_country: "GB",
    },
    source_order: {
      items: [
        {
          type: "sku",
          description: "Grand day out",
          quantity: 1,
          currency: "gbp",
          amount: 10000,
        },
      ],
    },
  });
};

let globalKlarnaSource;

const setupKlarnaWidgets = async () => {
  globalKlarnaSource = await createKlarnaSource();
  Klarna.Payments.init({
    client_token: globalKlarnaSource.source.klarna.client_token,
  });
  Klarna.Payments.load({
    container: "#klarna-pay-later-container",
    payment_method_category: "pay_later",
  });
  Klarna.Payments.load({
    container: "#klarna-pay-over-time-container",
    payment_method_category: "pay_over_time",
  });
};

const redirectToKlarnaMethod = (source, method) => {
  window.location.href = source.klarna[method];
};
const payWithKlarnaWidget = (source, method, container) => {
  Klarna.Payments.authorize(
    {
      container: container,
      payment_method_category: method,
    },
    (result) => {
      console.log(result);
      if (result.approved) {
        window.location.href = `${window.location.href}?source=${source.id}&redirect_status=succeeded&client_secret=${source.client_secret}`;
      }
    }
  );
};

document
  .querySelector("button#klarna-pay-later-redirect")
  .addEventListener("click", async () => {
    const klarnaSource = await createKlarnaSource();
    console.log(klarnaSource);
    redirectToKlarnaMethod(klarnaSource.source, "pay_later_redirect_url");
  });
document
  .querySelector("button#klarna-pay-in-3-redirect")
  .addEventListener("click", async () => {
    const klarnaSource = await createKlarnaSource();
    console.log(klarnaSource);
    redirectToKlarnaMethod(klarnaSource.source, "pay_over_time_redirect_url");
  });
document
  .querySelector("button#klarna-pay-later-widget")
  .addEventListener("click", () => {
    payWithKlarnaWidget(globalKlarnaSource.source, "pay_later");
  });
document
  .querySelector("button#klarna-pay-in-3-widget")
  .addEventListener("click", () => {
    payWithKlarnaWidget(globalKlarnaSource.source, "pay_over_time");
  });

const waitForSourceConsumed = async () => {
  const url = new URL(window.location.href);
  console.log(url);
  const sourceId = url.searchParams.get("source");
  const sourceClientSecret = url.searchParams.get("client_secret");
  if (
    sourceId &&
    sourceClientSecret &&
    url.searchParams.get("redirect_status") === "succeeded"
  ) {
    const source = await stripe.retrieveSource({
      id: sourceId,
      client_secret: sourceClientSecret,
    });
    if (source.source.status === "consumed") {
      window.location.href = "/success.html";
    } else if (["failed", "cancelled"].includes(source.source.status)) {
      console.error("Problem with your payment");
    } else {
      await waitForSourceConsumed();
    }
  }
};

(async () => {
  setupKlarnaWidgets();
  await waitForSourceConsumed();
})();
