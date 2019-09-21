const pact = require("@pact-foundation/pact");
const { Pact, Matchers, Verifier } = pact;
const { pactFile } = require("../setup");
const getPort = require("get-port");

const providerTest = async () => {
  // STEP 3: Verify provider

  // Create a Provider API with Express
  const express = require("express");
  const server = express();
  const port = await getPort();

  // Get all dogs
  server.get("/dogs", (req, res) => {
    res.json([
      {
        dog: 1,
        name: "rocky"
      }
    ]);
  });

  server.listen(port, () => {
    console.log(`Dog Service listening on http://localhost:${port}`);
  });

  // Run the verification
  const p = {
    provider: "Dog Service",
    providerBaseUrl: `http://localhost:${port}`,
    pactUrls: [pactFile]
  };

  new Verifier()
    .verifyProvider(p)
    .then(output => {
      console.log("Pact Verification Complete!");
      console.log(output);
    })
    .catch(e => {
      console.log(e);
    });
};

module.exports = {
  providerTest
};
